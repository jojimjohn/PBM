import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import complianceService from '../../services/complianceService'
import { CheckCircle, XCircle, FileCheck } from 'lucide-react'

/**
 * WCNVerifyPage — Public page shown when a regulator scans the QR on a manifest.
 * No authentication required. Shows:
 *   - Whether the WCN is genuine
 *   - Issue date
 *   - Collection date
 */
const WCNVerifyPage = () => {
  const [params] = useSearchParams()
  const wcnNumber = params.get('wcn')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!wcnNumber) {
      setLoading(false)
      return
    }
    complianceService.verifyWcn(wcnNumber).then(r => {
      setResult(r.success ? r.data : { verified: false, reason: r.error })
      setLoading(false)
    })
  }, [wcnNumber])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-slate-500">Verifying...</div>
    </div>
  }

  if (!wcnNumber) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md bg-white border border-slate-200 rounded-xl p-6 text-center">
        <XCircle className="mx-auto text-red-500" size={40} />
        <h1 className="mt-3 text-lg font-bold">No WCN Number Provided</h1>
        <p className="text-sm text-slate-600 mt-2">This page expects a WCN number in the URL.</p>
      </div>
    </div>
  }

  const verified = result?.verified

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl shadow-sm p-8">
        <div className="flex items-center gap-2 mb-6 text-slate-600">
          <FileCheck size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">WCN Manifest Verification</span>
        </div>

        {verified ? (
          <>
            <CheckCircle className="text-emerald-500" size={56} />
            <h1 className="mt-4 text-2xl font-bold text-emerald-700">Verified</h1>
            <p className="text-sm text-slate-600 mt-2">
              This Waste Consignment Note is genuine and registered in the issuing company's records.
            </p>
            <dl className="mt-6 grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <dt className="text-slate-500">WCN Number</dt>
                <dd className="font-mono font-bold">{result.wcn_number}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Issued Date</dt>
                <dd className="font-mono">{result.issued_date}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Collection Date</dt>
                <dd className="font-mono">{result.collection_date}</dd>
              </div>
            </dl>
            <div className="mt-6 text-xs text-slate-400 border-t border-slate-100 pt-4">
              Issued under Oman Ministerial Decision No. 18/2017
            </div>
          </>
        ) : (
          <>
            <XCircle className="text-red-500" size={56} />
            <h1 className="mt-4 text-2xl font-bold text-red-700">Not Verified</h1>
            <p className="text-sm text-slate-600 mt-2">
              This WCN number could not be verified. It may be invalid, not yet finalized,
              or from a different system.
            </p>
            <dl className="mt-6 grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">WCN Number</dt>
                <dd className="font-mono">{wcnNumber}</dd>
              </div>
              {result?.reason && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Reason</dt>
                  <dd className="text-red-600">{result.reason}</dd>
                </div>
              )}
            </dl>
          </>
        )}
      </div>
    </div>
  )
}

export default WCNVerifyPage
