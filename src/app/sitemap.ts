import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.truleado.com'
  
  // Define all public routes
  const routes = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/pricing', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/auth/signin', priority: 0.6, changeFrequency: 'yearly' },
    { path: '/auth/signup', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/resources/blog', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/resources/blog/first-100-reddit-leads', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/resources/blog/ultimate-reddit-marketing-strategy', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/resources/blog/ai-powered-vs-manual-research', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/resources/blog/reddit-communities-for-saas-founders', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/resources/blog/cold-email-to-warm-conversations', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/resources/blog/reddit-seo-optimization', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/resources/blog/reddit-marketing-automation', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/resources/blog/reddit-subreddit-monitoring', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/resources/blog/reddit-outreach-best-practices', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/resources/blog/reddit-marketing-roi', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/resources/blog/reddit-lead-qualification', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/resources/templates', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/resources/roi-calculator', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/cookie-policy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/gdpr', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/refund', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/support', priority: 0.5, changeFrequency: 'monthly' },
  ]

  // Generate sitemap entries for each route
  const sitemapEntries: MetadataRoute.Sitemap = []

  routes.forEach((route) => {
    const url = `${baseUrl}${route.path === '' ? '' : route.path}`
    
    sitemapEntries.push({
      url,
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })
  })

  return sitemapEntries
}
