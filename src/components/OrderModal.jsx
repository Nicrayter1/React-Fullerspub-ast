import React, { useMemo, useState } from 'react'
import Modal from './ui/Modal'
import OrderTemplateEditor, { loadTemplate, buildTextFromTemplate } from './OrderTemplateEditor'

// ─── Генерация wa.me ссылки ───────────────────────────────────────────────────
function buildWhatsAppLink(whatsapp, text) {
  const encoded = encodeURIComponent(text)
  return `https://wa.me/${whatsapp}?text=${encoded}`
}

// ─── Карточка одного дистрибьютора ───────────────────────────────────────────
function DistributorCard({ name, whatsapp, items, template }) {
  const [showItems, setShowItems] = useState(false)
  const [copied, setCopied]       = useState(false)

  const text = buildTextFromTemplate(template, name, items)

  const handleWhatsApp = () => {
    if (!whatsapp) return
    window.open(buildWhatsAppLink(whatsapp, text), '_blank')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const hasPhone = !!whatsapp

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Шапка карточки */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700/40">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {hasPhone
              ? <span className="text-green-600 dark:text-green-400">+{whatsapp}</span>
              : <span className="text-yellow-600 dark:text-yellow-400">⚠ Номер не указан</span>
            }
          </p>
        </div>
        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full shrink-0">
          {items.length} поз.
        </span>
      </div>

      {/* Список позиций */}
      <div className="px-4 py-2">
        <button
          onClick={() => setShowItems(v => !v)}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
        >
          {showItems ? 'Скрыть позиции' : 'Показать позиции'}
        </button>
        {showItems && (
          <ul className="mt-2 space-y-1">
            {items.map(item => (
              <li key={item.id} className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                <span className="truncate mr-2">{item.name} {item.volume}</span>
                <span className="font-bold text-red-600 dark:text-red-400 shrink-0">
                  {item.order_qty} {item.unit || 'шт'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Кнопки */}
      <div className="flex gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={handleWhatsApp}
          disabled={!hasPhone}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold
            transition-all ${hasPhone
              ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {hasPhone ? 'Открыть в WhatsApp' : 'Нет номера'}
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium
            bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300
            hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
        >
          {copied ? '✓ Скопировано' : '📋 Скопировать'}
        </button>
      </div>
    </div>
  )
}

// ─── Основной модал ───────────────────────────────────────────────────────────
export default function OrderModal({ isOpen, onClose, orderSummary }) {
  const [showEditor, setShowEditor] = useState(false)
  // Перезагружаем шаблон из localStorage при каждом открытии
  const [template, setTemplate]     = useState(loadTemplate)

  // При закрытии редактора — перечитать сохранённый шаблон
  const handleCloseEditor = () => {
    setTemplate(loadTemplate())
    setShowEditor(false)
  }

  const grouped = useMemo(() => {
    const toOrder = orderSummary.filter(p => p.status === 'order')
    const map = new Map()
    toOrder.forEach(item => {
      const key  = item.distributor_id ?? '__no_distributor__'
      const name = item.distributor_name || item.distributor_text || 'Без дистрибьютора'
      const wp   = item.distributor_whatsapp || null
      if (!map.has(key)) map.set(key, { name, whatsapp: wp, items: [] })
      map.get(key).items.push(item)
    })
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [orderSummary])

  const totalItems = grouped.reduce((sum, g) => sum + g.items.length, 0)
  const withPhone  = grouped.filter(g => g.whatsapp).length
  const noPhone    = grouped.length - withPhone

  // Реальные позиции для предпросмотра в редакторе
  const sampleItems = grouped[0]?.items || []

  if (!isOpen) return null

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="📦 Сформировать заказ">

        {/* Кнопка редактора шаблона */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowEditor(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl
              bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300
              hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            ✏️ Редактировать шаблон
          </button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Дистрибьюторов',    value: grouped.length, color: 'text-blue-600 dark:text-blue-400'  },
            { label: 'Позиций всего',      value: totalItems,     color: 'text-gray-700 dark:text-gray-200'  },
            { label: 'Готово к отправке',  value: withPhone,      color: 'text-green-600 dark:text-green-400'},
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center bg-gray-50 dark:bg-gray-700/40 rounded-xl py-3">
              <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {noPhone > 0 && (
          <div className="mb-4 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg text-xs text-yellow-700 dark:text-yellow-300">
            ⚠ У {noPhone} дистрибьютора(ов) не указан номер WhatsApp. Добавьте в разделе «Дистрибьюторы».
          </div>
        )}

        {grouped.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">Нет позиций для заказа</div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {grouped.map(({ name, whatsapp, items }) => (
              <DistributorCard
                key={name}
                name={name}
                whatsapp={whatsapp}
                items={items}
                template={template}
              />
            ))}
          </div>
        )}
      </Modal>

      {/* Редактор шаблона — поверх модала */}
      {showEditor && (
        <OrderTemplateEditor
          onClose={handleCloseEditor}
          sampleItems={sampleItems}
        />
      )}
    </>
  )
}