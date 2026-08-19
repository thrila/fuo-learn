import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Upload, FileText } from 'lucide-react'
import * as api from '../services/api'
import type { FormEvent } from 'react'

export default function MaterialUploadPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file || !courseId) return
    setError('')
    setUploading(true)
    try {
      await api.uploadMaterial(courseId, file, title || undefined)
      navigate(`/courses/${courseId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 md:px-8">
      <h1 className="text-3xl font-bold text-text-primary">Upload Material</h1>
      <p className="mt-2 text-text-muted">Upload a PDF or PowerPoint file.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
        )}

        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-disabled"
            placeholder="Material title"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">File</label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.ppt,.pptx"
            onChange={handleFileChange}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-lg border-2 border-dashed border-border-default bg-white px-4 py-6 text-sm text-text-muted transition-colors hover:border-primary hover:text-primary"
          >
            {file ? (
              <>
                <FileText className="h-5 w-5" />
                {file.name}
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Choose file (PDF, PPT, PPTX)
              </>
            )}
          </button>
        </div>

        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </div>
  )
}
