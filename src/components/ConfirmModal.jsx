/**
 * Модальное окно подтверждения действия
 * Заменяет нативный window.confirm
 */

import React from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'

const ConfirmModal = ({ isOpen, title, message, confirmLabel = 'Подтвердить', cancelLabel = 'Отмена', confirmVariant = 'danger', onConfirm, onCancel }) => {
  const actions = (
    <>
      <Button variant="ghost" className="flex-1 bg-gray-100 dark:bg-gray-700" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button variant={confirmVariant} className="flex-1" onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      actions={actions}
    >
      <p className="text-gray-700 dark:text-gray-300">{message}</p>
    </Modal>
  )
}

export default ConfirmModal
