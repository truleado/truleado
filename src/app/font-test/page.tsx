'use client'

export default function FontTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Font Test - Söhne/Inter Implementation
          </h1>
          
          <div className="space-y-8">
            {/* Font Family Display */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Font Family Stack</h2>
              <p className="text-gray-600 mb-2">
                Primary: Inter (Google Fonts)
              </p>
              <p className="text-gray-600 mb-2">
                Fallback: Söhne, SF Pro Display, SF Pro Text, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
              </p>
            </div>

            {/* Typography Scale */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Typography Scale</h2>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-gray-900">Heading 1 - 4xl Bold</h1>
                <h2 className="text-3xl font-semibold text-gray-800">Heading 2 - 3xl Semibold</h2>
                <h3 className="text-2xl font-medium text-gray-700">Heading 3 - 2xl Medium</h3>
                <h4 className="text-xl font-medium text-gray-600">Heading 4 - xl Medium</h4>
                <h5 className="text-lg font-medium text-gray-600">Heading 5 - lg Medium</h5>
                <h6 className="text-base font-medium text-gray-600">Heading 6 - base Medium</h6>
                <p className="text-base text-gray-600">Body text - base Regular</p>
                <p className="text-sm text-gray-500">Small text - sm Regular</p>
                <p className="text-xs text-gray-400">Extra small text - xs Regular</p>
              </div>
            </div>

            {/* Font Weights */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Font Weights</h2>
              <div className="space-y-2">
                <p className="text-lg font-thin text-gray-600">Thin (100) - The quick brown fox jumps over the lazy dog</p>
                <p className="text-lg font-extralight text-gray-600">Extra Light (200) - The quick brown fox jumps over the lazy dog</p>
                <p className="text-lg font-light text-gray-600">Light (300) - The quick brown fox jumps over the lazy dog</p>
                <p className="text-lg font-normal text-gray-600">Normal (400) - The quick brown fox jumps over the lazy dog</p>
                <p className="text-lg font-medium text-gray-600">Medium (500) - The quick brown fox jumps over the lazy dog</p>
                <p className="text-lg font-semibold text-gray-600">Semibold (600) - The quick brown fox jumps over the lazy dog</p>
                <p className="text-lg font-bold text-gray-600">Bold (700) - The quick brown fox jumps over the lazy dog</p>
                <p className="text-lg font-extrabold text-gray-600">Extra Bold (800) - The quick brown fox jumps over the lazy dog</p>
                <p className="text-lg font-black text-gray-600">Black (900) - The quick brown fox jumps over the lazy dog</p>
              </div>
            </div>

            {/* UI Components */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">UI Components</h2>
              <div className="space-y-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
                  Primary Button
                </button>
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200">
                  Secondary Button
                </button>
                <input 
                  type="text" 
                  placeholder="Input field with Inter font"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea 
                  placeholder="Textarea with Inter font"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            {/* Special Characters */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Special Characters & International</h2>
              <div className="space-y-2">
                <p className="text-lg text-gray-600">English: The quick brown fox jumps over the lazy dog</p>
                <p className="text-lg text-gray-600">Numbers: 0123456789</p>
                <p className="text-lg text-gray-600">Symbols: !@#$%^&*()_+-=[]{}|;':",./&lt;&gt;?</p>
                <p className="text-lg text-gray-600">German: Söhne font implementation test</p>
                <p className="text-lg text-gray-600">French: Test d'implémentation de la police Söhne</p>
                <p className="text-lg text-gray-600">Spanish: Prueba de implementación de fuente Söhne</p>
              </div>
            </div>

            {/* Code Example */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Code Example</h2>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                <code className="text-sm">
{`// Font implementation in CSS
body {
  font-family: 'Inter', 'Söhne', 'SF Pro Display', 'SF Pro Text', 
               -apple-system, BlinkMacSystemFont, 'Segoe UI', 
               'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

// Tailwind config
fontFamily: {
  sans: ['Inter', 'Söhne', 'SF Pro Display', 'SF Pro Text', 
         '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 
         'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
}`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}