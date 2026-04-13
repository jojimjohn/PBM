import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../context/AuthContext'
import vehicleExpenseSheetService from '../../services/vehicleExpenseSheetService'
import vehicleService from '../../services/vehicleService'
import employeeService from '../../services/employeeService'
import tankLogService from '../../services/tankLogService'
import showToast from '../../components/ui/Toast'
import { ArrowLeft, Save, Send, CheckCircle, Plus, Trash2, AlertTriangle } from 'lucide-react'

const EXPENSE_CATEGORIES = [
  { value: 'fuel', label: 'Fuel' },
  { value: 'food', label: 'Food' },
  { value: 'medical', label: 'Medical' },
  { value: 'vehicle_repair', label: 'Vehicle Repair' },
  { value: 'water', label: 'Water' },
  { value: 'material_purchase', label: 'Material Purchase' },
  { value: 'other', label: 'Other' }
]

const STATUS_BADGE = {
  open: 'badge badge-info',
  submitted: 'badge badge-pending',
  approved: 'badge badge-active',
  closed: 'badge badge-neutral'
}

const TODAY = new Date().toISOString().split('T')[0]

const ExpenseSheetDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission('MANAGE_EXPENSE_SHEETS')
  const canApprove = hasPermission('APPROVE_EXPENSE_SHEETS')
  const isNew = id === 'new'

  const [sheet, setSheet] = useState({
    sheet_date: TODAY, vehicle_id: null, vehicle_plate: '',
    driver_employee_id: null, helper_employee_id: null,
    advance_given: 0, old_balance: 0, external_transfers: [],
    tank_id: null, density_notes: '', notes: '', status: 'open'
  })
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  // Lookups
  const [vehicles, setVehicles] = useState([])
  const [employees, setEmployees] = useState([])
  const [drivers, setDrivers] = useState([])
  const [helpers, setHelpers] = useState([])
  const [tanks, setTanks] = useState([])

  // Load lookups
  useEffect(() => {
    vehicleService.getAll({ status: 'active' }).then(r => {
      if (r.success) setVehicles(r.data)
    })
    employeeService.getAll({ status: 'active', limit: 200 }).then(r => {
      if (r.success) {
        setEmployees(r.data)
        // Filter drivers and helpers for dropdowns
        setDrivers(r.data.filter(e => e.employee_type === 'driver' || !e.employee_type))
        setHelpers(r.data.filter(e => e.employee_type === 'helper' || !e.employee_type))
      }
    })
    tankLogService.getTanks(true).then(r => r.success && setTanks(r.data))
  }, [])

  // Load existing sheet
  const loadSheet = useCallback(async () => {
    if (isNew) return
    setLoading(true)
    const result = await vehicleExpenseSheetService.getById(id)
    if (result.success && result.data) {
      const { items: sheetItems, ...sheetData } = result.data
      setSheet(sheetData)
      setItems(sheetItems || [])
    } else {
      navigate('/expense-sheets')
    }
    setLoading(false)
  }, [id, isNew, navigate])

  useEffect(() => { loadSheet() }, [loadSheet])

  // Auto-fetch carry-forward when vehicle plate changes (new sheets only)
  useEffect(() => {
    if (!isNew || !sheet.vehicle_plate || sheet.vehicle_plate.length < 3) return
    vehicleExpenseSheetService.getCarryForward(sheet.vehicle_plate, sheet.sheet_date).then(result => {
      if (result.success && result.data) {
        setSheet(prev => ({ ...prev, old_balance: result.data.closing_balance || 0 }))
      }
    })
  }, [isNew, sheet.vehicle_plate, sheet.sheet_date])

  // Auto-populate vehicle_plate when vehicle selected
  const handleVehicleSelect = (vehicleId) => {
    const v = vehicles.find(veh => veh.id === parseInt(vehicleId))
    setSheet(prev => ({
      ...prev,
      vehicle_id: vehicleId ? parseInt(vehicleId) : null,
      vehicle_plate: v ? v.vehicle_plate : prev.vehicle_plate
    }))
  }

  // Computed totals
  const transferTotal = (sheet.external_transfers || []).reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
  const totalAvailable = parseFloat(sheet.old_balance || 0) + parseFloat(sheet.advance_given || 0) + transferTotal
  const totalExpenses = items.reduce((s, item) => s + (parseFloat(item.amount) || 0), 0)
  const closingBalance = totalAvailable - totalExpenses

  const isReadOnly = sheet.status === 'approved' || sheet.status === 'closed'

  // Item management
  const addItem = () => setItems(prev => [...prev, { expense_category: 'fuel', description: '', amount: 0, receipt_path: '' }])
  const updateItem = (idx, field, value) => setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

  // Transfer management
  const addTransfer = () => setSheet(prev => ({ ...prev, external_transfers: [...(prev.external_transfers || []), { from_person: '', amount: 0, transfer_type: '' }] }))
  const updateTransfer = (idx, field, value) => {
    setSheet(prev => {
      const transfers = [...(prev.external_transfers || [])]
      transfers[idx] = { ...transfers[idx], [field]: value }
      return { ...prev, external_transfers: transfers }
    })
  }
  const removeTransfer = (idx) => setSheet(prev => ({ ...prev, external_transfers: (prev.external_transfers || []).filter((_, i) => i !== idx) }))

  // Save
  const handleSave = async () => {
    if (!sheet.vehicle_plate.trim()) { showToast.error('Vehicle plate is required'); return }
    setSaving(true)
    const payload = {
      sheet_date: sheet.sheet_date,
      vehicle_id: sheet.vehicle_id,
      vehicle_plate: sheet.vehicle_plate.toUpperCase(),
      driver_employee_id: sheet.driver_employee_id || null,
      helper_employee_id: sheet.helper_employee_id || null,
      advance_given: parseFloat(sheet.advance_given) || 0,
      old_balance: parseFloat(sheet.old_balance) || 0,
      external_transfers: sheet.external_transfers || [],
      tank_id: sheet.tank_id || null,
      density_notes: sheet.density_notes || '',
      notes: sheet.notes || '',
      items: items.map(item => ({
        expense_category: item.expense_category,
        description: item.description || '',
        amount: parseFloat(item.amount) || 0,
        receipt_path: item.receipt_path || ''
      }))
    }

    const result = isNew
      ? await vehicleExpenseSheetService.create(payload)
      : await vehicleExpenseSheetService.update(id, payload)

    if (result.success) {
      showToast.success(isNew ? 'Sheet created' : 'Sheet saved')
      if (isNew && result.data?.id) navigate(`/expense-sheets/${result.data.id}`, { replace: true })
      else loadSheet()
    } else {
      showToast.error(result.error || 'Failed to save')
    }
    setSaving(false)
  }

  const handleSubmit = async () => {
    if (!confirm('Submit this sheet for approval? It cannot be edited after submission.')) return
    const result = await vehicleExpenseSheetService.submit(id)
    if (result.success) { showToast.success('Sheet submitted'); loadSheet() }
    else showToast.error(result.error)
  }

  const handleApprove = async () => {
    if (!confirm('Approve this expense sheet?')) return
    const result = await vehicleExpenseSheetService.approve(id)
    if (result.success) { showToast.success('Sheet approved'); loadSheet() }
    else showToast.error(result.error)
  }

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/expense-sheets')} className="btn btn-outline btn-sm"><ArrowLeft size={16} /></button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {isNew ? 'New Expense Sheet' : `${sheet.vehicle_plate} — ${sheet.sheet_date}`}
            </h1>
            {!isNew && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className={STATUS_BADGE[sheet.status]}>{sheet.status?.toUpperCase()}</span>
                {sheet.driver_name && <span className="text-xs text-slate-500">Driver: {sheet.driver_name}</span>}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isReadOnly && (
            <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <AlertTriangle size={12} /> Read-only (approved)
            </span>
          )}
          {!isReadOnly && canManage && (
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Draft'}
            </button>
          )}
          {!isNew && sheet.status === 'open' && canManage && (
            <button className="btn btn-outline" onClick={handleSubmit}>
              <Send size={16} /> Submit
            </button>
          )}
          {!isNew && sheet.status === 'submitted' && canApprove && (
            <button className="btn btn-primary" onClick={handleApprove} style={{ backgroundColor: 'var(--emerald-600, #059669)' }}>
              <CheckCircle size={16} /> Approve
            </button>
          )}
        </div>
      </div>

      <div className="px-6 pb-6 space-y-6">
        {/* Vehicle & Personnel */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="form-section">
            <div className="form-section-title">Vehicle & Personnel</div>
            <div className="form-grid">
              <div className="form-group">
                <label>Date *</label>
                <input type="date" value={sheet.sheet_date} max={TODAY} onChange={e => setSheet(p => ({ ...p, sheet_date: e.target.value }))} disabled={!isNew} />
              </div>
              <div className="form-group">
                <label>Vehicle</label>
                <select value={sheet.vehicle_id || ''} onChange={e => handleVehicleSelect(e.target.value)} disabled={isReadOnly}>
                  <option value="">Select or type plate...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_plate} — {v.make || ''} {v.model || ''}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Vehicle Plate *</label>
                <input type="text" value={sheet.vehicle_plate} onChange={e => setSheet(p => ({ ...p, vehicle_plate: e.target.value.toUpperCase() }))} disabled={isReadOnly} placeholder="e.g. AB 1234" />
              </div>
              <div className="form-group">
                <label>Driver</label>
                <select value={sheet.driver_employee_id || ''} onChange={e => setSheet(p => ({ ...p, driver_employee_id: e.target.value ? parseInt(e.target.value) : null }))} disabled={isReadOnly}>
                  <option value="">Select driver...</option>
                  {(drivers.length > 0 ? drivers : employees).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_code}){emp.employee_type ? ` — ${emp.employee_type}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Helper</label>
                <select value={sheet.helper_employee_id || ''} onChange={e => setSheet(p => ({ ...p, helper_employee_id: e.target.value ? parseInt(e.target.value) : null }))} disabled={isReadOnly}>
                  <option value="">Select helper...</option>
                  {(helpers.length > 0 ? helpers : employees).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_code}){emp.employee_type ? ` — ${emp.employee_type}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tank (oil stored in)</label>
                <select value={sheet.tank_id || ''} onChange={e => setSheet(p => ({ ...p, tank_id: e.target.value ? parseInt(e.target.value) : null }))} disabled={isReadOnly}>
                  <option value="">No tank</option>
                  {tanks.map(t => <option key={t.id} value={t.id}>{t.tank_number}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Cash Flow */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="form-section">
            <div className="form-section-title">Cash Flow</div>
            <div className="form-grid">
              <div className="form-group">
                <label>Morning Advance (OMR)</label>
                <input type="number" step="0.001" value={sheet.advance_given} onChange={e => setSheet(p => ({ ...p, advance_given: e.target.value }))} disabled={isReadOnly} />
              </div>
              <div className="form-group">
                <label>Old Balance (carry-forward)</label>
                <input type="number" step="0.001" value={sheet.old_balance} onChange={e => setSheet(p => ({ ...p, old_balance: e.target.value }))} disabled={isReadOnly} />
              </div>
              <div className="form-group">
                <label>Total Available</label>
                <input type="text" value={totalAvailable.toFixed(3)} disabled className="font-mono font-bold" />
              </div>
            </div>

            {/* External Transfers */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">External Transfers</label>
                {!isReadOnly && <button className="text-xs text-accent hover:underline flex items-center gap-0.5" onClick={addTransfer}><Plus size={10} /> Add Transfer</button>}
              </div>
              {(sheet.external_transfers || []).map((t, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <div className="form-group" style={{ flex: 2 }}>
                    <input type="text" value={t.from_person} onChange={e => updateTransfer(idx, 'from_person', e.target.value)} placeholder="From person" disabled={isReadOnly} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <input type="number" step="0.001" value={t.amount} onChange={e => updateTransfer(idx, 'amount', e.target.value)} placeholder="Amount" disabled={isReadOnly} className="text-right font-mono" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <input type="text" value={t.transfer_type || ''} onChange={e => updateTransfer(idx, 'transfer_type', e.target.value)} placeholder="Type (cash/transfer)" disabled={isReadOnly} />
                  </div>
                  {!isReadOnly && <button className="btn-icon text-red-400" onClick={() => removeTransfer(idx)}><Trash2 size={14} /></button>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expense Items */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="form-section">
            <div className="flex items-center justify-between mb-4">
              <div className="form-section-title" style={{ margin: 0 }}>Expense Items</div>
              {!isReadOnly && <button className="btn btn-primary btn-sm" onClick={addItem}><Plus size={14} /> Add Expense</button>}
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No expenses recorded yet</p>
            ) : (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="form-group" style={{ width: 160 }}>
                      <select value={item.expense_category} onChange={e => updateItem(idx, 'expense_category', e.target.value)} disabled={isReadOnly}>
                        {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <input type="text" value={item.description || ''} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Description" disabled={isReadOnly} />
                    </div>
                    <div className="form-group" style={{ width: 120 }}>
                      <input type="number" step="0.001" value={item.amount} onChange={e => updateItem(idx, 'amount', e.target.value)} className="text-right font-mono" disabled={isReadOnly} />
                    </div>
                    {!isReadOnly && <button className="btn-icon text-red-400" onClick={() => removeItem(idx)}><Trash2 size={14} /></button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="form-section">
            <div className="form-section-title">Summary</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <dt className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Total Available</dt>
                <dd className="mt-1 text-lg font-mono font-bold text-slate-800">{totalAvailable.toFixed(3)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-bold tracking-widest text-red-500">Total Expenses</dt>
                <dd className="mt-1 text-lg font-mono font-bold text-red-600">{totalExpenses.toFixed(3)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Closing Balance</dt>
                <dd className={`mt-1 text-lg font-mono font-bold ${closingBalance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {closingBalance.toFixed(3)}
                  {closingBalance < 0 && <span className="text-xs ml-2 text-red-500">(Driver owes)</span>}
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Density & Notes */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="form-section">
            <div className="form-grid">
              <div className="form-group">
                <label>Density / Quality Notes</label>
                <textarea rows={2} value={sheet.density_notes || ''} onChange={e => setSheet(p => ({ ...p, density_notes: e.target.value }))} disabled={isReadOnly} placeholder="e.g. Density .87 less .207, water 25.807" />
              </div>
              <div className="form-group">
                <label>General Notes</label>
                <textarea rows={2} value={sheet.notes || ''} onChange={e => setSheet(p => ({ ...p, notes: e.target.value }))} disabled={isReadOnly} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExpenseSheetDetailPage
