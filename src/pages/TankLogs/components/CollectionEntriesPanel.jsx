import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Link, Search } from 'lucide-react'
import tankLogService from '../../../services/tankLogService'
import Modal from '../../../components/ui/Modal'

const CollectionEntriesPanel = ({ tankId, collections, onChange, canManage, selectedDate }) => {
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkableOrders, setLinkableOrders] = useState([])
  const [linkSearch, setLinkSearch] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)

  const addManualEntry = () => {
    onChange([...collections, {
      vehicle_id: null, vehicle_plate: '', collected_quantity: 0,
      collection_order_id: null, notes: '', _isNew: true
    }])
  }

  const updateEntry = (index, field, value) => {
    const updated = [...collections]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const removeEntry = (index) => {
    onChange(collections.filter((_, i) => i !== index))
  }

  const searchLinkable = async () => {
    setLinkLoading(true)
    const result = await tankLogService.getLinkableCollections(selectedDate, linkSearch)
    if (result.success) setLinkableOrders(result.data)
    setLinkLoading(false)
  }

  useEffect(() => {
    if (showLinkModal) searchLinkable()
  }, [showLinkModal])

  const linkOrder = (order) => {
    // Add as a collection entry with the WCN linked
    onChange([...collections, {
      vehicle_id: order.vehicle_id || null,
      vehicle_plate: order.vehiclePlate || '',
      collected_quantity: order.total_collected || 0,
      collection_order_id: order.id,
      notes: `WCN: ${order.wcn_number || order.orderNumber}`,
      _wcnRef: order.wcn_number || order.orderNumber
    }])
    setShowLinkModal(false)
  }

  const totalQty = collections.reduce((s, c) => s + (parseFloat(c.collected_quantity) || 0), 0)

  if (!canManage && collections.length === 0) {
    return <div className="text-xs text-slate-400 text-center py-1">No collections</div>
  }

  return (
    <div className="space-y-1">
      {collections.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-1 text-xs">
          <div className="form-group" style={{ flex: 1 }}>
            <input
              type="text"
              value={entry.vehicle_plate || ''}
              onChange={e => updateEntry(idx, 'vehicle_plate', e.target.value.toUpperCase())}
              placeholder="Plate"
              disabled={!canManage}
              className="text-xs"
            />
          </div>
          <div className="form-group" style={{ width: 90 }}>
            <input
              type="number"
              value={entry.collected_quantity || ''}
              onChange={e => updateEntry(idx, 'collected_quantity', parseFloat(e.target.value) || 0)}
              placeholder="Qty"
              step="0.001"
              disabled={!canManage}
              className="text-xs text-right font-mono"
            />
          </div>
          {entry.collection_order_id && (
            <span className="badge badge-info text-[9px]" title={`Linked: ${entry._wcnRef || entry.collection_order_id}`}>
              <Link size={8} /> WCN
            </span>
          )}
          {canManage && (
            <button className="btn-icon text-red-400" onClick={() => removeEntry(idx)} title="Remove">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      ))}

      {canManage && (
        <div className="flex items-center gap-1 pt-1">
          <button className="text-[10px] text-accent hover:underline flex items-center gap-0.5" onClick={addManualEntry}>
            <Plus size={10} /> Add
          </button>
          <button className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5" onClick={() => setShowLinkModal(true)}>
            <Link size={10} /> Link WCN
          </button>
        </div>
      )}

      {/* Link WCN Modal */}
      <Modal isOpen={showLinkModal} onClose={() => setShowLinkModal(false)} title="Link Collection Order" size="md">
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="form-group" style={{ flex: 1 }}>
              <input type="text" value={linkSearch} onChange={e => setLinkSearch(e.target.value)}
                placeholder="Search by order #, WCN #, or plate..." />
            </div>
            <button className="btn btn-outline btn-sm mt-0" onClick={searchLinkable}>
              <Search size={14} />
            </button>
          </div>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
            {linkLoading ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">Searching...</div>
            ) : linkableOrders.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">No linkable collections found for this date</div>
            ) : linkableOrders.map(order => (
              <div key={order.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
                onClick={() => linkOrder(order)}>
                <div>
                  <p className="text-sm font-medium text-slate-800">{order.wcn_number || order.orderNumber}</p>
                  <p className="text-xs text-slate-500">
                    {order.vehiclePlate || 'No plate'} · {order.driverName || 'No driver'} · {parseFloat(order.total_collected || 0).toFixed(3)} qty
                  </p>
                </div>
                <button className="btn btn-primary btn-sm"><Link size={12} /> Link</button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CollectionEntriesPanel
