import React from 'react'
import { Upload, Download, RefreshCw } from 'lucide-react'
import Button from './ui/Button'

export default function ActionBar({ onSync, onSave, onExport, loading }) {
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          onClick={onSync}
          loading={loading}
          variant="info"
          className="flex-1 min-w-[140px]"
          icon={RefreshCw}
        >
          Синхронизировать
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-8">
        <Button
          onClick={onSave}
          loading={loading}
          variant="primary"
          icon={Upload}
        >
          Сохранить в БД
        </Button>
        <Button
          onClick={onExport}
          variant="ghost"
          className="bg-gray-600 hover:bg-gray-700 text-white"
          icon={Download}
        >
          Экспорт CSV
        </Button>
      </div>
    </>
  )
}
