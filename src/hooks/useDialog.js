/**
 * useDialog Hook
 *
 * Provides an imperative API for showing dialogs with Promise-based flow.
 * Supports both confirmation dialogs and alert dialogs.
 *
 * @module hooks/useDialog
 *
 * @example
 * const { confirm, alert, DialogComponents } = useDialog()
 *
 * // Confirmation dialog
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete Order',
 *     message: 'This action cannot be undone.',
 *     variant: 'danger',
 *     confirmText: 'Delete'
 *   })
 *   if (confirmed) {
 *     await deleteOrder()
 *   }
 * }
 *
 * // Alert dialog
 * const handleError = async (error) => {
 *   await alert({
 *     title: 'Error',
 *     message: error.message,
 *     variant: 'error'
 *   })
 * }
 *
 * // Render in component
 * return (
 *   <>
 *     {DialogComponents}
 *     <button onClick={handleDelete}>Delete</button>
 *   </>
 * )
 */

import { useState, useCallback, useMemo } from 'react'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import AlertDialog from '../components/ui/AlertDialog'

/**
 * @typedef {Object} ConfirmOptions
 * @property {string} title - Dialog title
 * @property {string|React.ReactNode} message - Dialog message
 * @property {'danger'|'warning'|'info'|'default'} [variant='default'] - Visual variant
 * @property {string} [confirmText] - Custom confirm button text
 * @property {string} [cancelText] - Custom cancel button text
 * @property {boolean} [showIcon=true] - Show variant icon
 * @property {React.ComponentType} [icon] - Custom icon component
 */

/**
 * @typedef {Object} AlertOptions
 * @property {string} title - Dialog title
 * @property {string|React.ReactNode} message - Dialog message
 * @property {'success'|'error'|'warning'|'info'} [variant='info'] - Visual variant
 * @property {string} [buttonText] - Custom button text
 * @property {boolean} [showIcon=true] - Show variant icon
 * @property {React.ComponentType} [icon] - Custom icon component
 */

/**
 * Dialog state structure
 * @typedef {Object} DialogState
 * @property {string} id - Unique dialog ID
 * @property {'confirm'|'alert'} type - Dialog type
 * @property {ConfirmOptions|AlertOptions} options - Dialog options
 * @property {Function} resolve - Promise resolve function
 * @property {boolean} loading - Loading state (for confirm dialogs)
 */

let dialogIdCounter = 0

/**
 * useDialog Hook
 *
 * @param {Object} [options]
 * @param {Function} [options.t] - Translation function
 * @returns {Object} Dialog methods and components
 */
const useDialog = (options = {}) => {
  const { t } = options
  const [dialogs, setDialogs] = useState([])

  /**
   * Show a confirmation dialog
   * @param {ConfirmOptions} confirmOptions
   * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled
   */
  const confirm = useCallback((confirmOptions) => {
    return new Promise((resolve) => {
      const id = `confirm-${++dialogIdCounter}`
      setDialogs((prev) => [
        ...prev,
        {
          id,
          type: 'confirm',
          options: confirmOptions,
          resolve,
          loading: false
        }
      ])
    })
  }, [])

  /**
   * Show an alert dialog
   * @param {AlertOptions} alertOptions
   * @returns {Promise<void>} Resolves when dismissed
   */
  const alert = useCallback((alertOptions) => {
    return new Promise((resolve) => {
      const id = `alert-${++dialogIdCounter}`
      setDialogs((prev) => [
        ...prev,
        {
          id,
          type: 'alert',
          options: alertOptions,
          resolve,
          loading: false
        }
      ])
    })
  }, [])

  /**
   * Close a dialog by ID
   * @param {string} id - Dialog ID
   * @param {*} result - Result to resolve with
   */
  const closeDialog = useCallback((id, result) => {
    setDialogs((prev) => {
      const dialog = prev.find((d) => d.id === id)
      if (dialog) {
        dialog.resolve(result)
      }
      return prev.filter((d) => d.id !== id)
    })
  }, [])

  /**
   * Set loading state for a dialog
   * @param {string} id - Dialog ID
   * @param {boolean} loading - Loading state
   */
  const setDialogLoading = useCallback((id, loading) => {
    setDialogs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, loading } : d))
    )
  }, [])

  /**
   * Handle confirm button click with async support
   * @param {DialogState} dialog
   */
  const handleConfirm = useCallback(
    async (dialog) => {
      const { onConfirm } = dialog.options
      if (onConfirm) {
        setDialogLoading(dialog.id, true)
        try {
          await onConfirm()
          closeDialog(dialog.id, true)
        } catch (error) {
          setDialogLoading(dialog.id, false)
          // Re-throw or handle error as needed
          throw error
        }
      } else {
        closeDialog(dialog.id, true)
      }
    },
    [closeDialog, setDialogLoading]
  )

  /**
   * Rendered dialog components
   */
  const DialogComponents = useMemo(() => {
    return dialogs.map((dialog) => {
      if (dialog.type === 'confirm') {
        return (
          <ConfirmDialog
            key={dialog.id}
            isOpen={true}
            onClose={() => closeDialog(dialog.id, false)}
            onConfirm={() => handleConfirm(dialog)}
            loading={dialog.loading}
            t={t}
            {...dialog.options}
          />
        )
      }

      if (dialog.type === 'alert') {
        return (
          <AlertDialog
            key={dialog.id}
            isOpen={true}
            onClose={() => closeDialog(dialog.id, undefined)}
            t={t}
            {...dialog.options}
          />
        )
      }

      return null
    })
  }, [dialogs, closeDialog, handleConfirm, t])

  return {
    confirm,
    alert,
    DialogComponents,
    // Expose for advanced use cases
    dialogs,
    closeDialog
  }
}

export default useDialog
