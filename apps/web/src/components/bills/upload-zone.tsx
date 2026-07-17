'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_MB } from '@/lib/constants'

interface UploadZoneProps {
  transporterId: string
  onSuccess?: (billId: string) => void
}

export function UploadZone({ transporterId, onSuccess }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const onDrop = useCallback((accepted: File[]) => {
    setError('')
    setFile(accepted[0] ?? null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    maxFiles: 1,
    onDropRejected: (fileRejections) => {
      setError(fileRejections[0]?.errors[0]?.message ?? 'File rejected')
    },
  })

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('transporter_id', transporterId)

      const res = await fetch('/api/bills', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      onSuccess?.(data.bill_id)
      setFile(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700">
          {isDragActive ? 'Drop the bill here' : 'Drop freight bill or click to upload'}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to {MAX_FILE_SIZE_MB}MB</p>
      </div>

      {file && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button onClick={() => setFile(null)} className="p-1 hover:bg-gray-200 rounded transition-colors">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
        {uploading ? 'Uploading & queuing for audit…' : 'Upload & Audit'}
      </button>
    </div>
  )
}
