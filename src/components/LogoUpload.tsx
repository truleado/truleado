'use client'

import { useState, useRef } from 'react'
import { Upload, X, Check, AlertCircle } from 'lucide-react'

interface LogoUploadProps {
  currentLogo?: string
  onLogoChange: (logoUrl: string) => void
  className?: string
}

export default function LogoUpload({ currentLogo, onLogoChange, className = '' }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      onLogoChange(data.logoUrl)
      setSuccess(true)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    try {
      const response = await fetch('/api/upload/logo', {
        method: 'DELETE'
      })

      if (response.ok) {
        onLogoChange('')
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      setError('Failed to remove logo')
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Logo Display */}
      {currentLogo && (
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            <img 
              src={currentLogo} 
              alt="Current logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">Current logo</p>
            <button
              onClick={handleRemoveLogo}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Remove logo
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-3">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <Upload className="w-6 h-6 text-gray-400" />
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isUploading ? 'Uploading...' : 'Upload a logo'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Uploading...
              </>
            ) : (
              'Choose File'
            )}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 text-green-600 text-sm">
          <Check className="w-4 h-4" />
          <span>Logo updated successfully!</span>
        </div>
      )}
    </div>
  )
}
