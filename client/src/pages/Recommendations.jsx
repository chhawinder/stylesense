import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../utils/api'
import usePreferencesStore from '../store/preferencesStore'
import useProfileStore from '../store/profileStore'

const filters = ['All', 'Casual', 'Office', 'Evening', 'Wedding']

// Demo products to show alongside API results
const demoProducts = [
  {
    id: 1, brand: 'Ethereal India', title: 'Sculpted Midi Wrap', price: 4599, rating: 4.8, platform: 'Myntra',
    tag: 'Flatters hourglass shape',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVmBTEjWhdf96fhvUJK50ZrROmUVkgfQ19-ZhtCEoJluZezoLzII-awzhlIHsYqhX2nV0d0BbBYxZTna3dUpg2Zv-G4uO9IJjsiqyVRtV0R0UckhxAgYjI8Zk_AwHCOtNNqAKAlJDET-hW9XtoRW5ix6q1VJIz67KmdlZfj5Jt06ZLRxRPpvSoq-B31vBhVFh7-lyMnxAKRXs09w2_MC-CCvGmDbJZeuBF9QKOykCYmNYS4JutRtDnx86Jm4heDo9pa9Z_l8eQvowC',
  },
  {
    id: 2, brand: 'Urban Tailor', title: 'Linen Structure Blazer', price: 3250, rating: 4.5, platform: 'Amazon',
    tag: 'Perfect Shoulder Fit',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrCQ9vIby2aPhhVt6brkkQVIENRAdyDMVS3J3Sjw8FuuBLKamyYR1k92XWo7eaL_P-iumnlxRhFT2-eRU9ihyISDyfvhScI6MpmyXL_kb1-IjdBcFyhI8rofL9jX4aG2JuwzYE1qeFGFhaOQKbgYPCMu7hswjGOUxxPlm3n3C7JxPL01vN3jGhLWHAwHBCRNavSBv5CS7o8Sx3H56yZOlby0Y5CdSz6JS8knysFMPyeMrMNNjgBmHms7c1D1iaqH1jO6W_LkVmmi_q',
  },
  {
    id: 3, brand: 'Veda Silk', title: 'Modern Silk Drape', price: 8900, rating: 4.9, platform: 'Ajio',
    tag: 'Balances Proportions',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2myOd4ap-JoFMdaNHXQYVfttrMdB9PVZUfHFPcbcnfOepQFXcDBTfGcBuXpEJmlE2oT0-97D5jFdHWKlISwoDOBF-ZUbtTCpzeDgg_7AvA1BiWAZm-RKthc3F507G-ZsXoqjRjPQcbJmFZH_laM0bq714YPH6auW3GuCsD_81mqIQ2qh_rcvZrca0k7QTXySoK1-x_z2lxgO1O5YwZHeqDF0lBDQSn2rcXJb8p5zmNfoXs7dhgb1DLLoD_1xIubkn4SYn61uFUgTg',
  },
]

export default function Recommendations() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [loading, setLoading] = useState(false)
  const { occasions, budgetMin, budgetMax } = usePreferencesStore()
  const { bodyProfile } = useProfileStore()

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      const data = await api.getRecommendations({
        occasion: occasions[0] || 'casual',
        budget_min: budgetMin,
        budget_max: budgetMax,
      })
      setAiSuggestions(data)
    } catch {
      // API may not be running; show demo data
    }
    setLoading(false)
  }

  return (
    <main className="pt-20 pb-32 min-h-screen px-5 md:px-10">
      {/* Header */}
      <section className="mb-8">
        <h1 className="font-display text-5xl font-bold text-on-surface mb-2">Curated For You</h1>
        <p className="font-body text-lg text-on-surface-variant">
          AI-driven fashion recommendations based on your unique body scan and style profile.
        </p>
      </section>

      {/* AI Insights banner */}
      {aiSuggestions?.llm_response && (
        <section className="mb-6 bg-primary-container text-on-primary-container rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <h3 className="font-headline text-lg font-semibold">AI Style Insights</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {(aiSuggestions.llm_response.suggestions || []).slice(0, 6).map((s) => (
              <span key={s} className="px-3 py-1 bg-white/10 rounded-full text-sm">{s}</span>
            ))}
          </div>
          {aiSuggestions.llm_response.colors?.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm font-semibold">Best colors:</span>
              {aiSuggestions.llm_response.colors.slice(0, 5).map((c) => (
                <span key={c} className="px-2 py-0.5 bg-white/10 rounded text-xs">{c}</span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Filters */}
      <section className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`whitespace-nowrap px-6 py-2 rounded-full font-label text-sm font-semibold active:scale-95 transition-all ${
                activeFilter === f
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'bg-surface-container text-on-surface-variant border border-outline/20 hover:border-primary/40'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label text-sm font-semibold text-on-surface-variant">Sort by:</span>
          <button className="flex items-center gap-1 font-label text-sm font-semibold text-on-surface border-b border-on-surface/20 py-1 px-2">
            Personalized Match
            <span className="material-symbols-outlined text-lg">expand_more</span>
          </button>
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Product grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {demoProducts.map((p) => (
          <Link
            key={p.id}
            to={`/product/${p.id}`}
            className="group relative bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-[0_10px_20px_rgba(108,60,225,0.08)] transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <img src={p.img} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <button
                onClick={(e) => e.preventDefault()}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-on-surface-variant shadow-sm hover:bg-white transition-colors"
              >
                <span className="material-symbols-outlined">favorite</span>
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="glass-card px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <span className="text-xs font-semibold text-primary-fixed-dim uppercase tracking-wider">{p.tag}</span>
                </div>
              </div>
            </div>
            <div className="p-3 flex flex-col gap-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-label text-on-surface-variant uppercase text-[10px] tracking-widest">{p.brand}</p>
                  <h3 className="font-headline text-lg font-semibold text-on-surface leading-tight">{p.title}</h3>
                </div>
                <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">{p.platform}</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="font-headline text-xl font-semibold text-primary">₹{p.price.toLocaleString()}</span>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-secondary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="font-label text-sm text-on-surface-variant">{p.rating}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}
