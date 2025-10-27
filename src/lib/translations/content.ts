import type { Locale } from './translations'

export const translations = {
  en: {
    hero: {
      headline: "Stop cold emailing strangers.",
      subheadline: "Discover relevant Reddit discussions where people are actively seeking solutions your SaaS product provides.",
      cta: "Start Finding Leads Today",
      ctaSecondary: "See How It Works"
    },
    nav: {
      resources: "Resources",
      pricing: "Pricing",
      signIn: "Sign In",
      getStarted: "Get Started"
    },
    features: {
      title: "How It Works",
      step1: "Research Websites",
      step1Desc: "Analyze any website URL to extract product information, keywords, and understand what problems it solves.",
      step2: "Find Reddit Leads",
      step2Desc: "Discover strategic Reddit opportunities where people are discussing problems your product can solve.",
      step3: "AI Pitch Ideas",
      step3Desc: "Get AI-generated reasoning and sample pitch ideas for each Reddit opportunity to maximize your success.",
      step4: "Track Performance",
      step4Desc: "Save leads, track your Reddit outreach performance, and optimize your strategy with detailed analytics."
    },
    benefits: {
      title: "Why Choose Truleado?",
      description: "Research any website, discover strategic Reddit opportunities, and get AI-powered insights to connect with potential customers.",
      why1: "Save hours of research",
      why2: "Discover high-quality leads",
      why3: "Get pitch-ready ideas",
      why4: "Track your success"
    }
  },
  fr: {
    hero: {
      headline: "Arrêtez d'envoyer des emails froids à des inconnus.",
      subheadline: "Découvrez des discussions Reddit pertinentes où les gens recherchent activement des solutions que votre produit SaaS fournit.",
      cta: "Commencez à Trouver des Prospects Aujourd'hui",
      ctaSecondary: "Voir Comment Ça Marche"
    },
    nav: {
      resources: "Ressources",
      pricing: "Tarifs",
      signIn: "Se Connecter",
      getStarted: "Commencer"
    }
  },
  de: {
    hero: {
      headline: "Hören Sie auf, Fremden kalte E-Mails zu senden.",
      subheadline: "Entdecken Sie relevante Reddit-Diskussionen, in denen Menschen aktiv nach Lösungen suchen, die Ihr SaaS-Produkt bietet.",
      cta: "Beginnen Sie Noch Heute mit der Lead-Generierung",
      ctaSecondary: "So Funktioniert Es"
    },
    nav: {
      resources: "Ressourcen",
      pricing: "Preise",
      signIn: "Anmelden",
      getStarted: "Loslegen"
    }
  },
  es: {
    hero: {
      headline: "Deje de enviar correos fríos a desconocidos.",
      subheadline: "Descubra discusiones relevantes de Reddit donde las personas buscan activamente soluciones que su producto SaaS proporciona.",
      cta: "Comience a Encontrar Leads Hoy",
      ctaSecondary: "Ver Cómo Funciona"
    },
    nav: {
      resources: "Recursos",
      pricing: "Precios",
      signIn: "Iniciar Sesión",
      getStarted: "Comenzar"
    }
  },
  zh: {
    hero: {
      headline: "停止向陌生人发送冷邮件。",
      subheadline: "发现人们在Reddit上积极寻找您的SaaS产品提供的解决方案的相关讨论。",
      cta: "今天开始寻找潜在客户",
      ctaSecondary: "了解工作原理"
    },
    nav: {
      resources: "资源",
      pricing: "定价",
      signIn: "登录",
      getStarted: "开始使用"
    }
  },
  ja: {
    hero: {
      headline: "見知らぬ人への冷たいメールをやめる。",
      subheadline: "あなたのSaaS製品が提供するソリューションを積極的に探している人々のRedditの関連ディスカッションを発見してください。",
      cta: "今日からリードを見つける",
      ctaSecondary: "仕組みを見る"
    },
    nav: {
      resources: "リソース",
      pricing: "価格",
      signIn: "ログイン",
      getStarted: "始める"
    }
  },
  ko: {
    hero: {
      headline: "낯선 사람에게 차가운 이메일을 보내는 것을 중단하세요.",
      subheadline: "귀하의 SaaS 제품이 제공하는 솔루션을 적극적으로 찾고 있는 사람들의 Reddit 관련 토론을 발견하세요.",
      cta: "오늘 리드 찾기 시작",
      ctaSecondary: "작동 방식 보기"
    },
    nav: {
      resources: "리소스",
      pricing: "가격",
      signIn: "로그인",
      getStarted: "시작하기"
    }
  },
  it: {
    hero: {
      headline: "Smettila di inviare email fredde a sconosciuti.",
      subheadline: "Scopri discussioni Reddit pertinenti dove le persone cercano attivamente soluzioni che il tuo prodotto SaaS fornisce.",
      cta: "Inizia a Trovare Lead Oggi",
      ctaSecondary: "Vedi Come Funziona"
    },
    nav: {
      resources: "Risorse",
      pricing: "Prezzi",
      signIn: "Accedi",
      getStarted: "Inizia"
    }
  },
  ar: {
    hero: {
      headline: "توقف عن إرسال رسائل بريد إلكتروني غير مألوفة للغرباء.",
      subheadline: "اكتشف مناقشات Reddit ذات الصلة حيث يبحث الأشخاص بنشاط عن حلول يوفرها منتج SaaS الخاص بك.",
      cta: "ابدأ في العثور على العملاء المحتملين اليوم",
      ctaSecondary: "شاهد كيف يعمل"
    },
    nav: {
      resources: "الموارد",
      pricing: "الأسعار",
      signIn: "تسجيل الدخول",
      getStarted: "ابدأ"
    }
  },
  nl: {
    hero: {
      headline: "Stop met het versturen van koude e-mails aan vreemden.",
      subheadline: "Ontdek relevante Reddit-discussies waarin mensen actief op zoek zijn naar oplossingen die uw SaaS-product biedt.",
      cta: "Begin Vandaag met het Vinden van Leads",
      ctaSecondary: "Zie Hoe Het Werkt"
    },
    nav: {
      resources: "Bronnen",
      pricing: "Prijzen",
      signIn: "Inloggen",
      getStarted: "Aan de Slag"
    }
  }
} as const

export type TranslationKey = keyof typeof translations.en
export type TranslationPath = 'hero.headline' | 'hero.subheadline' | 'hero.cta' | 'hero.ctaSecondary' | 'nav.resources' | 'nav.pricing' | 'nav.signIn' | 'nav.getStarted'

export function getTranslation(locale: Locale, path: TranslationPath): string {
  const keys = path.split('.') as [string, string]
  const section = translations[locale]?.[keys[0] as keyof typeof translations.en]
  const value = section?.[keys[1] as keyof typeof section]
  return value || translations.en[keys[0] as keyof typeof translations.en]?.[keys[1 as keyof typeof section] ] || ''
}

