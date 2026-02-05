/**
 * ============================================================
 * ПРОСМОТР ИСТОРИИ ДЕЙСТВИЙ
 * ============================================================
 * 
 * Компонент для отображения истории всех действий с продуктами
 * Показывает: заморозку, разморозку, удаление, изменение порядка
 * 
 * ФУНКЦИИ:
 * - Отображение истории в виде timeline
 * - Фильтрация по типу действия
 * - Фильтрация по дате
 * - Пагинация
 * - Детальная информация о каждом действии
 * 
 * @version 1.0.0
 * @author Admin Team
 * @date 2026-02-05
 * ============================================================
 */

import React, { useState, useEffect } from 'react'
import { getAllHistory } from '../api/adminOperations'
import './AdminHistoryView.css'

/**
 * ============================================================
 * КОМПОНЕНТ ЗАПИСИ ИСТОРИИ
 * ============================================================
 */
const HistoryItem = ({ record }) => {
  // Форматирование даты и времени
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Получение иконки и цвета для типа действия
  const getActionInfo = (action) => {
    switch (action) {
      case 'freeze':
        return { icon: '❄️', label: 'Заморожено', color: 'blue' }
      case 'unfreeze':
        return { icon: '🔥', label: 'Разморожено', color: 'orange' }
      case 'delete':
        return { icon: '🗑️', label: 'Удалено', color: 'red' }
      case 'reorder':
        return { icon: '🔄', label: 'Изменен порядок', color: 'green' }
      default:
        return { icon: '📝', label: action, color: 'gray' }
    }
  }

  const actionInfo = getActionInfo(record.action)
  const metadata = record.metadata || {}

  return (
    <div className={`history-item action-${actionInfo.color}`}>
      {/* Action Icon */}
      <div className="history-icon">
        <span>{actionInfo.icon}</span>
      </div>

      {/* Main Content */}
      <div className="history-content">
        <div className="history-header">
          <span className="history-action">{actionInfo.label}</span>
          <span className="history-date">{formatDate(record.performed_at)}</span>
        </div>

        <div className="history-details">
          {/* Product Name */}
          {metadata.product_name && (
            <div className="detail-item">
              <span className="detail-label">Продукт:</span>
              <span className="detail-value">{metadata.product_name}</span>
            </div>
          )}

          {/* Category */}
          {metadata.category_id && (
            <div className="detail-item">
              <span className="detail-label">Категория ID:</span>
              <span className="detail-value">{metadata.category_id}</span>
            </div>
          )}

          {/* Performed By */}
          <div className="detail-item">
            <span className="detail-label">Выполнил:</span>
            <span className="detail-value">{record.performed_by}</span>
          </div>

          {/* Specific Details based on Action */}
          {record.action === 'freeze' && (
            <>
              {metadata.hide_from_bar1 !== undefined && (
                <div className="detail-item">
                  <span className="detail-label">Скрыт от Bar 1:</span>
                  <span className="detail-value">{metadata.hide_from_bar1 ? 'Да' : 'Нет'}</span>
                </div>
              )}
              {metadata.hide_from_bar2 !== undefined && (
                <div className="detail-item">
                  <span className="detail-label">Скрыт от Bar 2:</span>
                  <span className="detail-value">{metadata.hide_from_bar2 ? 'Да' : 'Нет'}</span>
                </div>
              )}
              {metadata.previous_state && (
                <div className="detail-item">
                  <span className="detail-label">Остатки на момент заморозки:</span>
                  <span className="detail-value">
                    Bar1: {metadata.previous_state.bar1}, 
                    Bar2: {metadata.previous_state.bar2}, 
                    Cold Room: {metadata.previous_state.cold_room}
                  </span>
                </div>
              )}
            </>
          )}

          {record.action === 'delete' && (
            <>
              {metadata.volume && (
                <div className="detail-item">
                  <span className="detail-label">Объем:</span>
                  <span className="detail-value">{metadata.volume}</span>
                </div>
              )}
              {metadata.final_state && (
                <div className="detail-item">
                  <span className="detail-label">Финальные остатки:</span>
                  <span className="detail-value">
                    Bar1: {metadata.final_state.bar1}, 
                    Bar2: {metadata.final_state.bar2}, 
                    Cold Room: {metadata.final_state.cold_room}
                  </span>
                </div>
              )}
            </>
          )}

          {record.action === 'reorder' && (
            <>
              {metadata.products_count && (
                <div className="detail-item">
                  <span className="detail-label">Продуктов перемещено:</span>
                  <span className="detail-value">{metadata.products_count}</span>
                </div>
              )}
              {metadata.successful_updates !== undefined && (
                <div className="detail-item">
                  <span className="detail-label">Успешно обновлено:</span>
                  <span className="detail-value success">{metadata.successful_updates}</span>
                </div>
              )}
              {metadata.failed_updates !== undefined && metadata.failed_updates > 0 && (
                <div className="detail-item">
                  <span className="detail-label">Ошибок:</span>
                  <span className="detail-value error">{metadata.failed_updates}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * ============================================================
 * ГЛАВНЫЙ КОМПОНЕНТ ИСТОРИИ
 * ============================================================
 */
const AdminHistoryView = () => {
  // ============================================================
  // STATE
  // ============================================================
  
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Фильтры
  const [actionFilter, setActionFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Пагинация
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // ============================================================
  // ЗАГРУЗКА ИСТОРИИ
  // ============================================================
  
  const loadHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('📜 Загрузка истории действий...')

      // Подготовка фильтров
      const filters = {
        limit: 200  // Загружаем больше записей для локальной фильтрации
      }

      if (actionFilter !== 'all') {
        filters.action = actionFilter
      }

      if (dateFrom) {
        filters.fromDate = new Date(dateFrom)
      }

      if (dateTo) {
        // Устанавливаем конец дня для датеTo
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        filters.toDate = toDate
      }

      const result = await getAllHistory(filters)

      if (result.success) {
        setHistory(result.data)
        console.log(`✅ Загружено ${result.data.length} записей истории`)
      } else {
        setError(result.error || 'Ошибка загрузки истории')
      }

    } catch (err) {
      console.error('❌ Ошибка загрузки истории:', err)
      setError('Не удалось загрузить историю')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [actionFilter, dateFrom, dateTo])

  // ============================================================
  // ПАГИНАЦИЯ
  // ============================================================
  
  const totalPages = Math.ceil(history.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = history.slice(startIndex, endIndex)

  // Сброс на первую страницу при изменении фильтров
  useEffect(() => {
    setCurrentPage(1)
  }, [actionFilter, dateFrom, dateTo])

  // ============================================================
  // RENDER
  // ============================================================
  
  if (loading) {
    return (
      <div className="history-loading">
        <div className="spinner"></div>
        <p>Загрузка истории...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="history-error">
        <p>❌ {error}</p>
        <button onClick={loadHistory} className="btn-primary">
          Попробовать снова
        </button>
      </div>
    )
  }

  return (
    <div className="admin-history-view">
      {/* FILTERS */}
      <div className="history-filters">
        <div className="filter-group">
          <label>Тип действия:</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Все действия</option>
            <option value="freeze">❄️ Заморозка</option>
            <option value="unfreeze">🔥 Разморозка</option>
            <option value="delete">🗑️ Удаление</option>
            <option value="reorder">🔄 Изменение порядка</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Дата с:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="filter-date"
          />
        </div>

        <div className="filter-group">
          <label>Дата по:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="filter-date"
          />
        </div>

        <div className="filter-group">
          <button onClick={loadHistory} className="btn-refresh">
            🔄 Обновить
          </button>
        </div>
      </div>

      {/* STATISTICS */}
      <div className="history-stats">
        <p>Всего записей: <strong>{history.length}</strong></p>
      </div>

      {/* HISTORY LIST */}
      <div className="history-list">
        {currentItems.length > 0 ? (
          currentItems.map((record, index) => (
            <HistoryItem key={record.id || index} record={record} />
          ))
        ) : (
          <div className="history-empty">
            <p>📭 История пуста</p>
            <p className="empty-hint">
              Записи появятся после выполнения действий с продуктами
            </p>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="history-pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ← Назад
          </button>
          
          <span className="pagination-info">
            Страница {currentPage} из {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Вперед →
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminHistoryView
