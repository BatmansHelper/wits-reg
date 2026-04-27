import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, Image, File } from 'lucide-react'
import { uploadOrderFile } from '../../lib/storage'
import { formatFileSize } from '../../utils/formatters'
import toast from 'react-hot-toast'

const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
}

function FileIcon({ type }) {
  if (type === 'image') return <Image size={16} className="text-wits-blue" />
  if (type === 'pdf') return <FileText size={16} className="text-danger" />
  return <File size={16} className="text-gray-400" />
}

export default function DocumentUploader({ orderId, stepIndex, onUploaded, disabled }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback(async acceptedFiles => {
    if (!acceptedFiles.length || uploading) return
    setUploading(true)
    setProgress(0)

    try {
      for (const file of acceptedFiles) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 20 MB limit`)
          continue
        }
        const result = await uploadOrderFile(orderId, stepIndex, file, setProgress)
        await onUploaded(result, file)
      }
      toast.success('File uploaded successfully')
    } catch (err) {
      toast.error('Upload failed — please try again')
      console.error(err)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [orderId, stepIndex, onUploaded, uploading])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: 20 * 1024 * 1024,
    disabled: disabled || uploading,
    multiple: true,
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-wits-blue bg-wits-blue-light' : 'border-border-default hover:border-wits-blue-mid'}
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload size={24} className="mx-auto text-gray-400 mb-2" />
        {uploading ? (
          <div>
            <p className="text-sm text-gray-600">Uploading... {progress}%</p>
            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-wits-blue rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              {isDragActive ? 'Drop files here' : 'Drag & drop files, or click to browse'}
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF, Word, images — max 20 MB</p>
          </>
        )}
      </div>
    </div>
  )
}
