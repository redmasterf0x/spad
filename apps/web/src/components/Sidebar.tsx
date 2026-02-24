interface SidebarProps {
  isOpen: boolean
  setCurrentPage: (page: string) => void
  currentPage: string
}

export default function Sidebar({ isOpen, setCurrentPage, currentPage }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'accounts', label: 'Accounts', icon: '💼' },
    { id: 'orders', label: 'Orders', icon: '📈' },
    { id: 'positions', label: 'Positions', icon: '🎯' },
    { id: 'transfers', label: 'Transfers', icon: '💸' },
  ]

  return (
    <aside className={`${
      isOpen ? 'w-64' : 'w-0'
    } bg-dark-800 border-r border-dark-700 transition-all duration-300 overflow-hidden flex flex-col`}>
      <div className="p-6 border-b border-dark-700">
        <div className="text-center">
          <div className="text-3xl font-bold mb-2">
            <span className="text-primary-400">S</span>
            <span className="text-accent-400">P</span>
            <span className="text-primary-400">A</span>
            <span className="text-accent-400">D</span>
          </div>
          <p className="text-sm text-gray-400">Trading Platform</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setCurrentPage(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  currentPage === item.id
                    ? 'bg-primary-500/20 text-primary-400 border-l-2 border-primary-500'
                    : 'text-gray-400 hover:text-primary-400 hover:bg-dark-700'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-dark-700">
        <button className="w-full py-2 px-4 bg-accent-500 text-dark-950 font-semibold rounded-lg hover:bg-accent-600 transition-colors">
          Logout
        </button>
      </div>
    </aside>
  )
}
