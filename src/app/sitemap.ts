import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.truleado.com'
  
  // Define all public routes
  const routes = [
    '',
    '/pricing',
    '/auth/signin',
    '/auth/signup',
    '/resources/blog',
    '/resources/blog/first-100-reddit-leads',
    '/resources/templates',
    '/resources/roi-calculator',
    '/terms',
    '/privacy',
    '/cookie-policy',
    '/gdpr',
    '/refund',
    '/support',
  ]

  // Generate sitemap entries for each route
  const sitemapEntries: MetadataRoute.Sitemap = []

  routes.forEach((route) => {
    const url = `${baseUrl}${route === '' ? '' : route}`
    
    // Set priority and change frequency based on route type
    let priority = 0.8
    let changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' = 'monthly'
    
    if (route === '') {
      // Homepage
      priority = 1.0
      changeFrequency = 'weekly'
    } else if (route === '/pricing' || route === '/auth/signup') {
      priority = 0.9
      changeFrequency = 'monthly'
    } else if (route.includes('/resources')) {
      priority = 0.7
      changeFrequency = 'weekly'
    } else if (route.includes('/auth')) {
      priority = 0.6
      changeFrequency = 'yearly'
    } else if (route.includes('/terms') || route.includes('/privacy') || route.includes('/cookie') || route.includes('/gdpr') || route.includes('/refund')) {
      priority = 0.3
      changeFrequency = 'yearly'
    } else {
      priority = 0.5
      changeFrequency = 'monthly'
    }

    sitemapEntries.push({
      url,
      lastModified: new Date(),
      changeFrequency,
      priority,
    })
  })

  return sitemapEntries
}
