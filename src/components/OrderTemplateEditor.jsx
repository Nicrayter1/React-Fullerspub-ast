import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

// ─── Дефолтный шаблон ────────────────────────────────────────────────────────
const DEFAULT_TEMPLATE = {
  greeting:  'Добрый день! Заявка от {{venue}}',
  date_line: 'Дата: {{date}}',
  item_line:  '• {{name}} {{volume}} — {{qty}} {{unit}}',
  footer:    'Итого позиций: {{total}}',
}

const STORAGE_KEY = 'order_message_template'

// ─── Сохранение / загрузка шаблона ───────────────────────────────────────────
export function loadTemplate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_TEMPLATE }
    return { ...DEFAULT_TEMPLATE, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_TEMPLATE }
  }
}

function saveTemplate(tpl) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tpl)) } catch {}
}

// ─── Применить шаблон к реальным данным ──────────────────────────────────────
export function buildTextFromTemplate(template, distributorName, items) {
  const date   = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
  const venue = import.meta.env.VITE_VENUE_NAME || 'Бар'

  const greeting  = template.greeting.replace('{{venue}}', venue)
  const dateLine  = template.date_line.replace('{{date}}', date)

  const itemLines = items.map(item => {
    const vol  = item.volume || ''
    const unit = item.unit   || 'шт'
    return template.item_line
      .replace('{{name}}',   item.name)
      .replace('{{volume}}', vol)
      .replace('{{qty}}',    item.order_qty)
      .replace('{{unit}}',   unit)
  })

  const footer = template.footer.replace('{{total}}', items.length)

  return [greeting, dateLine, '', ...itemLines, '', footer].join('\n')
}

// ─── Описание переменных ──────────────────────────────────────────────────────
const GREETING_VARS  = ['{{venue}}', '{{date}}']
const ITEM_VARS      = ['{{name}}', '{{volume}}', '{{qty}}', '{{unit}}']
const FOOTER_VARS    = ['{{total}}']

function VarBadges({ vars, onInsert }) {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {vars.map(v => (
        <button
          key={v}
          onClick={() => onInsert(v)}
          className="px-1.5 py-0.5 text-xs font-mono bg-blue-100 dark:bg-blue-900/40
            text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800
            transition-colors"
          title={`Вставить ${v}`}
        >
          {v}
        </button>
      ))}
    </div>
  )
}

// ─── Поле редактирования с вставкой переменных ───────────────────────────────
function TemplateField({ label, value, onChange, vars, hint }) {
  const ref = React.useRef(null)

  const insertVar = (v) => {
    const el    = ref.current
    if (!el) { onChange(value + v); return }
    const start = el.selectionStart
    const end   = el.selectionEnd
    const next  = value.slice(0, start) + v + value.slice(end)
    onChange(next)
    // Восстанавливаем курсор
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + v.length, start + v.length)
    })
  }

  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </label>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm font-mono
          bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600
          rounded-xl focus:outline-none focus:border-blue-400 text-gray-900 dark:text-gray-100"
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      <VarBadges vars={vars} onInsert={insertVar} />
    </div>
  )
}

// ─── Основной компонент редактора ─────────────────────────────────────────────
export default function OrderTemplateEditor({ onClose, sampleItems }) {
  const [tpl, setTpl]       = useState(loadTemplate)
  const [saved, setSaved]   = useState(false)

  const update = (field) => (val) => setTpl(prev => ({ ...prev, [field]: val }))

  const handleSave = () => {
    saveTemplate(tpl)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    if (confirm('Сбросить шаблон к стандартному?')) {
      setTpl({ ...DEFAULT_TEMPLATE })
      saveTemplate({ ...DEFAULT_TEMPLATE })
    }
  }

  // Предпросмотр на реальных данных или на примере
  const previewItems = sampleItems?.length > 0
    ? sampleItems.slice(0, 5)
    : [
        { name: 'Martini Bianco',    volume: '1000', order_qty: 2, unit: 'шт' },
        { name: 'Hendricks Gin',     volume: '700',  order_qty: 1, unit: 'шт' },
        { name: 'Dewars White Label',volume: '1000', order_qty: 3, unit: 'шт' },
      ]

  const previewText = buildTextFromTemplate(tpl, 'Дистрибьютор', previewItems)

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Шапка */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              ✏️ Редактор шаблона заявки
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Нажимайте на переменные чтобы вставить их в нужное место
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >✕</button>
        </div>

        {/* Тело — два столбца */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── ЛЕВАЯ КОЛОНКА — редактор ── */}
          <div className="w-1/2 flex flex-col border-r border-gray-100 dark:border-gray-700">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              <TemplateField
                label="Приветствие"
                value={tpl.greeting}
                onChange={update('greeting')}
                vars={GREETING_VARS}
                hint="Первая строка сообщения"
              />

              <TemplateField
                label="Строка с датой"
                value={tpl.date_line}
                onChange={update('date_line')}
                vars={['{{date}}']}
                hint="Вторая строка — можно убрать или изменить формат"
              />

              <TemplateField
                label="Формат строки позиции"
                value={tpl.item_line}
                onChange={update('item_line')}
                vars={ITEM_VARS}
                hint="Повторяется для каждого товара в заказе"
              />

              <TemplateField
                label="Подпись / итог"
                value={tpl.footer}
                onChange={update('footer')}
                vars={FOOTER_VARS}
                hint="Последняя строка сообщения"
              />

              {/* Справка по переменным */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p className="font-bold text-gray-700 dark:text-gray-300 mb-2">Переменные:</p>
                <p><code className="text-blue-600 dark:text-blue-400">{'{{venue}}'}</code> — название заведения</p>
                <p><code className="text-blue-600 dark:text-blue-400">{'{{date}}'}</code> — дата заявки</p>
                <p><code className="text-blue-600 dark:text-blue-400">{'{{name}}'}</code> — наименование позиции</p>
                <p><code className="text-blue-600 dark:text-blue-400">{'{{volume}}'}</code> — тара (700, 1000...)</p>
                <p><code className="text-blue-600 dark:text-blue-400">{'{{qty}}'}</code> — количество к заказу</p>
                <p><code className="text-blue-600 dark:text-blue-400">{'{{unit}}'}</code> — единица (шт, л, кг...)</p>
                <p><code className="text-blue-600 dark:text-blue-400">{'{{total}}'}</code> — итого позиций</p>
              </div>
            </div>

            {/* Кнопки */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-2 shrink-0">
              <button
                onClick={handleSave}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                  saved
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {saved ? '✓ Сохранено' : '💾 Сохранить шаблон'}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400
                  bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                Сбросить
              </button>
            </div>
          </div>

          {/* ── ПРАВАЯ КОЛОНКА — предпросмотр ── */}
          <div className="w-1/2 flex flex-col bg-gray-50 dark:bg-gray-800/50">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Предпросмотр
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {sampleItems?.length > 0
                  ? `Показаны реальные позиции (первые ${previewItems.length})`
                  : 'Пример данных — сформируйте заказ для реального предпросмотра'
                }
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Имитация WhatsApp bubble */}
              <div className="max-w-sm">
                <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-tl-sm shadow-md px-4 py-3">
                  <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                    {previewText}
                  </pre>
                  <p className="text-right text-xs text-gray-400 mt-2">
                    {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Так выглядит сообщение в WhatsApp
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  , document.body)
}