import { useState, useCallback } from 'react'

const DEFAULT_STATE = {
  isOpen: false,
  title: '',
  message: '',
  confirmLabel: 'Подтвердить',
  confirmVariant: 'danger',
  onConfirm: null
}

export function useConfirmModal() {
  const [confirmModal, setConfirmModal] = useState(DEFAULT_STATE)

  const openConfirmModal = useCallback(({ title, message, confirmLabel, confirmVariant, onConfirm }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmLabel: confirmLabel ?? 'Подтвердить',
      confirmVariant: confirmVariant ?? 'danger',
      onConfirm
    })
  }, [])

  const closeConfirmModal = useCallback(() => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }))
  }, [])

  return { confirmModal, openConfirmModal, closeConfirmModal }
}
