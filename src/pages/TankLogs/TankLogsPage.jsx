import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import { useLocalization } from '../../context/LocalizationContext'
import tankLogService from '../../services/tankLogService'
import showToast from '../../components/ui/Toast'
import TankFormModal from './components/TankFormModal'
import CollectionEntriesPanel from './components/CollectionEntriesPanel'
import { Save, Plus, RefreshCw, ChevronLeft, ChevronRight, Droplet, Settings, History } from 'lucide-react'

const TODAY = new Date().toISOString().split('T')[0]

const TABS = [
  { id: 'daily-log', label: 'Daily Log', icon: Droplet },
  { id: 'tanks', label: 'Storage Tanks', icon: Settings }
]

const TankLogsPage = () => {
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const { t } = useLocalization()
  const canManage = hasPermission('MANAGE_TANK_LOGS')

  const [activeTab, setActiveTab] = useState('daily-log')
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [tankData, setTankData] = useState([])
  const [drafts, setDrafts] = useState({}) // keyed by tank_id
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Tank management state
  const [tanks, setTanks] = useState([])
  const [showTankModal, setShowTankModal] = useState(false)
  const [editingTank, setEditingTank] = useState(null)
  const [tankSaving, setTankSaving] = useState(false)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    const result = await tankLogService.getLogsByDate(selectedDate)
    if (result.success) {
      setTankData(result.data)
      // Initialize drafts from loaded data
      const newDrafts = {}
      result.data.forEach(({ tank, log, collections, prev_net_closing }) => {
        newDrafts[tank.id] = {
          opening_stock: log ? parseFloat(log.opening_stock) : (prev_net_closing ?? 0),
          closing_stock: log ? parseFloat(log.closing_stock) : 0,
          sales: log ? parseFloat(log.sales) : 0,
          client_type: log?.client_type || null,
          notes: log?.notes || '',
          updated_at: log?.updated_at || null,
          collections: collections || [],
          dirty: false
        }
      })
      setDrafts(newDrafts)
    }
    setLoading(false)
  }, [selectedDate])

  const loadTanks = useCallback(async () => {
    const result = await tankLogService.getTanks()
    if (result.success) setTanks(result.data)
  }, [])

  useEffect(() => { loadLogs() }, [loadLogs])
  useEffect(() => { if (activeTab === 'tanks') loadTanks() }, [activeTab, loadTanks])

  const updateDraft = (tankId, field, value) => {
    setDrafts(prev => ({
      ...prev,
      [tankId]: { ...prev[tankId], [field]: value, dirty: true }
    }))
  }

  const handleDateNav = (delta) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + delta)
    const newDate = d.toISOString().split('T')[0]
    if (newDate <= TODAY) setSelectedDate(newDate)
  }

  const handleSaveAll = async () => {
    setSaving(true)
    const dirtyTanks = Object.entries(drafts).filter(([_, d]) => d.dirty)

    let successCount = 0
    for (const [tankId, draft] of dirtyTanks) {
      const result = await tankLogService.saveLog({
        log_date: selectedDate,
        tank_id: parseInt(tankId),
        opening_stock: draft.opening_stock,
        closing_stock: draft.closing_stock,
        sales: draft.sales,
        client_type: draft.client_type,
        notes: draft.notes,
        updated_at: draft.updated_at,
        collections: draft.collections.map(c => ({
          vehicle_id: c.vehicle_id || null,
          vehicle_plate: c.vehicle_plate || null,
          collected_quantity: c.collected_quantity,
          notes: c.notes || null
        }))
      })

      if (result.success) {
        successCount++
      } else if (result.error?.includes('modified by another user')) {
        showToast.error(`Conflict on tank ${tankId} — reload to see latest changes`)
      } else {
        showToast.error(result.error || `Failed to save tank ${tankId}`)
      }
    }

    if (successCount > 0) {
      showToast.success(`Saved ${successCount} tank log(s)`)
      loadLogs() // Reload to get updated_at
    }
    setSaving(false)
  }

  const handleSaveTank = async (formData) => {
    setTankSaving(true)
    const result = editingTank
      ? await tankLogService.updateTank(editingTank.id, formData)
      : await tankLogService.createTank(formData)
    if (result.success) {
      showToast.success(editingTank ? 'Tank updated' : 'Tank created')
      setShowTankModal(false); setEditingTank(null); loadTanks(); loadLogs()
    } else showToast.error(result.error)
    setTankSaving(false)
  }

  const dirtyCount = Object.values(drafts).filter(d => d.dirty).length

  // Compute totals across all tanks
  const totals = {
    opening: Object.values(drafts).reduce((s, d) => s + (parseFloat(d.opening_stock) || 0), 0),
    closing: Object.values(drafts).reduce((s, d) => s + (parseFloat(d.closing_stock) || 0), 0),
    sales: Object.values(drafts).reduce((s, d) => s + (parseFloat(d.sales) || 0), 0),
    collections: Object.values(drafts).reduce((s, d) => s + d.collections.reduce((cs, c) => cs + (parseFloat(c.collected_quantity) || 0), 0), 0)
  }
  totals.netClosing = totals.closing - totals.sales

  const numClass = "font-mono text-right"
  const inputClass = "w-full text-right font-mono"

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-slate-900">
      {/* Tabs */}
      <div className="tab-navigation">
        {TABS.map(tab => (
          <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Daily Log Tab */}
      {activeTab === 'daily-log' && (
        <div className="p-6 space-y-4">
          {/* Date Nav + Save */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="btn btn-outline btn-sm" onClick={() => handleDateNav(-1)}><ChevronLeft size={16} /></button>
              <input type="date" value={selectedDate} max={TODAY} onChange={e => e.target.value <= TODAY && setSelectedDate(e.target.value)}
                className="px-3 py-2 text-sm font-mono border border-slate-300 rounded-md" />
              <button className="btn btn-outline btn-sm" onClick={() => handleDateNav(1)} disabled={selectedDate >= TODAY}><ChevronRight size={16} /></button>
              <button className="btn btn-outline btn-sm" onClick={loadLogs}><RefreshCw size={14} /></button>
            </div>
            <div className="flex items-center gap-2">
              {dirtyCount > 0 && <span className="text-xs text-amber-600 font-medium">{dirtyCount} unsaved</span>}
              {canManage && (
                <button className="btn btn-primary" onClick={handleSaveAll} disabled={saving || dirtyCount === 0}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save All'}
                </button>
              )}
            </div>
          </div>

          {/* Tank Grid */}
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading...</div>
          ) : tankData.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <Droplet size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No storage tanks configured. Go to the "Storage Tanks" tab to add tanks.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest w-40 sticky left-0 bg-white z-10">Metric</th>
                    {tankData.map(({ tank }) => (
                      <th key={tank.id} className="px-4 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest min-w-[140px]">
                        <div>{tank.tank_number}</div>
                        {tank.material_type && <div className="text-[9px] font-normal text-slate-400">{tank.material_type}</div>}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-800 uppercase tracking-widest min-w-[120px] bg-slate-50">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening Stock */}
                  <tr className="border-b border-slate-100 bg-blue-50/30">
                    <td className="px-4 py-2.5 text-xs font-semibold text-slate-700 sticky left-0 bg-blue-50/30 z-10">Opening Stock</td>
                    {tankData.map(({ tank }) => (
                      <td key={tank.id} className="px-2 py-1.5">
                        <div className="form-group"><input type="number" className={inputClass} step="0.001" value={drafts[tank.id]?.opening_stock ?? ''} onChange={e => updateDraft(tank.id, 'opening_stock', parseFloat(e.target.value) || 0)} disabled={!canManage} /></div>
                      </td>
                    ))}
                    <td className={`px-4 py-2.5 text-sm font-bold text-slate-800 bg-slate-50 ${numClass}`}>{totals.opening.toFixed(3)}</td>
                  </tr>

                  {/* Collections (total per tank) */}
                  {/* Collections — expandable per tank with vehicle entries */}
                  <tr className="border-b border-slate-100 bg-emerald-50/30">
                    <td className="px-4 py-2.5 text-xs font-semibold text-slate-700 sticky left-0 bg-emerald-50/30 z-10 align-top">
                      Collections
                      <div className="text-[9px] text-slate-400 font-normal mt-0.5">per vehicle</div>
                    </td>
                    {tankData.map(({ tank }) => (
                      <td key={tank.id} className="px-2 py-2 align-top min-w-[180px]">
                        <CollectionEntriesPanel
                          tankId={tank.id}
                          collections={drafts[tank.id]?.collections || []}
                          onChange={(newCollections) => {
                            setDrafts(prev => ({
                              ...prev,
                              [tank.id]: { ...prev[tank.id], collections: newCollections, dirty: true }
                            }))
                          }}
                          canManage={canManage}
                          selectedDate={selectedDate}
                        />
                        <div className={`mt-1 pt-1 border-t border-emerald-200 text-xs font-bold text-emerald-700 ${numClass}`}>
                          {(drafts[tank.id]?.collections || []).reduce((s, c) => s + (parseFloat(c.collected_quantity) || 0), 0).toFixed(3)}
                        </div>
                      </td>
                    ))}
                    <td className={`px-4 py-2.5 text-sm font-bold text-emerald-800 bg-slate-50 align-top ${numClass}`}>{totals.collections.toFixed(3)}</td>
                  </tr>

                  {/* Closing Stock */}
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-2.5 text-xs font-semibold text-slate-700 sticky left-0 bg-white z-10">Closing Stock</td>
                    {tankData.map(({ tank }) => (
                      <td key={tank.id} className="px-2 py-1.5">
                        <div className="form-group"><input type="number" className={inputClass} step="0.001" value={drafts[tank.id]?.closing_stock ?? ''} onChange={e => updateDraft(tank.id, 'closing_stock', parseFloat(e.target.value) || 0)} disabled={!canManage} /></div>
                      </td>
                    ))}
                    <td className={`px-4 py-2.5 text-sm font-bold text-slate-800 bg-slate-50 ${numClass}`}>{totals.closing.toFixed(3)}</td>
                  </tr>

                  {/* Sales */}
                  <tr className="border-b border-slate-100 bg-red-50/30">
                    <td className="px-4 py-2.5 text-xs font-semibold text-slate-700 sticky left-0 bg-red-50/30 z-10">Sales</td>
                    {tankData.map(({ tank }) => (
                      <td key={tank.id} className="px-2 py-1.5">
                        <div className="form-group"><input type="number" className={inputClass} step="0.001" value={drafts[tank.id]?.sales ?? ''} onChange={e => updateDraft(tank.id, 'sales', parseFloat(e.target.value) || 0)} disabled={!canManage} /></div>
                      </td>
                    ))}
                    <td className={`px-4 py-2.5 text-sm font-bold text-red-700 bg-slate-50 ${numClass}`}>{totals.sales.toFixed(3)}</td>
                  </tr>

                  {/* Net Closing Stock (computed) */}
                  <tr className="border-t-2 border-slate-300 bg-slate-100/50 font-bold">
                    <td className="px-4 py-3 text-xs font-bold text-slate-800 sticky left-0 bg-slate-100/50 z-10">Net Closing Stock</td>
                    {tankData.map(({ tank }) => {
                      const d = drafts[tank.id]
                      const net = (parseFloat(d?.closing_stock) || 0) - (parseFloat(d?.sales) || 0)
                      return <td key={tank.id} className={`px-4 py-3 text-sm text-slate-900 ${numClass}`}>{net.toFixed(3)}</td>
                    })}
                    <td className={`px-4 py-3 text-sm font-bold text-slate-900 bg-slate-50 ${numClass}`}>{totals.netClosing.toFixed(3)}</td>
                  </tr>

                  {/* Client Type */}
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-2.5 text-xs font-semibold text-slate-700 sticky left-0 bg-white z-10">Client Type</td>
                    {tankData.map(({ tank }) => (
                      <td key={tank.id} className="px-2 py-1.5">
                        <div className="form-group">
                          <select className="w-full text-xs" value={drafts[tank.id]?.client_type || ''} onChange={e => updateDraft(tank.id, 'client_type', e.target.value || null)} disabled={!canManage}>
                            <option value="">—</option>
                            <option value="others">Others</option>
                            <option value="cash_customer">Cash Customer</option>
                            <option value="mixed">Mixed</option>
                          </select>
                        </div>
                      </td>
                    ))}
                    <td className="bg-slate-50"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Storage Tanks Tab */}
      {activeTab === 'tanks' && (
        <div className="p-6">
          <div className="bg-white border border-slate-200 rounded-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Storage Tanks</h2>
                <p className="text-xs text-slate-500">Manage physical storage tank configuration</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-outline btn-sm" onClick={loadTanks}><RefreshCw size={14} /></button>
                {canManage && <button className="btn btn-primary btn-sm" onClick={() => { setEditingTank(null); setShowTankModal(true) }}><Plus size={14} /> Add Tank</button>}
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tank #</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Capacity</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Material</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Location</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="text-right px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tanks.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">No tanks configured</td></tr>
                ) : tanks.map(tank => (
                  <tr key={tank.id}>
                    <td className="px-6 py-3 text-sm font-bold text-slate-800">{tank.tank_number}</td>
                    <td className="px-6 py-3 text-sm font-mono text-slate-600">{tank.capacity_litres ? `${parseFloat(tank.capacity_litres).toLocaleString()} L` : '—'}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{tank.material_type || '—'}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{tank.location || '—'}</td>
                    <td className="px-6 py-3"><span className={tank.is_active ? 'badge badge-active' : 'badge badge-error'}>{tank.is_active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                    <td className="px-6 py-3 text-right">
                      {canManage && (
                        <div className="flex items-center justify-end gap-1">
                          <button className="btn-icon" onClick={() => { setEditingTank(tank); setShowTankModal(true) }} title="Edit"><Settings size={14} /></button>
                          <button className="btn-icon" onClick={() => navigate(`/tank-logs/history/${tank.id}`)} title="History"><History size={14} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showTankModal && <TankFormModal isOpen onClose={() => { setShowTankModal(false); setEditingTank(null) }} onSave={handleSaveTank} tank={editingTank} loading={tankSaving} />}
    </div>
  )
}

export default TankLogsPage
