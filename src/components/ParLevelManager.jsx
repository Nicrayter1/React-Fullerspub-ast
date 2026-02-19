import React, { useState, useEffect, useCallback } from 'react'
import { fetchOrderSummary, upsertParLevelsBulk, updateProductMeta } from '../api/parLevels'
import Button from './ui/Button'
import OrderModal from './OrderModal'

// ─── Цвета строк (как в Excel) ───────────────────────────────────────────────
const ROW_BG = {
  order:     'bg-red-100    dark:bg-red-900/30    text-gray-900 dark:text-gray-100',
  overstock: 'bg-yellow-100 dark:bg-yellow-900/30 text-gray-900 dark:text-gray-100',
  ok:        'bg-green-100  dark:bg-green-900/30  text-gray-900 dark:text-gray-100',
  no_par:    'bg-white      dark:bg-gray-800       text-gray-700 dark:text-gray-300'
}

const orderQtyColor = (status) => {
  if (status === 'order')     return 'text-red-700    dark:text-red-400    font-bold'
  if (status === 'overstock') return 'text-yellow-700 dark:text-yellow-400 font-bold'
  return 'text-gray-700 dark:text-gray-300'
}

// Маленький inline-инпут
const TdInput = ({ value, onChange, type = 'text', width = 'w-20', placeholder = '—' }) => (
  <input
    type={type}
    value={value}
    placeholder={placeholder}
    onChange={e => onChange(e.target.value)}
    className={`
      ${width} px-1 py-0.5 text-xs text-center
      bg-white/70 dark:bg-gray-700/70
      border border-gray-300 dark:border-gray-600
      rounded focus:outline-none focus:border-blue-400
      tabular-nums
    `}
  />
)

function groupBy(arr, key) {
  const map = new Map()
  arr.forEach(item => {
    const k = item[key] ?? 'Без категории'
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(item)
  })
  return map
}

export default function ParLevelManager() {
  const [summary, setSummary]         = useState([])
  const [edited, setEdited]           = useState({})
  const [loading, setLoading]         = useState(false)
  const [saving, setSaving]           = useState(false)
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [notif, setNotif]             = useState(null)
  const [showOrder, setShowOrder]     = useState(false)

  const notify = (msg, type = 'info') => {
    setNotif({ msg, type })
    setTimeout(() => setNotif(null), 4000)
  }

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setSummary(await fetchOrderSummary())
    } catch (err) {
      notify('Ошибка загрузки: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleChange = (id, field, value) =>
    setEdited(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))

  const handleSave = async () => {
    const ids = Object.keys(edited)
    if (!ids.length) { notify('Нет изменений', 'info'); return }
    try {
      setSaving(true)
      const parUpdates  = []
      const metaUpdates = []

      ids.forEach(id => {
        const f = edited[id]
        if (f.total_par !== undefined)
          parUpdates.push({ product_id: Number(id), total_par: Number(f.total_par) || 0 })
        if (f.company !== undefined || f.distributor !== undefined)
          metaUpdates.push({ id: Number(id), company: f.company, distributor: f.distributor })
      })

      await Promise.all([
        parUpdates.length ? upsertParLevelsBulk(parUpdates) : Promise.resolve(),
        ...metaUpdates.map(({ id, company, distributor }) =>
          updateProductMeta(id, { company, distributor })
        )
      ])

      setEdited({})
      notify(`Сохранено (${ids.length} позиций)`, 'success')
      await load()
    } catch (err) {
      notify('Ошибка: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const stats = {
    order:     summary.filter(p => p.status === 'order').length,
    ok:        summary.filter(p => p.status === 'ok').length,
    overstock: summary.filter(p => p.status === 'overstock').length,
    no_par:    summary.filter(p => p.status === 'no_par').length,
  }

  const filtered = summary
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()))

  const grouped = groupBy(filtered, 'category_name')
  const changesCount = Object.keys(edited).length

  return (
    <div className="space-y-4">

      {notif && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
          notif.type === 'success' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' :
          notif.type === 'error'   ? 'bg-red-100   dark:bg-red-900/40   text-red-800   dark:text-red-300'   :
                                     'bg-blue-100  dark:bg-blue-900/40  text-blue-800  dark:text-blue-300'
        }`}>
          {notif.msg}
        </div>
      )}

      {/* Карточки статистики */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'order',     label: 'К заказу', bg: 'bg-red-100    dark:bg-red-900/30',    text: 'text-red-700    dark:text-red-300'    },
          { key: 'ok',        label: 'Норма',     bg: 'bg-green-100  dark:bg-green-900/30',  text: 'text-green-700  dark:text-green-300'  },
          { key: 'overstock', label: 'Избыток',   bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
          { key: 'no_par',    label: 'Нет норм.', bg: 'bg-gray-100   dark:bg-gray-700',      text: 'text-gray-600   dark:text-gray-300'   },
        ].map(({ key, label, bg, text }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(prev => prev === key ? 'all' : key)}
            className={`p-3 rounded-xl text-center transition-all cursor-pointer select-none ${bg} ${text}
              ${filterStatus === key ? 'ring-2 ring-inset ring-current' : 'hover:opacity-80'}`}
          >
            <div className="text-2xl font-bold tabular-nums">{stats[key]}</div>
            <div className="text-xs mt-0.5">{label}</div>
          </button>
        ))}
      </div>

      {/* Панель действий */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Поиск..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            placeholder-gray-400 focus:outline-none focus:border-blue-400 w-44"
        />
        <Button
          onClick={handleSave}
          disabled={changesCount === 0 || saving}
          variant={changesCount > 0 ? 'primary' : 'ghost'}
          loading={saving}
        >
          {saving ? 'Сохранение...' : changesCount > 0 ? `💾 Сохранить (${changesCount})` : '💾 Сохранить'}
        </Button>
        <Button onClick={load} variant="ghost" disabled={loading}>
          {loading ? '...' : '↻ Обновить'}
        </Button>
        <Button
          onClick={() => setShowOrder(true)}
          variant="success"
          disabled={stats.order === 0}
        >
          📦 Сформировать заказ ({stats.order})
        </Button>
        {filterStatus !== 'all' && (
          <button
            onClick={() => setFilterStatus('all')}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline"
          >
            Сбросить фильтр
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400 italic">
          Колонка «итого сток» — редактируемая. Остальные — только чтение.
        </span>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 shadow-soft">
        <table className="w-full text-xs min-w-[1100px] border-collapse">
          <thead>
            <tr className="bg-blue-900 text-white text-center">
              <th rowSpan={2} className="border border-blue-700 px-3 py-2 text-left font-bold min-w-[180px]">наименование</th>
              <th rowSpan={2} className="border border-blue-700 px-2 py-2 font-bold whitespace-nowrap">тара, мл</th>
              <th colSpan={2} className="border border-blue-700 px-2 py-1 font-bold">бар 1 зал</th>
              <th colSpan={2} className="border border-blue-700 px-2 py-1 font-bold">бар 2</th>
              <th colSpan={2} className="border border-blue-700 px-2 py-1 font-bold">бочковая</th>
              <th colSpan={2} className="border border-blue-700 px-2 py-1 font-bold">итого</th>
              <th rowSpan={2} className="border border-blue-700 px-2 py-2 font-bold">заказ</th>
              <th rowSpan={2} className="border border-blue-700 px-2 py-2 font-bold">компания</th>
              <th rowSpan={2} className="border border-blue-700 px-2 py-2 font-bold">дистрибьютор</th>
            </tr>
            <tr className="bg-blue-800 text-white text-center">
              <th className="border border-blue-700 px-2 py-1 font-medium text-blue-200">сток</th>
              <th className="border border-blue-700 px-2 py-1 font-medium text-blue-200">факт</th>
              <th className="border border-blue-700 px-2 py-1 font-medium text-blue-200">сток</th>
              <th className="border border-blue-700 px-2 py-1 font-medium text-blue-200">факт</th>
              <th className="border border-blue-700 px-2 py-1 font-medium text-blue-200">сток</th>
              <th className="border border-blue-700 px-2 py-1 font-medium text-blue-200">факт</th>
              <th className="border border-blue-700 px-2 py-1 font-medium text-yellow-300 font-bold">сток ✎</th>
              <th className="border border-blue-700 px-2 py-1 font-medium text-yellow-300 font-bold">факт</th>
            </tr>
          </thead>
          <tbody>
            {grouped.size === 0 && (
              <tr>
                <td colSpan={13} className="text-center py-10 text-gray-400">
                  {loading ? 'Загрузка...' : 'Нет данных'}
                </td>
              </tr>
            )}
            {[...grouped.entries()].map(([catName, items]) => (
              <React.Fragment key={catName}>
                {/* Строка категории */}
                <tr>
                  <td
                    colSpan={13}
                    className="bg-yellow-300 dark:bg-yellow-600 text-gray-900
                      font-bold text-center py-1.5 px-3
                      border border-yellow-400 uppercase tracking-wide"
                  >
                    {catName}
                  </td>
                </tr>

                {items.map(item => {
                  const e        = edited[item.id] || {}
                  const isEdited = !!edited[item.id]
                  const parVal   = e.total_par   !== undefined ? e.total_par   : (item.total_par ?? '')
                  const compVal  = e.company     !== undefined ? e.company     : (item.company || '')
                  const distrVal = e.distributor !== undefined ? e.distributor : (item.distributor || '')

                  return (
                    <tr
                      key={item.id}
                      className={`
                        ${ROW_BG[item.status]}
                        ${isEdited ? 'outline outline-2 outline-blue-400 outline-offset-[-1px]' : ''}
                        border-b border-gray-200 dark:border-gray-700
                        hover:brightness-95 transition-all
                      `}
                    >
                      <td className="px-3 py-1.5 border-r border-gray-200 dark:border-gray-700 font-medium">
                        <span className="block truncate max-w-[180px]" title={item.name}>{item.name}</span>
                      </td>
                      <td className="px-2 py-1.5 text-center border-r border-gray-200 dark:border-gray-700 tabular-nums whitespace-nowrap">
                        {item.volume}
                      </td>

                      {/* Бар 1 */}
                      <td className="px-2 py-1.5 text-center border-r border-gray-200 dark:border-gray-700 text-gray-400">—</td>
                      <td className="px-2 py-1.5 text-center border-r border-gray-200 dark:border-gray-700 tabular-nums">
                        {item.bar1_actual > 0 ? item.bar1_actual : ''}
                      </td>

                      {/* Бар 2 */}
                      <td className="px-2 py-1.5 text-center border-r border-gray-200 dark:border-gray-700 text-gray-400">—</td>
                      <td className="px-2 py-1.5 text-center border-r border-gray-200 dark:border-gray-700 tabular-nums">
                        {item.bar2_actual > 0 ? item.bar2_actual : ''}
                      </td>

                      {/* Бочковая */}
                      <td className="px-2 py-1.5 text-center border-r border-gray-200 dark:border-gray-700 text-gray-400">—</td>
                      <td className="px-2 py-1.5 text-center border-r border-gray-200 dark:border-gray-700 tabular-nums">
                        {item.cold_room_actual > 0 ? item.cold_room_actual : ''}
                      </td>

                      {/* Итого сток — редактируемый */}
                      <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700 text-center bg-yellow-50/50 dark:bg-yellow-900/10">
                        <TdInput
                          type="number"
                          value={parVal}
                          onChange={v => handleChange(item.id, 'total_par', v)}
                          placeholder="—"
                          width="w-12"
                        />
                      </td>

                      {/* Итого факт */}
                      <td className="px-2 py-1.5 text-center border-r border-gray-200 dark:border-gray-700 tabular-nums font-bold">
                        {item.total_actual > 0 ? item.total_actual : ''}
                      </td>

                      {/* Заказ */}
                      <td className={`px-2 py-1.5 text-center border-r border-gray-200 dark:border-gray-700 tabular-nums ${orderQtyColor(item.status)}`}>
                        {item.status === 'no_par' ? '—' : item.order_qty}
                      </td>

                      {/* Компания */}
                      <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                        <TdInput value={compVal} onChange={v => handleChange(item.id, 'company', v)} placeholder="—" width="w-24" />
                      </td>

                      {/* Дистрибьютор */}
                      <td className="px-1 py-1">
                        <TdInput value={distrVal} onChange={v => handleChange(item.id, 'distributor', v)} placeholder="—" width="w-28" />
                      </td>
                    </tr>
                  )
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <OrderModal
        isOpen={showOrder}
        onClose={() => setShowOrder(false)}
        orderSummary={summary}
      />
    </div>
  )
}
