import { useNavigate } from 'react-router-dom'
import usePreferencesStore from '../store/preferencesStore'

const OCCASIONS = ['Casual', 'Office', 'Party', 'Wedding', 'Festive', 'Ethnic', 'Gym', 'Date Night']
const STYLES = ['Minimalist', 'Bohemian', 'Streetwear', 'Traditional', 'Fusion', 'Elegant']
const PLATFORMS = [
  { name: 'Amazon', letter: 'A' },
  { name: 'Myntra', letter: 'M' },
  { name: 'Flipkart', letter: 'F' },
  { name: 'Meesho', letter: 'M' },
]

export default function Preferences() {
  const navigate = useNavigate()
  const { occasions, styles, platforms, budgetMax, toggle, setBudget } = usePreferencesStore()

  return (
    <main className="pt-24 pb-12 px-5 md:px-10 max-w-4xl mx-auto">
      <section className="mb-12 text-center">
        <h1 className="font-display text-5xl font-bold text-on-surface mb-3">Tell us your style</h1>
        <p className="font-body text-lg text-on-surface-variant max-w-xl mx-auto">
          Help our AI curator understand your fashion DNA for a hyper-personalized boutique experience.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left visual (desktop only) */}
        <div className="md:col-span-4 hidden md:block">
          <div className="sticky top-28 space-y-4">
            <div className="rounded-xl overflow-hidden shadow-lg h-64 relative group">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBr192HymQwwT89cyRnxU1FJ4yntJaij6x8BoA5ggZVlJPoe9PZVDxYtGphh57tGxkXi2uwXqS9TQSkz_MRt8aDpfOQ66QGw1AW8ql_Na_cXcT5CaShnzHk7vmyi_bFllD9CFLxxuoX3BRoM3ei3EcHcWi27scDVCfP10ziYwJPdx8uSzFEBGQfAtHt3o9ywCchi9ANbnBj60DdU4NUGK12n-CXWpP-V064udQ-eoEzQf4MZTZu6ShDWIKLNUvzLrCFjQbXwV2_3iRE"
                alt="Fashion Aesthetic"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <span className="text-white font-label text-sm font-semibold">Inspired by you</span>
              </div>
            </div>
            <div className="glass-card p-6 rounded-xl space-y-2">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              <h4 className="font-headline text-2xl font-semibold text-primary">AI Match</h4>
              <p className="text-sm text-on-surface-variant">We use 24+ data points to match outfits to your lifestyle.</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-8 space-y-6">
          {/* Occasions */}
          <div className="glass-card p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">event</span>
              <h3 className="font-headline text-2xl font-semibold">What's the occasion?</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((o) => (
                <button
                  key={o}
                  onClick={() => toggle('occasions', o)}
                  className={`px-4 py-2 rounded-full font-label text-sm font-semibold active:scale-95 transition-all ${
                    occasions.includes(o)
                      ? 'border border-primary bg-primary/5 text-primary'
                      : 'border border-outline/20 bg-surface-container-lowest hover:border-primary/50'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* Styles */}
          <div className="glass-card p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">palette</span>
              <h3 className="font-headline text-2xl font-semibold">Your Aesthetic</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggle('styles', s)}
                  className={`px-4 py-2 rounded-full font-label text-sm font-semibold active:scale-95 transition-all ${
                    styles.includes(s)
                      ? 'border border-primary bg-primary/5 text-primary'
                      : 'border border-outline/20 bg-surface-container-lowest hover:border-primary/50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="glass-card p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span>
                <h3 className="font-headline text-2xl font-semibold">Budget Range</h3>
              </div>
              <span className="text-primary font-bold font-headline text-2xl">
                ₹500 — ₹{budgetMax.toLocaleString()}
              </span>
            </div>
            <input
              type="range" min="500" max="20000" step="500" value={budgetMax}
              onChange={(e) => setBudget(500, Number(e.target.value))}
              className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between mt-2 font-label text-sm text-on-surface-variant">
              <span>₹500</span><span>₹20,000+</span>
            </div>
          </div>

          {/* Platforms */}
          <div className="glass-card p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">shopping_bag</span>
              <h3 className="font-headline text-2xl font-semibold">Preferred Platforms</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {PLATFORMS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => toggle('platforms', p.name)}
                  className={`p-4 rounded-xl flex flex-col items-center gap-3 cursor-pointer transition-all active:scale-95 ${
                    platforms.includes(p.name)
                      ? 'border border-primary bg-primary/5'
                      : 'border border-outline/20 bg-surface-container-lowest hover:border-primary/50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    platforms.includes(p.name) ? 'bg-primary/10 text-primary' : 'bg-secondary-container/20 text-secondary'
                  }`}>
                    {p.letter}
                  </div>
                  <span className={`font-label text-sm font-semibold ${platforms.includes(p.name) ? 'text-primary' : ''}`}>
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-6">
            <button
              onClick={() => navigate('/recommendations')}
              className="w-full royal-flow text-white py-5 rounded-xl font-headline text-2xl font-semibold shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Get Recommendations
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
