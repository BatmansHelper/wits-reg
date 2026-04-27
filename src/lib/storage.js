import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

export function uploadOrderFile(orderId, stepIndex, file, onProgress) {
  const path = `orders/${orderId}/step-${stepIndex}/${Date.now()}-${file.name}`
  const storageRef = ref(storage, path)
  const task = uploadBytesResumable(storageRef, file)

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      snapshot => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        onProgress?.(pct)
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve({ url, path, name: file.name, sizeBytes: file.size, fileType: getFileType(file) })
      }
    )
  })
}

export function uploadReferenceImage(orderId, file, onProgress) {
  const path = `orders/${orderId}/reference/${Date.now()}-${file.name}`
  const storageRef = ref(storage, path)
  const task = uploadBytesResumable(storageRef, file)

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      snapshot => onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve({ url, path, name: file.name, sizeBytes: file.size, fileType: getFileType(file) })
      }
    )
  })
}

export function deleteOrderFile(path) {
  return deleteObject(ref(storage, path))
}

function getFileType(file) {
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type.startsWith('image/')) return 'image'
  return 'doc'
}
