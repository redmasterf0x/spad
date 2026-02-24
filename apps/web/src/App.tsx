import { useState } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Orders from './pages/Orders'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'accounts':
        return <Accounts />
      case 'orders':
        return <Orders />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-dark-950">
      <Sidebar 
        isOpen={sidebarOpen} 
        setCurrentPage={setCurrentPage}
        currentPage={currentPage}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
