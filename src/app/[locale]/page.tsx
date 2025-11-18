'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Sparkles,
  Target,
  FileText,
  TrendingUp,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { PublicHeader } from '@/components/PublicHeader'
import { Footer } from '@/components/Footer'
import type { Locale } from '@/lib/translations'
import { translations } from '@/lib/full-homepage-translations'

type Props = {
  params: { locale: Locale }
}

const CORE_FEATURES = [
  {
    title: 'Find customers on Reddit',
    description: 'We scan thousands of subreddits every hour and surface threads where people literally describe your problem space.',
    proof: 'Leads include search intent, buying temperature, and link to the live conversation.',
    icon: Target,
  },
  {
    title: 'Create subreddit-ready content',
    description: 'Instantly turn each opportunity into a first-person post or reply that feels native to that community.',
    proof: 'Our AI mirrors tone, slang, and format rules for 2,500+ subreddits.',
    icon: FileText,
  },
  {
    title: 'Earn karma & grow organically',
    description: 'Plan replies, log follow-ups, and keep your karma flywheel spinning without sounding spammy.',
    proof: 'Truleado reminds you when to rejoin threads and tracks what actually drove upvotes or demos.',
    icon: TrendingUp,
  },
]

const PROOF_POINTS = [
  'No cold outreach. Join conversations already asking for you.',
  'Every draft is fact-checked against your landing page before we show it.',
  'Activity tracker nudges you when momentum is fading.',
]

const MINI_HIGHLIGHT = 'No credit card required'

export default function Home({ params }: Props) {
  const { locale } = params
  const t = translations[locale] || translations.en
  const [isClient, setIsClient] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (!isClient) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <img src="/truleadologo.png" alt="Truleado" className="w-full h-full object-contain" />
          </div>
          <p className="text-gray-600 font-medium">{t.loading}</p>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <img src="/truleadologo.png" alt="Truleado" className="w-full h-full object-contain" />
          </div>
          <p className="text-gray-600 font-medium">{t.redirecting}</p>
        </div>
      </div>
    )
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Truleado',
    description:
      'Truleado helps SaaS teams find ready-to-buy customers on Reddit, create content people upvote, and earn karma organically.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '29',
      priceCurrency: 'USD',
    },
  }

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Truleado',
    url: 'https://www.truleado.com',
    logo: 'https://www.truleado.com/truleadologo.png',
    description: 'Find customers on Reddit, create subreddit-ready content, and grow karma with Truleado.',
    sameAs: ['https://x.com/truleado', 'https://www.facebook.com/truleado', 'https://www.instagram.com/truleado/'],
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />

      <PublicHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
            <Sparkles className="h-3 w-3" />
            All-in-one Reddit marketing tool
            </div>
          <h1 className="text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Your buyers are on Reddit. We show you exactly where.
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-gray-600">
            Truleado surfaces the conversations asking for what you build, drafts subreddit-ready replies, and keeps your outreach and karma flywheel organized.
            </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF4500] to-[#FF6A00] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
              >
                Start finding customers
              <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                href={`/${locale}/pricing`}
              className="text-sm font-semibold text-gray-700 underline-offset-4 hover:text-gray-900 hover:underline"
              >
              See pricing
              </Link>
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            {MINI_HIGHLIGHT}
          </p>
      </section>

        <section className="rounded-3xl border border-gray-100 bg-black/5 p-4 sm:p-6">
          <div className="aspect-video w-full overflow-hidden rounded-2xl shadow-lg">
            <iframe
              src="https://www.youtube.com/embed/v4YAQ9qrsKo"
              title="Truleado demo"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-8 sm:p-12">
          <div className="mb-8 text-center sm:text-left">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Our 3 pillars</p>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Everything revolves around these three wins</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {CORE_FEATURES.map(({ title, description, proof, icon: Icon }) => (
              <div
                key={title}
                className="group flex flex-col rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-gray-200"
              >
                <div className="mb-6 inline-flex items-center justify-center rounded-full bg-gray-900 p-3.5 shadow-sm transition-transform group-hover:scale-110">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">{title}</h3>
                <p className="mb-6 flex-1 text-base leading-relaxed text-gray-600">{description}</p>
                <div className="rounded-xl bg-gray-50/80 p-4 ring-1 ring-gray-100/50">
                  <p className="text-sm leading-relaxed text-gray-600">{proof}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5 rounded-3xl border border-gray-100 p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Why teams stay with us</p>
            <h2 className="text-3xl font-bold text-gray-900">Built for helpful founders, not spammers.</h2>
            <p className="text-base text-gray-600">
              Truleado keeps your Reddit strategy authentic. We surface buyer intent, craft posts in your voice, and show
              you when it’s time to follow up so you stay consistent without sounding salesy.
            </p>
            <div className="space-y-3">
              {PROOF_POINTS.map((point) => (
                <div key={point} className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-green-500" />
                  {point}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white/80 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">What you’ll see inside</p>
            <div className="mt-6 space-y-4 text-sm text-gray-600">
              {[
                {
                  icon: MessageSquare,
                  title: 'Live Reddit conversations',
                  body: 'Every opportunity includes summary, keyword match, sentiment, and the direct link so you can jump in confidently.',
                },
                {
                  icon: FileText,
                  title: 'Draft posts & replies',
                  body: 'We extract proof points from your site, rewrite them in first-person, and respect each subreddit’s rules automatically.',
                },
                {
                  icon: TrendingUp,
                  title: 'Karma & response tracker',
                  body: 'Log interactions, see what earned upvotes or DMs, and get pinged when conversations heat back up.',
                },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl border border-gray-100/80 bg-gray-50/80 p-4">
                  <div className="mb-2 inline-flex items-center gap-2 text-gray-900">
                    <Icon className="h-4 w-4" />
                    <span className="font-semibold">{title}</span>
                  </div>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <section className="bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Grow the right way</p>
          <h3 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Ready to turn Reddit into a steady channel?
          </h3>
          <p className="mt-3 text-base text-gray-600">
            Start with the posts and subreddits that already want what you’re building.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF4500] to-[#FF6A00] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
            >
              Start finding customers
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link 
              href="/resources/blog"
              className="text-sm font-semibold text-gray-700 underline-offset-4 hover:text-gray-900 hover:underline"
            >
              Browse playbooks
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

