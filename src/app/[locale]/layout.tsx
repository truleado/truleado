import type { Metadata } from 'next'
import type { Locale } from '@/lib/translations'

type Props = {
  params: Promise<{ locale: Locale }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  
  return {
    title: 'Reddit Marketing Platform | AI-Powered Lead Discovery for SaaS | Truleado',
    description: 'Master Reddit marketing with AI-powered tools. Automate lead discovery, monitor conversations in real-time, and scale your SaaS outreach. Start your free trial today.',
    keywords: 'reddit marketing, reddit lead generation, reddit outreach, saas marketing, reddit advertising, reddit monitoring, social media marketing, reddit strategy',
    openGraph: {
      title: 'Truleado - Master Reddit Marketing with AI',
      description: 'Automate your Reddit marketing strategy with AI-powered lead discovery and intelligent outreach tools.',
      type: 'website',
      url: `https://www.truleado.com/${locale}`,
    },
    alternates: {
      languages: {
        'en': 'https://www.truleado.com/en',
        'fr': 'https://www.truleado.com/fr',
        'de': 'https://www.truleado.com/de',
        'es': 'https://www.truleado.com/es',
        'zh': 'https://www.truleado.com/zh',
        'ja': 'https://www.truleado.com/ja',
        'ko': 'https://www.truleado.com/ko',
        'it': 'https://www.truleado.com/it',
        'ar': 'https://www.truleado.com/ar',
        'nl': 'https://www.truleado.com/nl',
      },
    },
  }
}

export default function LocaleLayout({ children }: Props) {
  return children
}

