import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useAuth } from './AuthContext'

// Хуки
import { useStockData } from './hooks/useStockData'
import { useNotification } from './hooks/useNotification'
import { useConfirmModal } from './hooks/useConfirmModal'

// Компоненты
import AppHeader from './components/AppHeader'
import CategoryNav from './components/CategoryNav'
import ActionBar from './components/ActionBar'
import ProductList from './components/ProductList'
import Notification from './components/Notification'
import SearchInput from './components/SearchInput'
import NumberEditModal from './components/NumberEditModal'
import AddModal from './components/AddModal'
import ConfirmModal from './components/ConfirmModal'
import Card from './components/ui/Card'

// Утилиты
import { exportToCSV } from './utils/export'
import supabaseAPI from './api/supabase'
import { log } from './utils/logger'

function MainApp() {
  const { user, userProfile, signOut, isSigningOut, getAvailableColumns } = useAuth()

  const availableColumns = useMemo(() => getAvailableColumns(), [userProfile?.role])

  // === ХУКИ ===
  const { notification, showNotification, clearNotification } = useNotification()
  const { confirmModal, openConfirmModal, closeConfirmModal } = useConfirmModal()
  const {
    categories,
    products,
    loading,
    loadFromSupabase,
    saveToSupabase,
    handleAddItem,
    handleConfirmEdit
  } = useStockData({ showNotification, availableColumns })

  // === UI STATE ===
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [editModal, setEditModal] = useState({
    isOpen: false, product: null, field: '', title: ''
  })
  const [addModal, setAddModal] = useState({
    isOpen: false, type: 'product'
  })

  // === ИНИЦИАЛИЗАЦИЯ: всегда загружаем из Supabase ===
  useEffect(() => {
    log('🚀 Инициализация — загрузка из Supabase...')
    if (supabaseAPI.client) {
      loadFromSupabase()
    } else {
      showNotification('Настройте подключение к Supabase', 'info')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // === ОБРАБОТЧИКИ ===

  const handleEdit = useCallback((product, field) => {
    if (!availableColumns.includes(field)) {
      showNotification('У вас нет доступа к редактированию этой колонки', 'error')
      return
    }
    const titles = { bar1: 'Бар 1', bar2: 'Бар 2', cold_room: 'Холод. комната' }
    setEditModal({ isOpen: true, product, field, title: `${product.name} - ${titles[field]}` })
  }, [availableColumns, showNotification])

  const handleEditConfirm = useCallback((value) => {
    handleConfirmEdit(editModal.product.id, editModal.field, value)
    setEditModal({ isOpen: false, product: null, field: '', title: '' })
  }, [handleConfirmEdit, editModal.product, editModal.field])

  const handleAddItemWrapper = useCallback(async (params) => {
    const ok = await handleAddItem(params, addModal.type)
    if (ok) setAddModal({ isOpen: false, type: 'product' })
  }, [handleAddItem, addModal.type])

  const handleSync = useCallback(() => {
    openConfirmModal({
      title: 'Синхронизация',
      message: 'Загрузить данные из базы? Текущие изменения будут потеряны.',
      confirmLabel: 'Загрузить',
      confirmVariant: 'info',
      onConfirm: async () => {
        closeConfirmModal()
        await loadFromSupabase()
      }
    })
  }, [openConfirmModal, closeConfirmModal, loadFromSupabase])

  const handleSignOut = useCallback(() => {
    openConfirmModal({
      title: 'Выход',
      message: 'Вы уверены, что хотите выйти?',
      confirmLabel: 'Выйти',
      confirmVariant: 'danger',
      onConfirm: async () => {
        closeConfirmModal()
        await signOut()
      }
    })
  }, [openConfirmModal, closeConfirmModal, signOut])

  const handleExport = useCallback(() => {
    exportToCSV(products, categories)
    showNotification('CSV файл скачивается...', 'success')
  }, [products, categories, showNotification])

  // === RENDER ===
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors">
      <AppHeader
        user={user}
        userProfile={userProfile}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />

      <main className="p-4 md:p-6">
        <Card className="max-w-7xl mx-auto">
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={clearNotification}
          />

          <SearchInput value={searchQuery} onChange={setSearchQuery} />

          <CategoryNav
            categories={categories}
            activeCategory={activeCategory}
            onChange={setActiveCategory}
          />

          <ActionBar
            onSync={handleSync}
            onSave={saveToSupabase}
            onExport={handleExport}
            loading={loading}
          />

          <ProductList
            products={products}
            searchQuery={searchQuery}
            categoryId={activeCategory}
            availableColumns={availableColumns}
            onEdit={handleEdit}
          />
        </Card>
      </main>

      <NumberEditModal
        isOpen={editModal.isOpen}
        title={editModal.title}
        value={editModal.product?.[editModal.field]}
        onClose={() => setEditModal({ isOpen: false, product: null, field: '', title: '' })}
        onConfirm={handleEditConfirm}
      />

      <AddModal
        isOpen={addModal.isOpen}
        type={addModal.type}
        categories={categories}
        onClose={() => setAddModal({ isOpen: false, type: 'product' })}
        onAdd={handleAddItemWrapper}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmVariant={confirmModal.confirmVariant}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />
    </div>
  )
}

export default MainApp
