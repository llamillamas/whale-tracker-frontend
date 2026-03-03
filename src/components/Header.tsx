import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { formatAddress } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Menu, X, Waves, LogOut, User } from 'lucide-react'

export function Header() {
  const { user, isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-gray-950 border-b border-gray-800 shadow-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white">
          <Waves className="h-6 w-6 text-blue-400" />
          <span>Whale Tracker</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/whales" className="text-gray-300 hover:text-white transition-colors">
            Whales
          </Link>
          {isLoggedIn && (
            <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">
              Dashboard
            </Link>
          )}
        </nav>

        {/* Desktop User Menu */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
                <User className="h-4 w-4 text-blue-400" />
                <span>{formatAddress(user.address)}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-400 hover:text-white">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm">Connect Wallet</Button>
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-gray-300 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-950 border-t border-gray-800 px-4 py-4 flex flex-col gap-4">
          <Link to="/whales" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white">
            Whales
          </Link>
          {isLoggedIn && (
            <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white">
              Dashboard
            </Link>
          )}
          {isLoggedIn && user ? (
            <>
              <div className="text-sm text-gray-400">{formatAddress(user.address)}</div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              <Button className="w-full">Connect Wallet</Button>
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
