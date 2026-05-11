import { Link } from 'react-router-dom'

export default function TopAppBar() {
  return (
    <header className="fixed top-0 w-full flex justify-between items-center px-5 md:px-10 py-4 bg-surface/80 backdrop-blur-md z-50 shadow-sm">
      <Link to="/" className="font-headline text-2xl font-bold text-primary">
        StyleSense
      </Link>
      <div className="flex items-center gap-6">
        <button className="material-symbols-outlined text-on-surface-variant hover:opacity-80 transition-opacity">
          notifications
        </button>
        <Link
          to="/scan"
          className="hidden md:block bg-primary text-on-primary px-6 py-2 rounded-full font-label text-sm font-semibold active:scale-90 transition-transform"
        >
          Get Started
        </Link>
      </div>
    </header>
  )
}
