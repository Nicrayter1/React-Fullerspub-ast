import React, { useState, useEffect, useCallback } from 'react'
import { fetchDistributors, saveDistributor, deleteDistributor } from '../api/distributors'
import Button from './ui/Button'
import Card from './ui/Card'

// ─── Форма добавления / редактирования ───────────────────────────────────────
function DistributorForm({ initial, onSave, onCancel }) {
  const [name, setName]         = useState(initial?.name || '')
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp || '')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Введите название'); return }
    try {
      setSaving(true)
      setError(null)
      await onSave({ id: initial?.id, name, whatsapp })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
      <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
        {initial ? 'Редактировать дистрибьютора' : 'Новый дистрибьютор'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Название */}
        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Название *
          </label>
          <input
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600
              rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
              focus:outline-none focus:border-blue-400"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="North trade"
          />
        </div>

        {/* WhatsApp */}
        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            WhatsApp (номер)
          </label>
          <div className="mt-1 flex items-center gap-1">
            <span className="px-2 py-2 text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 rounded-l-xl border border-r-0 border-gray-200 dark:border-gray-600">
              +
            </span>
            <input
              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600
                rounded-r-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                focus:outline-none focus:border-blue-400"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="77071234567"
              maxLength={15}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Только цифры, без + и пробелов</p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <Button onClick={handleSubmit} variant="primary" loading={saving} size="sm">
          {saving ? 'Сохранение...' : 'Сохранить'}
        </Button>
        <Button onClick={onCancel} variant="ghost" size="sm">
          Отмена
        </Button>
      </div>
    </div>
  )
}

// ─── Основной компонент ───────────────────────────────────────────────────────
export default function DistributorManager() {
  const [distributors, setDistributors] = useState([])
  const [loading, setLoading]           = useState(false)
  const [showForm, setShowForm]         = useState(false)
  const [editTarget, setEditTarget]     = useState(null)  // объект или null
  const [notif, setNotif]               = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)  // id или null

  const notify = (msg, type = 'info') => {
    setNotif({ msg, type })
    setTimeout(() => setNotif(null), 4000)
  }

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setDistributors(await fetchDistributors())
    } catch (err) {
      notify('Ошибка загрузки: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (data) => {
    await saveDistributor(data)
    setShowForm(false)
    setEditTarget(null)
    notify(data.id ? 'Обновлено' : 'Дистрибьютор добавлен', 'success')
    await load()
  }

  const handleDelete = async (id) => {
    try {
      await deleteDistributor(id)
      setConfirmDelete(null)
      notify('Удалено', 'success')
      await load()
    } catch (err) {
      notify('Ошибка удаления: ' + err.message, 'error')
    }
  }

  return (
    <div className="space-y-4">

      {/* Уведомление */}
      {notif && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
          notif.type === 'success' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' :
          notif.type === 'error'   ? 'bg-red-100   dark:bg-red-900/40   text-red-800   dark:text-red-300'   :
                                     'bg-blue-100  dark:bg-blue-900/40  text-blue-800  dark:text-blue-300'
        }`}>
          {notif.msg}
        </div>
      )}

      {/* Шапка */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Справочник дистрибьюторов
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Добавьте номера WhatsApp — они будут использоваться при отправке заказов
          </p>
        </div>
        <Button
          onClick={() => { setShowForm(true); setEditTarget(null) }}
          variant="primary"
          size="sm"
        >
          + Добавить
        </Button>
      </div>

      {/* Форма создания */}
      {showForm && !editTarget && (
        <DistributorForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Таблица */}
      <Card>
        {loading ? (
          <div className="py-8 text-center text-gray-400 text-sm">Загрузка...</div>
        ) : distributors.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-400 text-sm">Дистрибьюторы не добавлены</p>
            <p className="text-gray-400 text-xs mt-1">Нажмите «+ Добавить» чтобы начать</p>
          </div>
        ) : (
          <div className="overflow-x-auto -m-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="text-left px-6 py-3 font-medium">Название</th>
                  <th className="text-left px-6 py-3 font-medium">WhatsApp</th>
                  <th className="text-left px-6 py-3 font-medium">Статус</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {distributors.map(d => (
                  <React.Fragment key={d.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {d.name}
                      </td>
                      <td className="px-6 py-3 font-mono text-sm text-gray-700 dark:text-gray-300">
                        {d.whatsapp ? `+${d.whatsapp}` : '—'}
                      </td>
                      <td className="px-6 py-3">
                        {d.whatsapp ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                            bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            ✓ Готов к заказу
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                            bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                            ⚠ Нет номера
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            onClick={() => { setEditTarget(d); setShowForm(false) }}
                            variant="ghost"
                            size="sm"
                          >
                            ✏ Изменить
                          </Button>
                          <Button
                            onClick={() => setConfirmDelete(d.id)}
                            variant="danger"
                            size="sm"
                          >
                            Удалить
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Форма редактирования под строкой */}
                    {editTarget?.id === d.id && (
                      <tr>
                        <td colSpan={4} className="px-4 py-3">
                          <DistributorForm
                            initial={d}
                            onSave={handleSave}
                            onCancel={() => setEditTarget(null)}
                          />
                        </td>
                      </tr>
                    )}

                    {/* Подтверждение удаления под строкой */}
                    {confirmDelete === d.id && (
                      <tr>
                        <td colSpan={4} className="px-4 py-3">
                          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20
                            border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                            <p className="text-sm text-red-700 dark:text-red-300 flex-1">
                              Удалить <strong>{d.name}</strong>? Продукты останутся, но потеряют привязку к этому дистрибьютору.
                            </p>
                            <Button onClick={() => handleDelete(d.id)} variant="error" size="sm">
                              Удалить
                            </Button>
                            <Button onClick={() => setConfirmDelete(null)} variant="ghost" size="sm">
                              Отмена
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
