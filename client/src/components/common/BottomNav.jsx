import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', icon: 'auto_awesome', label: 'Home' },
  { to: '/scan', icon: 'photo_camera', label: 'Scan' },
  { to: '/ensembles', icon: 'styler', label: 'Looks' },
  { to: '/recommendations', icon: 'apparel', label: 'Picks' },
  { to: '/profile', icon: 'person', label: 'Profile' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center py-2 pb-safe px-4 bg-surface/90 backdrop-blur-xl rounded-t-xl shadow-[0_-10px_20px_rgba(108,60,225,0.12)] md:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center active:scale-95 transition-all ${
              isActive
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-primary-container'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="font-label text-xs font-semibold tracking-wider">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 bg-secondary rounded-full mt-0.5" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
