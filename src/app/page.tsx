import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to default locale
  redirect('/en')
}

