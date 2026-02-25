import React, { useState } from 'react'
import { createPortal } from 'react-dom'

// ─── Дефолтный шаблон ────────────────────────────────────────────────────────
const DEFAULT_TEMPLATE = {
  greeting:  'Добрый день! Заявка от {{venue}}',
  date_line: 'Дата: {{date}}',
  item_line: '• {{name}} {{volume}} — {{qty}} {{unit}}',
  footer:    'Итого позиций: {{total}}',
}

const STORAGE_KEY = 'order_message_template'

export function loadTemplate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_TEMPLATE }
    return { ...DEFAULT_TEMPLATE, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_TEMPLATE }
  }
}

export function saveTemplateToStorage(tpl) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tpl)) } catch {}
}

export function buildTextFromTemplate(template, distributorName, items) {
  const date  = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const venue = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_VENUE_NAME) || 'Бар'

  const greeting = template.greeting.replace('{{venue}}', venue)
  const dateLine = template.date_line.replace('{{date}}', date)

  const itemLines = items.map(item =>
    template.item_line
      .replace('{{name}}',   item.name        || '')
      .replace('{{volume}}', item.volume       || '')
      .replace('{{qty}}',    item.order_qty    ?? '')
      .replace('{{unit}}',   item.unit         || 'шт')
  )

  const footer = template.footer.replace('{{total}}', items.length)
  return [greeting, dateLine, '', ...itemLines, '', footer].join('\n')
}

// ─── Компонент поля с вставкой переменных ────────────────────────────────────
function TemplateField({ label, hint, value, onChange, vars }) {
  const ref = React.useRef(null)

  const insertVar = (v) => {
    const el = ref.current
    if (!el) { onChange(value + v); return }
    const s = el.selectionStart
    const e = el.selectionEnd
    const next = value.slice(0, s) + v + value.slice(e)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(s + v.length, s + v.length)
    })
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </label>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-gray-200 dark:border-gray-600
          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
          focus:outline-none focus:border-blue-400"
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      <div className="flex flex-wrap gap-1">
        {vars.map(v => (
          <button
            key={v}
            type="button"
            onClick={() => insertVar(v)}
            className="px-1.5 py-0.5 text-xs font-mono rounded
              bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300
              hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Основной редактор ────────────────────────────────────────────────────────
export default function OrderTemplateEditor({ onClose, sampleItems }) {
  const [tpl, setTpl]     = useState(() => loadTemplate())
  const [saved, setSaved] = useState(false)

  const set = field => val => setTpl(prev => ({ ...prev, [field]: val }))

  const handleSave = () => {
    saveTemplateToStorage(tpl)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    if (window.confirm('Сбросить шаблон к стандартному?')) {
      setTpl({ ...DEFAULT_TEMPLATE })
      saveTemplateToStorage({ ...DEFAULT_TEMPLATE })
    }
  }

  const preview = sampleItems?.length > 0
    ? sampleItems.slice(0, 4)
    : [
        { name: 'Martini Bianco',     volume: '1000мл', order_qty: 2, unit: 'шт' },
        { name: 'Hendricks Gin',      volume: '700мл',  order_qty: 1, unit: 'шт' },
        { name: 'Dewars White Label', volume: '1000мл', order_qty: 3, unit: 'шт' },
      ]

  const previewText = buildTextFromTemplate(tpl, 'Дистрибьютор', preview)

  const editor = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999, background: 'rgba(15,23,42,0.75)' }}
      onClick={e => e.stopPropagation()}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full flex flex-col"
        style={{ maxWidth: '900px', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">✏️ Редактор шаблона заявки</h2>
            <p className="text-xs text-gray-400 mt-0.5">Нажимайте на переменные чтобы вставить их в нужное место</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg"
          >✕</button>
        </div>

        {/* Тело */}
        <div className="flex flex-1 overflow-hidden">

          {/* Левая — редактор */}
          <div className="flex flex-col border-r border-gray-100 dark:border-gray-700" style={{ width: '50%' }}>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <TemplateField
                label="Приветствие"
                hint="Первая строка сообщения"
                value={tpl.greeting}
                onChange={set('greeting')}
                vars={['{{venue}}', '{{date}}']}
              />
              <TemplateField
                label="Строка с датой"
                hint="Вторая строка — можно изменить или убрать"
                value={tpl.date_line}
                onChange={set('date_line')}
                vars={['{{date}}']}
              />
              <TemplateField
                label="Формат строки позиции"
                hint="Повторяется для каждого товара"
                value={tpl.item_line}
                onChange={set('item_line')}
                vars={['{{name}}', '{{volume}}', '{{qty}}', '{{unit}}']}
              />
              <TemplateField
                label="Подпись / итог"
                hint="Последняя строка"
                value={tpl.footer}
                onChange={set('footer')}
                vars={['{{total}}']}
              />

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p className="font-bold text-gray-700 dark:text-gray-300 mb-2">Переменные:</p>
                {[
                  ['{{venue}}',  'название заведения'],
                  ['{{date}}',   'дата заявки'],
                  ['{{name}}',   'наименование позиции'],
                  ['{{volume}}', 'тара (700мл, 1л...)'],
                  ['{{qty}}',    'количество к заказу'],
                  ['{{unit}}',   'единица (шт, л, кг...)'],
                  ['{{total}}',  'итого позиций'],
                ].map(([v, desc]) => (
                  <p key={v}><code className="text-blue-600 dark:text-blue-400">{v}</code> — {desc}</p>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSave}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                  saved ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {saved ? '✓ Сохранено' : '💾 Сохранить шаблон'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                Сбросить
              </button>
            </div>
          </div>

          {/* Правая — предпросмотр */}
          <div className="flex flex-col" style={{ width: '50%', background: 'rgba(249,250,251,0.5)' }}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Предпросмотр</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {sampleItems?.length > 0 ? `Реальные позиции (${preview.length} шт.)` : 'Пример данных'}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div style={{ maxWidth: '340px' }}>
                <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-tl-sm shadow-md px-4 py-3">
                  <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                    {previewText}
                  </pre>
                  <p className="text-right text-xs text-gray-400 mt-2">
                    {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">Так выглядит в WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(editor, document.body)
}