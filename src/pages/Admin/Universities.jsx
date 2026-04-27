import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { getUniversities, createUniversity, getAllFaculties, createFaculty } from '../../lib/firestore'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

export default function Universities() {
  const [universities, setUniversities] = useState([])
  const [faculties, setFaculties] = useState([])
  const [loading, setLoading] = useState(true)
  const [uniModal, setUniModal] = useState(false)
  const [facModal, setFacModal] = useState(null) // universityId
  const [uniForm, setUniForm] = useState({ name: '', shortName: '', primaryColour: '#003DA5', accentColour: '#C9A84C' })
  const [facForm, setFacForm] = useState({ name: '', contactEmail: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getUniversities(), getAllFaculties()])
      .then(([unis, facs]) => { setUniversities(unis); setFaculties(facs); setLoading(false) })
  }, [])

  async function handleCreateUniversity() {
    if (!uniForm.name.trim()) return
    setSaving(true)
    try {
      const ref = await createUniversity(uniForm)
      setUniversities(prev => [...prev, { id: ref.id, ...uniForm }])
      setUniModal(false)
      setUniForm({ name: '', shortName: '', primaryColour: '#003DA5', accentColour: '#C9A84C' })
      toast.success('University created')
    } catch {
      toast.error('Failed to create university')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateFaculty() {
    if (!facForm.name.trim() || !facModal) return
    setSaving(true)
    try {
      const ref = await createFaculty({ ...facForm, universityId: facModal })
      setFaculties(prev => [...prev, { id: ref.id, ...facForm, universityId: facModal }])
      setFacModal(null)
      setFacForm({ name: '', contactEmail: '' })
      toast.success('Faculty created')
    } catch {
      toast.error('Failed to create faculty')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-gray-900">Universities</h1>
        <Button onClick={() => setUniModal(true)}>
          <Plus size={16} />
          Add university
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-4 border-wits-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {universities.map(uni => (
            <div key={uni.id} className="bg-white rounded-lg border border-border-default p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: uni.primaryColour || '#003DA5' }}
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{uni.name}</h3>
                    {uni.shortName && <p className="text-xs text-gray-500">{uni.shortName}</p>}
                  </div>
                </div>
                <button
                  onClick={() => setFacModal(uni.id)}
                  className="text-xs text-wits-blue hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Add faculty
                </button>
              </div>
              <div className="space-y-1">
                {faculties.filter(f => f.universityId === uni.id).map(fac => (
                  <div key={fac.id} className="text-sm text-gray-600 pl-4 border-l-2 border-border-default py-0.5">
                    {fac.name}
                    {fac.contactEmail && <span className="text-gray-400 ml-2">· {fac.contactEmail}</span>}
                  </div>
                ))}
                {faculties.filter(f => f.universityId === uni.id).length === 0 && (
                  <p className="text-xs text-gray-400 pl-4">No faculties yet.</p>
                )}
              </div>
            </div>
          ))}
          {universities.length === 0 && (
            <div className="bg-white rounded-lg border border-border-default p-12 text-center">
              <p className="text-gray-400">No universities configured yet.</p>
            </div>
          )}
        </div>
      )}

      {/* New university modal */}
      <Modal
        open={uniModal}
        onClose={() => setUniModal(false)}
        title="Add university"
        footer={
          <>
            <Button variant="ghost" onClick={() => setUniModal(false)}>Cancel</Button>
            <Button onClick={handleCreateUniversity} loading={saving}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
            <input
              value={uniForm.name}
              onChange={e => setUniForm(p => ({ ...p, name: e.target.value }))}
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
              placeholder="University of the Witwatersrand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Short name</label>
            <input
              value={uniForm.shortName}
              onChange={e => setUniForm(p => ({ ...p, shortName: e.target.value }))}
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
              placeholder="Wits"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary colour</label>
              <input
                type="color"
                value={uniForm.primaryColour}
                onChange={e => setUniForm(p => ({ ...p, primaryColour: e.target.value }))}
                className="w-full h-10 border border-border-default rounded-lg px-1 py-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Accent colour</label>
              <input
                type="color"
                value={uniForm.accentColour}
                onChange={e => setUniForm(p => ({ ...p, accentColour: e.target.value }))}
                className="w-full h-10 border border-border-default rounded-lg px-1 py-1"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* New faculty modal */}
      <Modal
        open={!!facModal}
        onClose={() => setFacModal(null)}
        title="Add faculty"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFacModal(null)}>Cancel</Button>
            <Button onClick={handleCreateFaculty} loading={saving}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Faculty name</label>
            <input
              value={facForm.name}
              onChange={e => setFacForm(p => ({ ...p, name: e.target.value }))}
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
              placeholder="Faculty of Engineering & Built Environment"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact email (optional)</label>
            <input
              type="email"
              value={facForm.contactEmail}
              onChange={e => setFacForm(p => ({ ...p, contactEmail: e.target.value }))}
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
              placeholder="engineering@wits.ac.za"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
