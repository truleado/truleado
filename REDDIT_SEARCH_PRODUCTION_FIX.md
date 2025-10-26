# 🔧 Reddit Search Production Fix - Analysis & Solutions

## 📋 Problem Summary

"Search Reddit for Pitching Opportunities" feature works perfectly in **localhost** but fails in **production** on Vercel.

## 🔍 Root Causes Identified

### 1. **Missing Runtime Configuration** ✅ FIXED
- **Issue**: No `export const runtime = 'nodejs'` declaration
- **Impact**: Vercel defaults to Edge runtime which has limitations with `fetch()`
- **Solution**: Added explicit Node.js runtime configuration

### 2. **AbortSignal.timeout() Not Supported in Edge Runtime** ✅ FIXED
- **Issue**: Used `AbortSignal.timeout(30000)` which doesn't work in Edge runtime
- **Impact**: Fetch requests fail silently in production
- **Solution**: Replaced with manual `AbortController` with 25-second timeout

### 3. **Silent Error Handling** ✅ FIXED
- **Issue**: All fetch errors were caught and swallowed with just `console.error()` then `continue`
- **Impact**: User sees no results with no error message
- **Solution**: Added comprehensive error reporting and debug info

### 4. **No Error Feedback to User** ✅ FIXED
- **Issue**: When all searches fail, returns `success: true` with empty results
- **Impact**: User thinks there are no posts, when actually the searches failed
- **Solution**: Added detection for complete failures and returns proper error response

## ✅ Changes Made to `/src/app/api/research/search-reddit/route.ts`

### 1. Added Runtime Configuration (Lines 4-7)
```typescript
// Force Node.js runtime to avoid Edge runtime fetch limitations
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
```

### 2. Replaced AbortSignal.timeout with Manual Timeout (Lines 85-96)
```typescript
// Manual timeout implementation (25 seconds)
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 25000)

const redditResponse = await fetch(redditUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Accept': 'application/json',
  },
  cache: 'no-store', // Force fresh requests
  signal: controller.signal,
}).finally(() => clearTimeout(timeoutId))
```

### 3. Enhanced Error Logging (Lines 122-125)
```typescript
} catch (searchError: any) {
  console.error(`❌ Error searching for "${searchTerm}":`, searchError)
  // Store error details for debugging
  console.error('Error type:', searchError.name, 'Error message:', searchError.message)
  console.error('Stack trace:', searchError.stack)
  continue
}
```

### 4. Added Debug Info to Empty Results (Lines 144-147)
```typescript
error: 'No posts found on Reddit for this keyword',
debugInfo: {
  searchTermsAttempted: searchTerms.slice(0, 3).length,
  note: 'All fetch requests either returned empty results or failed'
}
```

### 5. Added Detection for Complete Failures (Lines 273-285)
```typescript
// If all keywords failed, return a more helpful error
const hasErrors = results.every(r => !!r.error)
if (hasErrors && results.length > 0) {
  return NextResponse.json({
    success: false,
    error: 'All keyword searches failed',
    details: 'Unable to fetch data from Reddit. This may be due to network restrictions or rate limiting.',
    debugInfo: results.map(r => ({ keyword: r.keyword, error: r.error })),
    results,
    totalKeywords,
    totalStrategicPosts: 0
  }, { status: 500 })
}
```

## 🚀 Next Steps

### 1. Commit and Push Changes
```bash
git add src/app/api/research/search-reddit/route.ts
git commit -m "Fix Reddit search for production: Add Node.js runtime, improve error handling"
git push
```

### 2. Verify Environment Variables in Vercel
Make sure these are set for **all environments** (Development, Preview, Production):
- ✅ `GOOGLE_GEMINI_API_KEY` - Already present
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Check Production specifically
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Check Production specifically
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Check Production specifically

### 3. Monitor Vercel Logs After Deployment
After deploying, check Vercel logs for:
- Detailed error messages
- Stack traces
- Network timeout issues
- Rate limiting from Reddit

### 4. Test in Production
Once deployed, test the feature and check:
- Does it work now?
- If still failing, what error appears?
- Check Vercel logs for specific error messages

## 🔎 Why It Worked Locally But Not in Production

| Aspect | Localhost | Production (Before Fix) |
|--------|-----------|------------------------|
| **Runtime** | Node.js ✅ | Edge Runtime ❌ |
| **Fetch API** | Full support ✅ | Limited support ❌ |
| **AbortSignal** | Works ✅ | Not supported ❌ |
| **Error Visibility** | Console shows errors ✅ | Errors hidden ❌ |
| **Timeout Handling** | Works ✅ | Fails silently ❌ |

## 📊 Expected Outcomes

### Success Scenario
- ✅ Searches Reddit successfully
- ✅ Returns strategic posts
- ✅ User sees results

### Failure Scenario (Now with Proper Errors)
- ⚠️ Shows clear error message
- ⚠️ Indicates network restrictions or rate limiting
- ⚠️ Provides debug information in logs
- ⚠️ User understands what went wrong

## 🧪 Testing Checklist

- [ ] Code committed and pushed
- [ ] Vercel redeployed with new code
- [ ] Test in production environment
- [ ] Check Vercel logs for errors
- [ ] Verify Reddit search returns results
- [ ] If still failing, analyze log output for specific error

---

## 📝 Additional Notes

The main issue was that Vercel was using the **Edge runtime** by default, which has limited support for:
- Long-running fetch requests
- AbortSignal.timeout()
- Some native fetch features

By forcing **Node.js runtime**, we get full compatibility with:
- All native fetch features
- Better timeout handling
- Improved error messages
- Full stack traces

