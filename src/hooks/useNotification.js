import { useState, useCallback } from 'react'

export function useNotification() {
  const [notification, setNotification] = useState({ message: '', type: 'info' })

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type })
  }, [])

  const clearNotification = useCallback(() => {
    setNotification({ message: '', type: 'info' })
  }, [])

  return { notification, showNotification, clearNotification }
}
