'use client'

import AppLayout from '@/components/app-layout'

export default function HowToUse() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">How to Use Truleado</h1>
          
          <div className="mb-6">
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/v4YAQ9qrsKo"
                title="How to Use Truleado"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-600">
              Watch the video above to learn how to use Truleado effectively. This tutorial covers all the key features and workflows.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

