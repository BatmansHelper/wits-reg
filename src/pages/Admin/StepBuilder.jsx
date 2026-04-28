import { useState, useEffect } from 'react'
import { Plus, GripVertical, Pencil, Trash2, Layers, X } from 'lucide-react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getStepTemplates, createStepTemplate, updateStepTemplate, deleteStepTemplate } from '../../lib/firestore'
import { DEFAULT_STEPS } from '../../utils/defaultTemplate'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

const ROLES = ['super_admin', 'admin']
const ROLE_LABELS = { super_admin: 'Super Admin', admin: 'Admin' }

function StepCard({ step, index, onEdit, onDelete, id }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="bg-white border border-gray-200 rounded-xl flex items-start gap-3 p-4 shadow-sm"
    >
      <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 mt-0.5 cursor-grab">
        <GripVertical size={16} />
      </button>
      <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: step.colour || '#003DA5' }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 font-medium">Step {index + 1}</span>
          {step.requiresApproval && (
            <span className="text-xs bg-wits-gold-light text-warning px-1.5 py-0.5 rounded-md font-medium">Approval required</span>
          )}
          {step.canBeSkipped && (
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">Skippable</span>
          )}
        </div>
        <h4 className="font-semibold text-gray-900 mt-0.5">{step.title}</h4>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{step.description}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
          {step.allowedUploaders?.length > 0 && (
            <span>Uploads: {step.allowedUploaders.map(r => ROLE_LABELS[r]).join(', ')}</span>
          )}
          {step.allowedApprovers?.length > 0 && (
            <span>Approves: {step.allowedApprovers.map(r => ROLE_LABELS[r]).join(', ')}</span>
          )}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => onEdit(index)} className="p-1.5 text-gray-400 hover:text-wits-blue transition-colors rounded-lg hover:bg-gray-50">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(index)} className="p-1.5 text-gray-400 hover:text-danger transition-colors rounded-lg hover:bg-gray-50">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

const BLANK_STEP = {
  title: '', description: '', requiresApproval: false, canBeSkipped: false,
  allowedUploaders: [], allowedApprovers: [], uploadTypes: [], notifyRoles: [], colour: '#003DA5',
}

export default function StepBuilder() {
  const { userDoc } = useAuth()
  const [templates, setTemplates] = useState([])
  const [activeTemplateId, setActiveTemplateId] = useState(null)
  const [steps, setSteps] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stepModal, setStepModal] = useState(null)
  const [editStep, setEditStep] = useState(BLANK_STEP)

  // New template modal
  const [newTplOpen, setNewTplOpen] = useState(false)
  const [newTplName, setNewTplName] = useState('')
  const [newTplCreating, setNewTplCreating] = useState(false)

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    getStepTemplates().then(t => {
      setTemplates(t)
      if (t.length > 0) { setActiveTemplateId(t[0].id); setSteps(t[0].steps || []) }
      setLoading(false)
    })
  }, [])

  function selectTemplate(id) {
    const t = templates.find(t => t.id === id)
    if (!t) return
    setActiveTemplateId(id)
    setSteps(t.steps || [])
  }

  async function createNewTemplate() {
    if (!newTplName.trim()) return
    setNewTplCreating(true)
    try {
      const ref = await createStepTemplate({
        name: newTplName.trim(),
        universityId: null,
        isDefault: templates.length === 0,
        steps: [],
        createdBy: userDoc.id,
      })
      const newT = { id: ref.id, name: newTplName.trim(), isDefault: templates.length === 0, steps: [] }
      setTemplates(prev => [...prev, newT])
      setActiveTemplateId(ref.id)
      setSteps([])
      setNewTplOpen(false)
      setNewTplName('')
      toast.success(`Template "${newT.name}" created`)
    } catch { toast.error('Failed to create template') }
    finally { setNewTplCreating(false) }
  }

  async function confirmDeleteTemplate(id) {
    try {
      await deleteStepTemplate(id)
      const remaining = templates.filter(t => t.id !== id)
      setTemplates(remaining)
      if (activeTemplateId === id) {
        setActiveTemplateId(remaining[0]?.id || null)
        setSteps(remaining[0]?.steps || [])
      }
      setDeleteConfirmId(null)
      toast.success('Template deleted')
    } catch { toast.error('Failed to delete template') }
  }

  async function saveTemplate() {
    if (!activeTemplateId) return
    setSaving(true)
    try {
      const numbered = steps.map((s, i) => ({ ...s, stepNumber: i + 1 }))
      await updateStepTemplate(activeTemplateId, { steps: numbered })
      setTemplates(prev => prev.map(t => t.id === activeTemplateId ? { ...t, steps: numbered } : t))
      toast.success('Template saved')
    } catch { toast.error('Failed to save template') }
    finally { setSaving(false) }
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = steps.findIndex((_, i) => `step-${i}` === active.id)
      const newIndex = steps.findIndex((_, i) => `step-${i}` === over.id)
      setSteps(arrayMove(steps, oldIndex, newIndex))
    }
  }

  function openAddStep() { setEditStep(BLANK_STEP); setStepModal('new') }
  function openEditStep(index) { setEditStep({ ...steps[index] }); setStepModal(index) }
  function handleDeleteStep(index) { setSteps(prev => prev.filter((_, i) => i !== index)) }

  function saveStep() {
    if (!editStep.title.trim()) return
    if (stepModal === 'new') {
      setSteps(prev => [...prev, editStep])
    } else {
      setSteps(prev => prev.map((s, i) => i === stepModal ? editStep : s))
    }
    setStepModal(null)
  }

  function toggleRole(field, role) {
    setEditStep(prev => ({
      ...prev,
      [field]: prev[field]?.includes(role)
        ? prev[field].filter(r => r !== role)
        : [...(prev[field] || []), role],
    }))
  }

  const activeTemplate = templates.find(t => t.id === activeTemplateId)

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-4 border-wits-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Step Builder</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create and manage order process templates</p>
        </div>
        <Button onClick={() => setNewTplOpen(true)}>
          <Plus size={16} />
          New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Layers size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No templates yet</p>
          <p className="text-sm text-gray-400 mt-1">Create a template to define the order process steps.</p>
          <button
            onClick={() => setNewTplOpen(true)}
            className="mt-4 text-sm text-wits-blue font-semibold hover:underline"
          >
            Create your first template →
          </button>
        </div>
      ) : (
        <>
          {/* Template tabs */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {templates.map(t => (
              <div key={t.id} className="flex items-center">
                <button
                  onClick={() => selectTemplate(t.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-l-xl border transition-colors font-medium ${
                    activeTemplateId === t.id
                      ? 'bg-wits-blue text-white border-wits-blue'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-wits-blue hover:text-wits-blue'
                  }`}
                >
                  {t.name}
                  {t.isDefault && <span className={`text-xs ${activeTemplateId === t.id ? 'opacity-60' : 'text-gray-400'}`}>· default</span>}
                </button>
                <button
                  onClick={() => setDeleteConfirmId(t.id)}
                  className={`px-2 py-2 text-sm rounded-r-xl border border-l-0 transition-colors ${
                    activeTemplateId === t.id
                      ? 'bg-wits-blue text-white/60 border-wits-blue hover:text-white'
                      : 'bg-white text-gray-300 border-gray-200 hover:text-danger hover:border-danger'
                  }`}
                  title="Delete template"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Steps list */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Template</p>
                <p className="text-base font-bold text-gray-900 mt-0.5">{activeTemplate?.name}</p>
              </div>
              <span className="text-sm text-gray-400">{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
            </div>

            {steps.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No steps yet — add your first step below.</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={steps.map((_, i) => `step-${i}`)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {steps.map((step, i) => (
                      <StepCard
                        key={`step-${i}`}
                        id={`step-${i}`}
                        step={step}
                        index={i}
                        onEdit={openEditStep}
                        onDelete={handleDeleteStep}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openAddStep}
              className="flex items-center gap-1.5 text-sm text-wits-blue hover:underline font-semibold"
            >
              <Plus size={14} /> Add step
            </button>
            <div className="flex-1" />
            <Button onClick={saveTemplate} loading={saving}>
              Save template
            </Button>
          </div>
        </>
      )}

      {/* New template modal */}
      <Modal
        open={newTplOpen}
        onClose={() => { setNewTplOpen(false); setNewTplName('') }}
        title="New Template"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setNewTplOpen(false); setNewTplName('') }}>Cancel</Button>
            <Button onClick={createNewTemplate} loading={newTplCreating} disabled={!newTplName.trim()}>
              Create template
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-500 mb-4">Give this template a name. You can add steps to it after creation.</p>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Template name</label>
        <input
          value={newTplName}
          onChange={e => setNewTplName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createNewTemplate()}
          placeholder="e.g. Engineering Faculty Process"
          className="w-full border border-border-default rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
          autoFocus
        />
      </Modal>

      {/* Delete template confirm */}
      <Modal
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete template"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => confirmDeleteTemplate(deleteConfirmId)}>
              Delete template
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          This will permanently delete the template and all its steps. Orders that used this template are not affected.
        </p>
      </Modal>

      {/* Step edit/add modal */}
      <Modal
        open={stepModal !== null}
        onClose={() => setStepModal(null)}
        title={stepModal === 'new' ? 'Add step' : 'Edit step'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setStepModal(null)}>Cancel</Button>
            <Button onClick={saveStep} disabled={!editStep.title.trim()}>
              {stepModal === 'new' ? 'Add step' : 'Save changes'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
            <input
              value={editStep.title}
              onChange={e => setEditStep(p => ({ ...p, title: e.target.value }))}
              className="w-full border border-border-default rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
              placeholder="e.g. Design Sign-Off"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              value={editStep.description}
              onChange={e => setEditStep(p => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full border border-border-default rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue resize-none"
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={editStep.requiresApproval}
                onChange={e => setEditStep(p => ({ ...p, requiresApproval: e.target.checked }))}
                className="rounded border-border-default text-wits-blue focus:ring-wits-blue"
              />
              Requires approval
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={editStep.canBeSkipped}
                onChange={e => setEditStep(p => ({ ...p, canBeSkipped: e.target.checked }))}
                className="rounded border-border-default text-wits-blue focus:ring-wits-blue"
              />
              Can be skipped
            </label>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Who can upload</label>
            <div className="flex flex-wrap gap-3">
              {ROLES.map(r => (
                <label key={r} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editStep.allowedUploaders?.includes(r)}
                    onChange={() => toggleRole('allowedUploaders', r)}
                    className="rounded border-border-default text-wits-blue"
                  />
                  {ROLE_LABELS[r]}
                </label>
              ))}
            </div>
          </div>
          {editStep.requiresApproval && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Who can approve</label>
              <div className="flex flex-wrap gap-3">
                {ROLES.map(r => (
                  <label key={r} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editStep.allowedApprovers?.includes(r)}
                      onChange={() => toggleRole('allowedApprovers', r)}
                      className="rounded border-border-default text-wits-blue"
                    />
                    {ROLE_LABELS[r]}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Step colour</label>
            <input
              type="color"
              value={editStep.colour || '#003DA5'}
              onChange={e => setEditStep(p => ({ ...p, colour: e.target.value }))}
              className="w-12 h-10 border border-border-default rounded-xl px-1 py-1 cursor-pointer"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
