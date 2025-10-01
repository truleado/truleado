# 🔧 How to Get Environment Variables from Vercel

## **Step 1: Access Your Vercel Dashboard**

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Find your Truleado project** in the dashboard
3. **Click on your project** to open it

## **Step 2: Get Environment Variables**

1. **Click on "Settings"** tab in your project
2. **Click on "Environment Variables"** in the left sidebar
3. **Copy each variable** you need:

### **Required Variables to Copy:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REDDIT_OAUTH_CLIENT_ID`
- `REDDIT_OAUTH_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

## **Step 3: Create Local Environment File**

Create a `.env.local` file in your project root:

```bash
# Copy the values from Vercel and paste them here
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url-from-vercel
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-vercel
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-vercel
REDDIT_OAUTH_CLIENT_ID=your-reddit-client-id-from-vercel
REDDIT_OAUTH_CLIENT_SECRET=your-reddit-client-secret-from-vercel
NEXTAUTH_SECRET=your-nextauth-secret-from-vercel
NEXTAUTH_URL=http://localhost:3000
```

## **Step 4: Alternative - Use Vercel CLI**

If you have Vercel CLI installed:

```bash
# Install Vercel CLI if you don't have it
npm i -g vercel

# Login to Vercel
vercel login

# Pull environment variables from Vercel
vercel env pull .env.local
```

## **Step 5: Test the Setup**

After setting up the environment variables:

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Test the connection:**
   ```bash
   node test-reddit-token-refresh.js
   ```

3. **Check if lead discovery works:**
   - Go to `http://localhost:3000/leads`
   - Look for leads in the dashboard

## **Important Notes**

- **Never commit `.env.local`** to git (it's already in .gitignore)
- **Keep your environment variables secure**
- **Make sure all required variables are present**
- **Restart the server after adding new variables**

## **Troubleshooting**

If you're still getting "fetch failed" errors:

1. **Check that all variables are copied correctly**
2. **Make sure there are no extra spaces or quotes**
3. **Verify the Supabase URL format: `https://your-project.supabase.co`**
4. **Check that the service role key is the correct one**

---

**Once you have the environment variables set up, your auto lead finding should start working immediately!**
