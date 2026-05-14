import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import useProfileStore from '../store/profileStore'
import useAuthStore from '../store/authStore'
import { api } from '../utils/api'

const OCCASIONS = ['Casual', 'Office', 'Party', 'Wedding', 'Festive', 'Date Night']

const SEASON_COLORS = {
  spring: { from: '#FFDAB9', to: '#FF7F50' },
  summer: { from: '#B0C4DE', to: '#6A5ACD' },
  autumn: { from: '#D2691E', to: '#8B4513' },
  winter: { from: '#2C3E50', to: '#4A0E4E' },
}

const CATEGORY_ICONS = {
  top: 'checkroom', blazer: 'suit', kurta: 'apparel', dress: 'apparel',
  saree: 'apparel', bottom: 'stock_media', shoes: 'steps', accessory: 'diamond',
}

export default function TopEnsembles() {
  const { bodyProfile, scanResult, loadProfile } = useProfileStore()
  const { user } = useAuthStore()
  const profile = bodyProfile || scanResult

  const [ensembles, setEnsembles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [occasion, setOccasion] = useState('Casual')
  const [expandedEnsemble, setExpandedEnsemble] = useState(0)

  useEffect(() => {
    if (!profile) loadProfile()
  }, [])

  const fetchEnsembles = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    setError(null)
    try {
      const data = await api.getEnsembles({
        body_shape: profile.body_shape,
        skin_undertone: profile.skin_undertone,
        color_season: profile.color_season,
        face_shape: profile.face_shape,
        gender: profile.gender || 'female',
        predicted_size: profile.predicted_size || 'M',
        kibbe_type: profile.kibbe_type,
        height_cm: profile.height_cm,
        occasion: occasion.toLowerCase().replace(' ', '_'),
        budget_min: 500,
        budget_max: 15000,
      })
      setEnsembles(data.ensembles || [])
      setExpandedEnsemble(0)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [profile, occasion])

  useEffect(() => {
    if (profile) fetchEnsembles()
  }, [profile, occasion])

  const seasonColors = SEASON_COLORS[profile?.color_season] || SEASON_COLORS.autumn
  const mannequinSrc = `/mannequins/${(profile?.body_shape || 'rectangle').replace('_', '-')}-${(profile?.gender || 'female')[0]}.svg`

  // No profile guard
  if (!profile && !loading) {
    return (
      <div className="pt-24 pb-12 px-5 text-center">
        <span className="material-symbols-outlined text-primary text-6xl mb-4">apparel</span>
        <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">Complete Your Scan First</h2>
        <p className="text-on-surface-variant mb-6">We need your body profile to curate perfect ensembles.</p>
        <Link to="/scan" className="royal-flow text-on-primary px-8 py-3 rounded-full font-label text-sm font-semibold">
          Start Body Scan
        </Link>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-32 px-5 md:px-10 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <p className="text-primary font-label text-sm tracking-widest uppercase mb-2">
          Curated for {user?.name || 'You'}
        </p>
        <h2 className="font-display text-3xl md:text-5xl font-bold text-on-surface mb-3">
          Your Top Ensembles
        </h2>
        <div className="h-1 w-24 royal-flow rounded-full" />
      </header>

      {/* Occasion tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-8 -mx-5 px-5">
        {OCCASIONS.map((occ) => (
          <button key={occ} onClick={() => setOccasion(occ)}
            className={`px-5 py-2 rounded-full font-label text-sm font-semibold whitespace-nowrap transition-all ${
              occasion === occ
                ? 'royal-flow text-on-primary shadow-md'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}>
            {occ}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-on-surface font-headline text-lg font-semibold">Styling your outfits...</p>
          <p className="text-on-surface-variant text-sm mt-1">Our AI is curating the perfect looks for you</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-error text-4xl mb-3">error</span>
          <p className="text-on-surface-variant mb-4">{error}</p>
          <button onClick={fetchEnsembles} className="royal-flow text-on-primary px-6 py-2 rounded-full font-label text-sm font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Ensembles */}
      {!loading && !error && (
        <div className="space-y-10">
          {ensembles.map((ensemble, idx) => (
            <section key={idx}
              className="grid grid-cols-1 lg:grid-cols-12 gap-0 bg-surface-container-lowest rounded-3xl overflow-hidden shadow-xl border border-white/20">

              {/* Outfit collage panel */}
              <div className={`lg:col-span-5 ${idx % 2 === 1 ? 'lg:order-last' : ''} relative p-6 md:p-8 flex flex-col justify-center`}
                style={{ background: `linear-gradient(135deg, ${seasonColors.from}15 0%, ${seasonColors.to}15 100%)` }}>

                {/* Style score badge */}
                <div className="absolute top-6 left-6 glass-card px-4 py-2 rounded-full border border-white/40 shadow-sm flex items-center gap-2 z-10">
                  <span className="text-primary font-bold text-lg">{ensemble.style_score}</span>
                  <span className="text-on-surface-variant font-label text-xs font-semibold">Style Score</span>
                </div>

                {/* Outfit items grid */}
                <div className={`mt-10 grid gap-3 ${
                  (ensemble.items?.length || 0) <= 2 ? 'grid-cols-2' :
                  (ensemble.items?.length || 0) === 3 ? 'grid-cols-2' : 'grid-cols-2'
                }`}>
                  {ensemble.items?.map((item, itemIdx) => {
                    const product = item.products?.[0]
                    const image = product?.image_url || product?.image
                    const isMainPiece = itemIdx === 0
                    const icon = CATEGORY_ICONS[item.category] || 'apparel'
                    return (
                      <a key={itemIdx}
                        href={product?.product_url || product?.link || product?.url || '#'}
                        target="_blank" rel="noopener noreferrer"
                        className={`group relative rounded-2xl overflow-hidden border border-white/30 shadow-md bg-white hover:shadow-xl hover:scale-[1.03] transition-all cursor-pointer ${
                          isMainPiece && (ensemble.items?.length || 0) >= 3 ? 'col-span-2 h-52 md:h-64' : 'h-40 md:h-48'
                        }`}>
                        {image ? (
                          <img src={image} alt={item.style_notes}
                            className="w-full h-full object-contain p-2 bg-white" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface-container-low to-surface-container gap-2 p-4">
                            <span className="material-symbols-outlined text-on-surface-variant/30 text-4xl">{icon}</span>
                            <p className="text-xs text-on-surface-variant/60 text-center leading-tight capitalize">
                              {item.style_notes || item.category}
                            </p>
                          </div>
                        )}
                        {/* Bottom label */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent px-3 py-2.5">
                          <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{item.category}</p>
                          <p className="text-xs font-semibold text-white truncate">{item.color}</p>
                        </div>
                        {/* Price tag */}
                        {product?.price && (
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
                            <span className="text-xs font-bold text-primary">
                              {'\u20B9'}{typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price}
                            </span>
                          </div>
                        )}
                      </a>
                    )
                  })}
                </div>

                {/* Body shape tag */}
                <div className="mt-4 flex justify-center">
                  <div className="glass-card px-4 py-1.5 rounded-full border border-white/30 text-center">
                    <p className="text-[11px] text-on-surface-variant font-semibold capitalize">
                      Styled for {(profile?.body_shape || 'your').replace('_', ' ')} • {(profile?.color_season || 'your')} palette
                    </p>
                  </div>
                </div>
              </div>

              {/* Details panel */}
              <div className="lg:col-span-7 p-6 md:p-10 flex flex-col justify-center">
                <div className="mb-6">
                  <span className="text-secondary font-label text-xs tracking-widest uppercase">
                    Ensemble {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-headline text-2xl md:text-3xl font-semibold text-on-surface mt-1">
                    {ensemble.name}
                  </h3>
                  <p className="text-on-surface-variant mt-3 text-base leading-relaxed italic">
                    "{ensemble.description}"
                  </p>
                </div>

                {/* Product items */}
                <div className="space-y-3 mb-6">
                  {ensemble.items?.map((item, itemIdx) => {
                    const product = item.products?.[0]
                    const imgSrc = product?.image_url || product?.image
                    const productUrl = product?.product_url || product?.link || product?.url || '#'
                    return (
                      <a key={itemIdx} href={productUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 rounded-xl border border-outline-variant hover:border-primary transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-surface-container rounded-lg overflow-hidden flex-shrink-0">
                            {imgSrc ? (
                              <img src={imgSrc} alt={product?.title || item.style_notes} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-on-surface-variant/40 text-2xl">
                                  {CATEGORY_ICONS[item.category] || 'apparel'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-on-surface text-sm truncate max-w-[220px]">
                              {product?.title || item.style_notes}
                            </h4>
                            <p className="text-primary font-label text-xs font-semibold mt-0.5">
                              {product?.price
                                ? `\u20B9${typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price}`
                                : item.style_notes}
                            </p>
                            {item.color && (
                              <span className="text-on-surface-variant/60 text-xs capitalize">{item.color}</span>
                            )}
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors flex-shrink-0">
                          {product ? 'shopping_bag' : 'search'}
                        </span>
                      </a>
                    )
                  })}
                </div>

                {/* Total + CTA */}
                <div className="flex items-center justify-between gap-4">
                  {ensemble.total_price > 0 && (
                    <p className="text-on-surface-variant font-label text-sm">
                      Total: <span className="text-on-surface font-semibold">{'\u20B9'}{ensemble.total_price.toLocaleString('en-IN')}</span>
                    </p>
                  )}
                  <button onClick={() => {
                    ensemble.items?.forEach((item) => {
                      const product = item.products?.[0]
                      const url = product?.product_url || product?.link || product?.url
                      if (url) window.open(url, '_blank')
                    })
                  }}
                    className="flex-1 max-w-xs royal-flow text-on-primary py-3.5 rounded-xl font-label font-semibold shadow-lg hover:opacity-90 transition-opacity active:scale-[0.98] flex items-center justify-center gap-2">
                    Shop the Complete Look
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </button>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && ensembles.length === 0 && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-on-surface-variant/30 text-6xl mb-4">style</span>
          <p className="text-on-surface-variant">No ensembles found. Try a different occasion.</p>
        </div>
      )}
    </div>
  )
}
