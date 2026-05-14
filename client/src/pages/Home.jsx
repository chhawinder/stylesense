import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const features = [
  {
    title: 'Body Scan',
    desc: 'Precision 3D analysis for the perfect fit.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVd3DYvToDMncwTuKq3PrhL7GnEVupaMdFbksmb7U6o8UKub5T8ZRuxy5S5EogqwXhgxc6RoJNRDODJQl_gdhlm2DXcJmcOa-QCiTwBFNt94HiLN2eOHiTbS8KbKtzWJHrtWkCFZ05sExmLshZNweEmVz0WWpQ5nPV4TcZcLR6hH78TMk8VnOzVHBvxZjA7Q_lr96_ktwDILVQYqQEM3xUMwvn8iRKY8owruZQdT4S3ofP9WkY8aKIVjQOnqvCwNz7cG0s1-M4IuLZ',
  },
  {
    title: 'Color Analysis',
    desc: 'Discover shades that complement your skin tone.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDV01pDIOOen6gwTHGLxOZwp27FSmjyftWu38zJrMPah6rYdXQXyidCOYAsJxMNr1859N__za4Ke19VherpB30DnuW9Etm10nF-fTRdHA2y6sRYK3Tj4ONFzWF_Wt_rctdki6Cx81-m164YacwIhDDqZOlzB1zAOrv2y-I_oYuhfQfolzuvFsPTIx5x8-HrJS1v4tQSA6hU0G7fuYJ-NI36ppbDG8Go5hG6krPpsj4xMxkQvMyogtyuw3BB64QqPoZptHfYrMezIEft',
  },
  {
    title: 'Smart Picks',
    desc: 'Daily curation from top Indian retailers.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHz8zvuJ6goaQuAgtzUldTt964-As-9oItqrkHDlH3GwteF7utJu11L2xtFaJf0GI118yeFJ0vi6TtATGpaldSJJ8Vbt1CCqFZS5_LqB6lQnDVlgl89kFm0Ati5UoCCdI7-U0WwD646c0Bxcqs5yxPu6gI24wdPZ3XGM2AbIJdd26JUSm2fcuZp8_zAcBgYhrUK9ovimOf9IACSzlMFyLF6zwj-DOqhxSfRVPQwLYsm-oruFtkKVb9FU8yPbJ-2vY9A-7e5QOXL2jm',
  },
]

const steps = [
  { icon: 'photo_camera', title: 'Scan', desc: 'Take two quick photos to create your 3D body profile.' },
  { icon: 'analytics', title: 'Analyze', desc: 'AI identifies your shape, proportions, and best colors.' },
  { icon: 'check_circle', title: 'Match', desc: 'We filter millions of items to find your perfect matches.' },
  { icon: 'shopping_bag', title: 'Shop', desc: 'Buy directly from Myntra, Amazon, and more.' },
]

export default function Home() {
  const { user, loginWithGoogle, logout } = useAuthStore()
  const navigate = useNavigate()

  // Handle Google OAuth redirect callback (access_token in URL hash)
  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      if (accessToken) {
        window.history.replaceState(null, '', window.location.pathname)
        loginWithGoogle(accessToken)
          .then(() => navigate('/scan'))
          .catch((err) => console.error('Google login failed:', err))
      }
    }
  }, [])

  const googleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const redirectUri = window.location.origin + '/'
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent('openid email profile')}`
    window.location.href = url
  }

  return (
    <main className="pt-24 pb-12">
      {/* Hero */}
      <section className="px-5 md:px-10 mb-12 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="font-display text-5xl md:text-[64px] md:leading-[72px] font-bold tracking-tight mb-3 text-on-surface">
            Your AI Stylist — Powered by Your{' '}
            <span className="text-primary">Unique Body</span>
          </h1>
          <p className="font-body text-lg text-on-surface-variant mb-6 max-w-2xl mx-auto">
            Scan. Analyze. Get personalized fashion picks from Myntra, Amazon, Flipkart &amp; Meesho.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link
              to="/scan"
              onClick={(e) => { if (!user) { e.preventDefault(); googleLogin() } }}
              className="royal-flow text-on-primary font-headline text-2xl font-semibold px-12 py-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              Get Started
            </Link>
            {user ? (
              <button
                onClick={logout}
                className="flex items-center gap-2 px-6 py-2 border border-outline-variant rounded-full bg-white text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                {user.avatar && <img src={user.avatar} alt="" className="w-5 h-5 rounded-full" />}
                <span className="font-label text-sm font-semibold">Sign out</span>
              </button>
            ) : (
              <button
                onClick={() => googleLogin()}
                className="flex items-center gap-2 px-6 py-2 border border-outline-variant rounded-full bg-white text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="font-label text-sm font-semibold">Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </section>

      {/* Feature Cards */}
      <section className="px-5 md:px-10 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-xl h-[400px] shadow-sm hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <img src={f.img} alt={f.title} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 w-full glass-card p-6">
                <h3 className="font-headline text-2xl font-semibold text-on-surface mb-1">{f.title}</h3>
                <p className="text-on-surface-variant">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-surface-container-low py-12 px-5 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-on-surface">How It Works</h2>
            <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {steps.map((s) => (
              <div key={s.title} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-outline-variant hover:border-primary transition-colors">
                  <span className="material-symbols-outlined text-primary text-3xl">{s.icon}</span>
                </div>
                <h4 className="font-headline text-2xl font-semibold text-on-surface mb-2">{s.title}</h4>
                <p className="text-on-surface-variant px-4">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAB */}
      <div className="fixed bottom-24 right-6 md:right-10 z-40">
        <Link
          to="/scan"
          onClick={(e) => { if (!user) { e.preventDefault(); googleLogin() } }}
          className="royal-flow w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center text-on-primary hover:scale-110 active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-3xl">add_a_photo</span>
        </Link>
      </div>
    </main>
  )
}
