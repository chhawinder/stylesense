import { Link, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const desktopNav = [
  { to: '/', icon: 'auto_awesome', label: 'Home' },
  { to: '/scan', icon: 'photo_camera', label: 'Scan' },
  { to: '/ensembles', icon: 'styler', label: 'Looks' },
  { to: '/recommendations', icon: 'apparel', label: 'Picks' },
  { to: '/profile', icon: 'person', label: 'Profile' },
]

export default function TopAppBar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="fixed top-0 w-full flex justify-between items-center px-5 md:px-10 py-4 bg-surface/80 backdrop-blur-md z-50 shadow-sm">
      <Link to="/" className="font-headline text-2xl font-bold text-primary">
        StyleSense
      </Link>

      {/* Desktop navigation */}
      <nav className="hidden md:flex items-center gap-1">
        {desktopNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-4 py-2 rounded-full font-label text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined text-lg"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-6">
        <button className="material-symbols-outlined text-on-surface-variant hover:opacity-80 transition-opacity">
          notifications
        </button>
        {user ? (
          <div className="flex items-center gap-3">
            {user.avatar && (
              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full border border-outline-variant" />
            )}
            <button
              onClick={handleLogout}
              className="hidden md:block text-on-surface-variant font-label text-sm font-semibold hover:text-on-surface transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            to="/"
            className="hidden md:block bg-primary text-on-primary px-6 py-2 rounded-full font-label text-sm font-semibold active:scale-90 transition-transform"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  )
}
