import React from 'react'
import { LogOut, User, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from './ui/Button'

const ROLE_NAMES = {
  manager: 'Менеджер',
  bar1: 'Бар 1',
  bar2: 'Бар 2'
}

export default function AppHeader({ user, userProfile, onSignOut, isSigningOut }) {
  const navigate = useNavigate()
  const roleLabel = ROLE_NAMES[userProfile?.role] || userProfile?.role

  return (
    <header className="bg-slate-900 dark:bg-gray-950 text-white p-4 shadow-lg sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-xl font-bold">Учет стоков бара</h1>

        <div className="flex items-center gap-3 md:gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-white/10 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            <User className="w-5 h-5 text-gray-300" />
            <div className="flex flex-col">
              <span className="text-xs md:text-sm font-medium leading-tight">{user?.email}</span>
              <span className="text-[10px] md:text-xs text-gray-400 leading-tight">{roleLabel}</span>
            </div>
          </div>

          {userProfile?.role === 'manager' && (
            <Button
              onClick={() => navigate('/admin')}
              variant="primary"
              size="sm"
              className="bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-200 shadow-none"
              icon={Settings}
            >
              <span className="hidden sm:inline">Админ-панель</span>
            </Button>
          )}

          <Button
            onClick={onSignOut}
            variant="danger"
            size="sm"
            loading={isSigningOut}
            icon={LogOut}
          >
            <span className="hidden sm:inline">Выйти</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
