import { useState, useEffect } from 'react'
import { Plus, GripVertical, Pencil, Trash2, Layers } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getStepTemplates, createStepTemplate, updateStepTemplate, deleteStepTemplate } from '../../lib/firestore'
import { DEFAULT_STEPS } from '../../utils/defaultTemplate'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

const ROLES = ['super_admin', 'admin', 'university_staff', 'production']
const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'University Admin',
  university_staff: 'University Staff',
  production: 'Distinctive Choice',
}

function StepCard({ step, index, onEdit, onDelete, id }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-border-default rounded-lg flex items-start gap-3 p-4">
      <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 mt-0.5 cursor-grab">
        <GripVertical size={16} />
      </button>
      <div
        className="w-1 self-stretch rounded-full flex-shrink-0"
        style={{ backgroundColor: step.colour || '#003DA5' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Step {index + 1}</span>
          {step.requiresApproval && (
            <span className="text-xs bg-wits-gold-light text-warning px-1.5 py-0.5 rounded">Approval required</span>
          )}
          {step.canBeSkipped && (
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Skippable</span>
          )}
        </div>
        <h4 className="font-medium text-gray-900 mt-0.5">{step.title}</h4>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{step.description}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
          {step.allowedUploaders?.length > 0 && (
            <span>Uploads: {step.allowedUploaders.map(r => ROLE_LABELS[r]).join(', ')}</span>
          )}
          {step.allowedApprovers?.length > 0 && (
            <span>Approves: {step.allowedApprovers.map(r => ROLE_LABELS[r]).join(', ')}</span>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        <button onClick={() => onEdit(index)} className="p-1.5 text-gray-400 hover:text-wits-blue transition-colors">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(index)} className="p-1.5 text-gray-400 hover:text-danger transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

const BLANK_STEP = {
  title: '',
  description: '',
  requiresApproval: false,
  canBeSkipped: false,
  allowedUploaders: [],
  allowedApprovers: [],
  uploadTypes: [],
  notifyRoles: [],
  colour: '#003DA5',
}

export default function StepBuilder() {
  const { userDoc } = useAuth()
  const [templates, setTemplates] = useState([])
  const [activeTemplateId, setActiveTemplateId] = useState(null)
  const [steps, setSteps] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stepModal, setStepModal] = useState(null) // null | 'new' | index
  const [editStep, setEditStep] = useState(BLANK_STEP)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    getStepTemplates().then(t => {
      setTemplates(t)
      if (t.length > 0) {
        setActiveTemplateId(t[0].id)
        setSteps(t[0].steps || [])
      }
      setLoading(false)
    })
  }, [])

  function selectTemplate(id) {
    const t = templates.find(t => t.id === id)
    if (!t) return
    setActiveTemplateId(id)
    setSteps(t.steps || [])
  }

  async function seedDefault() {
    setSaving(true)
    try {
      const ref = await createStepTemplate({
        name: 'Default Process',
        universityId: null,
        isDefault: true,
        steps: DEFAULT_STEPS,
        createdBy: userDoc.id,
      })
      const newT = { id: ref.id, name: 'Default Process', isDefault: true, steps: DEFAULT_STEPS }
      setTemplates(prev => [...prev, newT])
      setActiveTemplateId(ref.id)
      setSteps(DEFAULT_STEPS)
      toast.success('Default template created')
    } catch {
      toast.error('Failed to create template')
    } finally {
      setSaving(false)
    }
  }

  async function saveTemplate() {
    if (!activeTemplateId) return
    setSaving(true)
    try {
      const numbered = steps.map((s, i) => ({ ...s, stepNumber: i + 1 }))
      await updateStepTemplate(activeTemplateId, { steps: numbered })
      setTemplates(prev => prev.map(t => t.id === activeTemplateId ? { ...t, steps: numbered } : t))
      toast.success('Template saved')
    } catch {
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = steps.findIndex((_, i) => `step-${i}` === active.id)
      const newIndex = steps.findIndex((_, i) => `step-${i}` === over.id)
      setSteps(arrayMove(steps, oldIndex, newIndex))
    }
  }

  function openAddStep() {
    setEditStep(BLANK_STEP)
    setStepModal('new')
  }

  function openEditStep(index) {
    setEditStep({ ...steps[index] })
    setStepModal(index)
  }

  function handleDeleteStep(index) {
    setSteps(prev => prev.filter((_, i) => i !== index))
  }

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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-4 border-wits-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-gray-900">Step Builder</h1>
        {templates.length === 0 && (
          <Button onClick={seedDefault} loading={saving}>
            <Layers size={16} />
            Create default template
          </Button>
        )}
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-lg border border-border-default p-12 text-center">
          <Layers size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">No step templates yet. Create the default 5-step process to get started.</p>
        </div>
      ) : (
        <>
          {/* Template selector */}
          {templates.length > 1 && (
            <div className="flex gap-2 mb-5">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => selectTemplate(t.id)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    activeTemplateId === t.id
                      ? 'bg-wits-blue text-white border-wits-blue'
                      : 'bg-white text-gray-600 border-border-default hover:border-wits-blue'
                  }`}
                >
                  {t.name}
                  {t.isDefault && <span className="ml-1 text-xs opacity-70">· default</span>}
                </button>
              ))}
            </div>
          )}

          {/* Step list */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={steps.map((_, i) => `step-${i}`)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 mb-4">
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

          <div className="flex items-center gap-3">
            <button
              onClick={openAddStep}
              className="flex items-center gap-1.5 text-sm text-wits-blue hover:underline"
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

      {/* Step edit modal */}
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input
              value={editStep.title}
              onChange={e => setEditStep(p => ({ ...p, title: e.target.value }))}
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
              placeholder="e.g. Design Sign-Off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={editStep.description}
              onChange={e => setEditStep(p => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue resize-none"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Who can upload</label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map(r => (
                <label key={r} className="flex items-center gap-1.5 text-xs cursor-pointer">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Who can approve</label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(r => (
                  <label key={r} className="flex items-center gap-1.5 text-xs cursor-pointer">
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Step colour</label>
            <input
              type="color"
              value={editStep.colour || '#003DA5'}
              onChange={e => setEditStep(p => ({ ...p, colour: e.target.value }))}
              className="w-12 h-10 border border-border-default rounded-lg px-1 py-1"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
