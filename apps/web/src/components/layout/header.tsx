import { Bell } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export function Header({ title, subtitle, children }: HeaderProps) {
  return (
    <header className="h-14 border-b bg-white px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {children}
        <button className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </header>
  )
}
