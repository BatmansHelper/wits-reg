import { useEffect, useState } from 'react'
import { getStepTemplates } from '../lib/firestore'

export function useStepTemplates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStepTemplates()
      .then(t => { setTemplates(t); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return { templates, loading }
}

export function getTemplateForUniversity(templates, universityId) {
  // Prefer university-specific template, fall back to global default
  const specific = templates.find(t => t.universityId === universityId)
  if (specific) return specific
  return templates.find(t => t.isDefault) || templates[0] || null
}
