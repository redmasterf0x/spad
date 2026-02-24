interface NavbarProps {
  onMenuClick: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <nav className="bg-dark-800 border-b border-dark-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="text-primary-400 hover:text-primary-300 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold">
          <span className="text-primary-400">S</span>
          <span className="text-accent-400">P</span>
          <span className="text-primary-400">A</span>
          <span className="text-accent-400">D</span>
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-6">
          <button className="text-gray-400 hover:text-primary-400 transition-colors">
            Notifications
          </button>
          <button className="text-gray-400 hover:text-primary-400 transition-colors">
            Settings
          </button>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-dark-950 font-bold cursor-pointer hover:shadow-lg transition-shadow">
          JD
        </div>
      </div>
    </nav>
  )
}
