'use client'

export default function FontTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Font Test Page - SF Pro Verification
          </h1>
          
          <div className="space-y-6">
            {/* Headings */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Headings</h2>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">H1 - Bold Heading</h1>
                <h2 className="text-2xl font-semibold">H2 - Semibold Heading</h2>
                <h3 className="text-xl font-medium">H3 - Medium Heading</h3>
                <h4 className="text-lg font-medium">H4 - Medium Heading</h4>
                <h5 className="text-base font-medium">H5 - Medium Heading</h5>
                <h6 className="text-sm font-medium">H6 - Medium Heading</h6>
              </div>
            </section>

            {/* Body Text */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Body Text</h2>
              <div className="space-y-2">
                <p className="text-lg">Large paragraph text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                <p className="text-base">Regular paragraph text - Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                <p className="text-sm">Small paragraph text - Ut enim ad minim veniam, quis nostrud exercitation.</p>
                <p className="text-xs">Extra small paragraph text - Duis aute irure dolor in reprehenderit.</p>
              </div>
            </section>

            {/* Buttons */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Buttons</h2>
              <div className="flex flex-wrap gap-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded font-medium">
                  Primary Button
                </button>
                <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-medium">
                  Secondary Button
                </button>
                <button className="bg-red-600 text-white px-4 py-2 rounded font-semibold">
                  Danger Button
                </button>
                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded font-medium">
                  Outline Button
                </button>
              </div>
            </section>

            {/* Form Elements */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Form Elements</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text Input
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter text here"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Textarea
                  </label>
                  <textarea 
                    placeholder="Enter longer text here"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md h-20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option>Option 1</option>
                    <option>Option 2</option>
                    <option>Option 3</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Font Weights */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Font Weights</h2>
              <div className="space-y-2">
                <p className="font-thin">Thin (100) - The quick brown fox jumps over the lazy dog</p>
                <p className="font-light">Light (300) - The quick brown fox jumps over the lazy dog</p>
                <p className="font-normal">Normal (400) - The quick brown fox jumps over the lazy dog</p>
                <p className="font-medium">Medium (500) - The quick brown fox jumps over the lazy dog</p>
                <p className="font-semibold">Semibold (600) - The quick brown fox jumps over the lazy dog</p>
                <p className="font-bold">Bold (700) - The quick brown fox jumps over the lazy dog</p>
                <p className="font-extrabold">Extrabold (800) - The quick brown fox jumps over the lazy dog</p>
                <p className="font-black">Black (900) - The quick brown fox jumps over the lazy dog</p>
              </div>
            </section>

            {/* Code Elements */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Code Elements</h2>
              <div className="space-y-2">
                <p>Inline <code className="bg-gray-100 px-2 py-1 rounded text-sm">code</code> element</p>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                  <code>// Code block example
const example = 'SF Pro font test';
console.log(example);</code>
                </pre>
              </div>
            </section>

            {/* Third-party Component Simulation */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Third-party Components</h2>
              <div className="space-y-2">
                <div className="headlessui-test p-4 border rounded">
                  <p className="text-sm">HeadlessUI component simulation</p>
                </div>
                <div className="supabase-test p-4 border rounded">
                  <p className="text-sm">Supabase component simulation</p>
                </div>
                <div className="paddle-test p-4 border rounded">
                  <p className="text-sm">Paddle component simulation</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
