import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { createOrder, addActivity, getUniversities, getAllFaculties, getStepTemplates, serverTimestamp, Timestamp } from '../../lib/firestore'
import { uploadOrderFile } from '../../lib/storage'
import { getTemplateForUniversity } from '../../hooks/useStepTemplate'
import { generateOrderNumber } from '../../utils/orderNumber'
import { DEFAULT_STEPS } from '../../utils/defaultTemplate'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'

function buildInitialSteps(template) {
  const templateSteps = template?.steps || DEFAULT_STEPS
  return templateSteps.map(step => ({
    ...step,
    status: 'pending',
    startedAt: null,
    completedAt: null,
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
    skippedBy: null,
    skippedAt: null,
    attachments: [],
    notes: '',
  }))
}

export default function OrderNew() {
  const { userDoc } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [universities, setUniversities] = useState([])
  const [faculties, setFaculties] = useState([])
  const [templates, setTemplates] = useState([])
  const [poFile, setPoFile] = useState(null)

  const { register, handleSubmit, watch, formState: { errors }, control } = useForm({
    defaultValues: {
      universityId: userDoc?.universityId || '',
      facultyId: userDoc?.facultyId || '',
      title: '',
      poNumber: '',
      notes: '',
      estimatedDelivery: '',
      orderItems: [{ description: '', quantity: 1, colour: '', size: '' }],
    }
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'orderItems' })
  const selectedUniversityId = watch('universityId')

  useEffect(() => {
    Promise.all([getUniversities(), getAllFaculties(), getStepTemplates()])
      .then(([unis, facs, tmps]) => {
        setUniversities(unis)
        setFaculties(facs)
        setTemplates(tmps)
      })
  }, [])

  const filteredFaculties = faculties.filter(f => f.universityId === selectedUniversityId)

  async function onSubmit(data) {
    setLoading(true)
    try {
      const orderNumber = await generateOrderNumber()
      const template = getTemplateForUniversity(templates, data.universityId)
      const steps = buildInitialSteps(template)

      // Activate first step immediately
      if (steps.length > 0) {
        steps[0] = { ...steps[0], status: 'in_progress', startedAt: Timestamp.now() }
      }

      const university = universities.find(u => u.id === data.universityId)
      const faculty = faculties.find(f => f.id === data.facultyId)

      const orderData = {
        orderNumber,
        universityId: data.universityId,
        universityName: university?.name || '',
        facultyId: data.facultyId,
        facultyName: faculty?.name || '',
        createdBy: userDoc.id,
        status: 'active',
        currentStepIndex: 0,
        title: data.title,
        stepTemplateId: template?.id || 'default',
        steps,
        poNumber: data.poNumber,
        poDocumentUrl: '',
        orderItems: data.orderItems.filter(item => item.description.trim()),
        notes: data.notes,
        estimatedDelivery: data.estimatedDelivery
          ? new Date(data.estimatedDelivery)
          : null,
      }

      const ref = await createOrder(orderData)

      // Upload PO if provided
      if (poFile) {
        try {
          const result = await uploadOrderFile(ref.id, 'po', poFile, () => {})
          const updatedSteps = [...steps]
          updatedSteps[0] = {
            ...updatedSteps[0],
            attachments: [{
              name: poFile.name,
              url: result.url,
              fileType: result.fileType,
              uploadedBy: userDoc.id,
              uploadedByName: userDoc.displayName,
              uploadedAt: Timestamp.now(),
              sizeBytes: poFile.size,
            }],
          }
          const { updateOrder } = await import('../../lib/firestore')
          await updateOrder(ref.id, { steps: updatedSteps, poDocumentUrl: result.url })
        } catch {
          toast.error('Order created but PO upload failed')
        }
      }

      await addActivity(ref.id, {
        type: 'order_created',
        stepIndex: null,
        stepTitle: null,
        message: `Order ${orderNumber} created by ${userDoc.displayName}`,
        performedBy: userDoc.id,
        performedByName: userDoc.displayName,
        performedByRole: userDoc.role,
        metadata: { orderNumber },
      })

      toast.success(`Order ${orderNumber} created`)
      navigate(`/orders/${ref.id}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  const canPickUniversity = ['admin', 'super_admin'].includes(userDoc?.role)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-medium text-gray-900 mb-6">New Order</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Order info */}
        <section className="bg-white rounded-lg border border-border-default p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Order details</h2>

          <div className="grid grid-cols-2 gap-4">
            {canPickUniversity && (
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">University</label>
                <select
                  {...register('universityId', { required: 'Select a university' })}
                  className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
                >
                  <option value="">Select university</option>
                  {universities.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                {errors.universityId && <p className="mt-1 text-xs text-danger">{errors.universityId.message}</p>}
              </div>
            )}

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Faculty / Department</label>
              <select
                {...register('facultyId')}
                className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
              >
                <option value="">Select faculty</option>
                {filteredFaculties.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Order title</label>
              <input
                {...register('title', { required: 'Title is required' })}
                placeholder="e.g. Engineering Faculty Hoodies 2026"
                className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
              />
              {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">PO Number</label>
              <input
                {...register('poNumber', { required: 'PO number is required' })}
                placeholder="PO-2026-XXXX"
                className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
              />
              {errors.poNumber && <p className="mt-1 text-xs text-danger">{errors.poNumber.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Estimated delivery</label>
              <input
                type="date"
                {...register('estimatedDelivery')}
                className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">PO Document (optional)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={e => setPoFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-border-default file:text-sm file:bg-white file:text-gray-700 hover:file:bg-surface"
              />
            </div>
          </div>
        </section>

        {/* Order items */}
        <section className="bg-white rounded-lg border border-border-default p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">Order items</h2>
            <button
              type="button"
              onClick={() => append({ description: '', quantity: 1, colour: '', size: '' })}
              className="text-xs text-wits-blue hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> Add item
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, i) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-5">
                  <input
                    {...register(`orderItems.${i}.description`, { required: true })}
                    placeholder="Description (e.g. Grey Hoodie)"
                    className="w-full border border-border-default rounded px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    {...register(`orderItems.${i}.quantity`, { valueAsNumber: true, min: 1 })}
                    placeholder="Qty"
                    className="w-full border border-border-default rounded px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    {...register(`orderItems.${i}.colour`)}
                    placeholder="Colour"
                    className="w-full border border-border-default rounded px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    {...register(`orderItems.${i}.size`)}
                    placeholder="Size"
                    className="w-full border border-border-default rounded px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
                  />
                </div>
                <div className="col-span-1 flex justify-center pt-2">
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-danger">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Notes */}
        <section className="bg-white rounded-lg border border-border-default p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Any additional instructions or context for Distinctive Choice…"
            className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue resize-none"
          />
        </section>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create order
          </Button>
        </div>
      </form>
    </div>
  )
}
