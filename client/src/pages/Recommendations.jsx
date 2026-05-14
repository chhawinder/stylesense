import { useState, useEffect, useCallback, useRef } from 'react'
import useProfileStore from '../store/profileStore'

const API_BASE = import.meta.env.VITE_API_URL || ''

const OCCASIONS = ['Casual', 'Office', 'Party', 'Wedding', 'Festive', 'Date Night']
const CATEGORIES = ['All', 'Top', 'Bottom', 'Dress', 'Kurta', 'Saree', 'Blazer', 'Shoes', 'Accessory']

export default function Recommendations() {
  const { bodyProfile, scanResult, loadProfile } = useProfileStore()
  const profile = bodyProfile || scanResult

  const [products, setProducts] = useState([])
  const [styleRules, setStyleRules] = useState(null)
  const [styleTip, setStyleTip] = useState('')
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [pendingQueries, setPendingQueries] = useState([])
  const [page, setPage] = useState(0)

  // Filters
  const [occasion, setOccasion] = useState('Casual')
  const [activeCategory, setActiveCategory] = useState('All')
  const [budgetMin, setBudgetMin] = useState(500)
  const [budgetMax, setBudgetMax] = useState(10000)
  const [savedItems, setSavedItems] = useState(new Set())

  // Infinite scroll sentinel
  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!profile) loadProfile()
  }, [])

  // Build request body
  const buildRequest = useCallback((pageNum, queries) => ({
    body_shape: profile?.body_shape,
    skin_undertone: profile?.skin_undertone,
    color_season: profile?.color_season,
    face_shape: profile?.face_shape,
    gender: profile?.gender || 'female',
    predicted_size: profile?.predicted_size || 'M',
    occasion: occasion.toLowerCase(),
    budget_min: budgetMin,
    budget_max: budgetMax,
    page: pageNum,
    pending_queries: queries || [],
  }), [profile, occasion, budgetMin, budgetMax])

  // Initial fetch (page 0)
  const fetchInitial = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    setError(null)
    setProducts([])
    setPage(0)
    setPendingQueries([])
    setHasMore(false)

    try {
      const res = await fetch(`${API_BASE}/api/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRequest(0, [])),
      })
      if (!res.ok) throw new Error('Failed to fetch recommendations')
      const data = await res.json()
      setProducts(data.products || [])
      if (data.style_rules) setStyleRules(data.style_rules)
      if (data.style_tip) setStyleTip(data.style_tip)
      setSource(data.source || 'rules')
      setHasMore(data.has_more || false)
      setPendingQueries(data.pending_queries || [])
      setPage(1)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [profile, buildRequest])

  // Load more (page 1+)
  const fetchMore = useCallback(async () => {
    if (loadingMore || !hasMore || pendingQueries.length === 0) return
    setLoadingMore(true)

    try {
      const res = await fetch(`${API_BASE}/api/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRequest(page, pendingQueries)),
      })
      if (!res.ok) throw new Error('Failed to load more')
      const data = await res.json()
      setProducts((prev) => [...prev, ...(data.products || [])])
      setHasMore(data.has_more || false)
      setPendingQueries(data.pending_queries || [])
      setPage((p) => p + 1)
    } catch {
      // Silently fail on load-more
    }
    setLoadingMore(false)
  }, [loadingMore, hasMore, pendingQueries, page, buildRequest])

  // Fetch on occasion change
  useEffect(() => {
    if (profile) fetchInitial()
  }, [profile, occasion])

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchMore()
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, fetchMore])

  const toggleSave = (idx) => {
    setSavedItems((prev) => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  // Filter by category (client-side)
  const filtered = activeCategory === 'All'
    ? products
    : products.filter((p) => p.category?.toLowerCase() === activeCategory.toLowerCase())

  // No profile
  if (!profile && !loading) {
    return (
      <main className="pt-24 pb-32 flex flex-col items-center justify-center min-h-screen px-5">
        <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">body_system</span>
        <h2 className="font-headline text-2xl font-semibold text-on-surface mb-2">Complete Your Body Scan First</h2>
        <p className="text-on-surface-variant text-center mb-6">We need your body analysis to generate personalized recommendations.</p>
        <a href="/scan" className="royal-flow text-white px-8 py-3 rounded-full font-headline text-lg font-semibold active:scale-95 transition-transform">
          Start Scan
        </a>
      </main>
    )
  }

  return (
    <main className="pt-20 pb-32 min-h-screen px-5 md:px-10 max-w-7xl mx-auto">
      {/* Header */}
      <section className="mb-5">
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-on-surface mb-1">Shop Your Style</h1>
        <p className="text-on-surface-variant">
          Real products picked for your{' '}
          <span className="font-semibold capitalize">{profile?.body_shape?.replace('_', ' ')}</span> shape &{' '}
          <span className="font-semibold capitalize">{profile?.skin_undertone}</span> undertone
        </p>
      </section>

      {/* Profile chips */}
      <section className="flex flex-wrap gap-2 mb-5">
        {[
          { icon: 'shape_line', label: profile?.body_shape?.replace('_', ' ') },
          { icon: 'palette', label: `${profile?.skin_undertone} · ${profile?.color_season}` },
          { icon: 'face', label: profile?.face_shape },
          { icon: 'straighten', label: `Size ${profile?.predicted_size || 'M'}` },
        ].map((chip) => (
          <div key={chip.icon} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-fixed rounded-full">
            <span className="material-symbols-outlined text-primary text-sm">{chip.icon}</span>
            <span className="font-label text-xs font-semibold text-primary capitalize">{chip.label}</span>
          </div>
        ))}
      </section>

      {/* Occasion tabs */}
      <section className="mb-4">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {OCCASIONS.map((o) => (
            <button
              key={o}
              onClick={() => { setOccasion(o); setActiveCategory('All') }}
              className={`whitespace-nowrap px-5 py-2 rounded-full font-label text-sm font-semibold transition-all active:scale-95 ${
                occasion === o
                  ? 'royal-flow text-white shadow-md'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </section>

      {/* Category filter + budget */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full font-label text-xs font-semibold transition-all ${
                activeCategory === c
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-surface-container rounded-lg px-2 py-1">
            <span className="text-on-surface-variant text-xs">₹</span>
            <input
              type="number"
              value={budgetMin}
              onChange={(e) => setBudgetMin(Number(e.target.value))}
              className="w-16 bg-transparent text-on-surface font-semibold text-xs outline-none"
            />
          </div>
          <span className="text-on-surface-variant text-xs">—</span>
          <div className="flex items-center gap-1 bg-surface-container rounded-lg px-2 py-1">
            <span className="text-on-surface-variant text-xs">₹</span>
            <input
              type="number"
              value={budgetMax}
              onChange={(e) => setBudgetMax(Number(e.target.value))}
              className="w-16 bg-transparent text-on-surface font-semibold text-xs outline-none"
            />
          </div>
          <button
            onClick={fetchInitial}
            className="px-3 py-1.5 rounded-full bg-primary text-white font-label text-xs font-semibold active:scale-95 transition-transform"
          >
            Go
          </button>
        </div>
      </section>

      {/* AI style tip */}
      {styleTip && !loading && (
        <section className="mb-4 bg-gradient-to-r from-primary-container/60 to-secondary-container/40 rounded-xl p-3.5">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <div>
              <h3 className="font-label text-xs font-semibold text-on-primary-container uppercase tracking-wider mb-1">
                AI Styling Tip {source === 'gemini' && <span className="text-primary">• Gemini</span>}
              </h3>
              <p className="text-sm text-on-primary-container leading-relaxed">{styleTip}</p>
            </div>
          </div>
        </section>
      )}

      {/* Style rules */}
      {styleRules && !loading && (
        <section className="mb-5 bg-primary-container/40 rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>checkroom</span>
            <h3 className="font-label text-sm font-semibold text-on-primary-container">Best styles for you</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(styleRules.best_styles || []).slice(0, 4).map((s) => (
              <span key={s} className="px-2 py-0.5 bg-white/40 rounded-full text-xs font-semibold text-on-primary-container">{s}</span>
            ))}
            <span className="px-2 py-0.5 bg-white/40 rounded-full text-xs text-on-primary-container">
              Colors: {(styleRules.best_colors || []).slice(0, 3).join(', ')}
            </span>
          </div>
        </section>
      )}

      {/* Initial loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-on-surface-variant font-label">Finding products for {occasion.toLowerCase()} wear...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-error mb-2">error</span>
          <p className="text-error font-semibold mb-2">Couldn't load products</p>
          <p className="text-on-surface-variant text-sm mb-4">{error}</p>
          <button onClick={fetchInitial} className="px-6 py-2 rounded-full bg-primary text-white font-semibold active:scale-95 transition-transform">
            Retry
          </button>
        </div>
      )}

      {/* Results count */}
      {!loading && !error && filtered.length > 0 && (
        <p className="text-on-surface-variant text-sm mb-4">
          <span className="font-semibold text-on-surface">{filtered.length}</span> products
          {activeCategory !== 'All' && <> in <span className="capitalize font-semibold">{activeCategory}</span></>}
          {' '}for <span className="capitalize font-semibold">{occasion}</span>
          {hasMore && <span className="text-primary"> • Scroll for more</span>}
        </p>
      )}

      {/* Product grid */}
      {!loading && !error && (
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filtered.map((item, idx) => (
            <a
              key={`${item.product_url}-${idx}`}
              href={item.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-[0_8px_24px_rgba(108,60,225,0.12)] transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image */}
              <div className="relative aspect-[3/4] overflow-hidden bg-surface-container">
                {item.image_url ? (
                  <>
                    <img
                      src={item.image_url}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                    <div className="hidden w-full h-full items-center justify-center absolute inset-0 bg-surface-container">
                      <span className="material-symbols-outlined text-4xl text-outline-variant">image_not_supported</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-fixed/30 to-surface-container">
                    <span className="material-symbols-outlined text-5xl text-primary/20">checkroom</span>
                  </div>
                )}

                {/* Platform badge */}
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${
                    item.platform === 'Amazon'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.platform}
                  </span>
                </div>

                {/* Favorite */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSave(idx) }}
                  className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all active:scale-90 ${
                    savedItems.has(idx)
                      ? 'bg-error/90 text-white'
                      : 'bg-white/80 backdrop-blur-sm text-on-surface-variant hover:bg-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: savedItems.has(idx) ? "'FILL' 1" : "'FILL' 0" }}>
                    favorite
                  </span>
                </button>

                {/* Rating */}
                {item.rating && (
                  <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-secondary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-[10px] font-bold text-on-surface">{item.rating}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-2.5 md:p-3">
                {item.brand && (
                  <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest mb-0.5 truncate">{item.brand}</p>
                )}
                <h3 className="text-sm font-semibold text-on-surface leading-snug line-clamp-2 mb-1.5">{item.title}</h3>
                <div className="flex items-center justify-between">
                  {item.price ? (
                    <span className="font-headline text-lg font-bold text-primary">₹{item.price.toLocaleString('en-IN')}</span>
                  ) : (
                    <span className="text-xs text-on-surface-variant">View price →</span>
                  )}
                  <span className="text-[10px] text-on-surface-variant capitalize bg-surface-container px-1.5 py-0.5 rounded-full">{item.category}</span>
                </div>
              </div>
            </a>
          ))}
        </section>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex items-center justify-center gap-3 py-8">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant font-label text-sm">Loading more products...</p>
        </div>
      )}

      {/* Empty state for category filter */}
      {!loading && !error && filtered.length === 0 && products.length > 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">filter_alt_off</span>
          <p className="text-on-surface-variant">No products in this category. Try <button onClick={() => setActiveCategory('All')} className="text-primary font-semibold underline">All</button></p>
        </div>
      )}

      {/* End of results */}
      {!loading && !hasMore && products.length > 0 && !loadingMore && (
        <p className="text-center text-on-surface-variant/50 font-label text-[10px] mt-6">
          {source === 'gemini' ? 'AI-curated' : 'Rule-based'} search • {products.length} products from Amazon & Flipkart
        </p>
      )}
    </main>
  )
}
