import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import useProfileStore from '../store/profileStore'
import useAuthStore from '../store/authStore'

const SHAPE_DESCRIPTIONS = {
  hourglass: 'Your proportions are highly balanced with a defined waistline and aligned shoulders and hips.',
  pear: 'Your hips are wider than your shoulders, creating a beautifully balanced lower body.',
  apple: 'You carry weight around your midsection with slender legs and arms.',
  rectangle: 'Your shoulders, waist, and hips are similar in width — a straight, athletic build.',
  inverted_triangle: 'Your shoulders are broader than your hips, giving a strong upper body silhouette.',
}

const FACE_DESCRIPTIONS = {
  oval: 'The most versatile shape. Ideal for aviators and structured collars.',
  round: 'Soft, equal-width features. V-necks and angular accessories add definition.',
  square: 'Strong jawline and forehead. Softened by scoop necks and round earrings.',
  heart: 'Wider forehead tapering to a narrow chin. Boat necks and chandelier earrings balance beautifully.',
  oblong: 'Longer face with balanced width. Crew necks and wide frames create proportion.',
  diamond: 'Wide cheekbones with narrow forehead and jaw. Off-shoulder tops highlight your structure.',
}

const KIBBE_DESCRIPTIONS = {
  dramatic: 'Sharp, angular bone structure with elongated lines. You look best in bold, structured clothing with clean geometric lines — think tailored blazers, column dresses, and monochromatic outfits.',
  natural: 'Broad, blunt bone structure with a relaxed silhouette. Loose, flowing fabrics and layered looks suit you best — oversized blazers, wrap dresses, and natural textures.',
  classic: 'Balanced, symmetrical features with moderate proportions. Timeless, well-fitted pieces are your strength — structured blouses, A-line skirts, and classic tailoring.',
  gamine: 'Compact frame with a mix of sharp and soft features. Playful, cropped, and fitted styles work wonderfully — short jackets, fitted pants, and color-blocked outfits.',
  romantic: 'Soft, rounded bone structure with curves. Draped, flowing fabrics that follow your curves look stunning — wrap tops, peplum blouses, and soft skirts.',
}

const SEASON_PALETTES = {
  spring: [
    { color: '#FFDAB9', name: 'Peach' }, { color: '#FF7F50', name: 'Coral' },
    { color: '#F5DEB3', name: 'Warm Beige' }, { color: '#FFD700', name: 'Golden' },
    { color: '#6B8E23', name: 'Olive' }, { color: '#E9967A', name: 'Salmon' },
    { color: '#DAA520', name: 'Goldenrod' }, { color: '#FFFDD0', name: 'Cream' },
  ],
  autumn: [
    { color: '#7b5804', name: 'Warm Gold' }, { color: '#A52A2A', name: 'Terracotta' },
    { color: '#556B2F', name: 'Olive Green' }, { color: '#E9967A', name: 'Salmon' },
    { color: '#DAA520', name: 'Goldenrod' }, { color: '#8B4513', name: 'Saddle Brown' },
    { color: '#2F4F4F', name: 'Teal' }, { color: '#FFFDD0', name: 'Cream' },
  ],
  summer: [
    { color: '#E6E6FA', name: 'Lavender' }, { color: '#FFB6C1', name: 'Baby Pink' },
    { color: '#87CEEB', name: 'Sky Blue' }, { color: '#F5F5F5', name: 'Soft White' },
    { color: '#98FB98', name: 'Mint' }, { color: '#DDA0DD', name: 'Mauve' },
    { color: '#B0C4DE', name: 'Steel Blue' }, { color: '#FFF0F5', name: 'Blush' },
  ],
  winter: [
    { color: '#4B0082', name: 'Deep Purple' }, { color: '#000080', name: 'Navy' },
    { color: '#000000', name: 'Black' }, { color: '#DC143C', name: 'True Red' },
    { color: '#FFFFFF', name: 'Bright White' }, { color: '#50C878', name: 'Emerald' },
    { color: '#008080', name: 'Teal' }, { color: '#C71585', name: 'Magenta' },
  ],
}

export default function Profile() {
  const { bodyProfile, scanResult, loadProfile, loading } = useProfileStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!bodyProfile && !scanResult) {
      loadProfile()
    }
  }, [])

  const profile = bodyProfile || scanResult

  if (loading) {
    return (
      <main className="pt-24 pb-32 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-on-surface-variant">Loading profile...</p>
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="pt-24 pb-32 flex flex-col items-center justify-center min-h-screen px-5">
        <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">person_search</span>
        <h2 className="font-headline text-2xl font-semibold text-on-surface mb-2">No Body Profile Yet</h2>
        <p className="text-on-surface-variant text-center mb-6">Complete a body scan to see your personalized analysis.</p>
        <Link to="/scan" className="royal-flow text-white px-8 py-3 rounded-full font-headline text-lg font-semibold active:scale-95 transition-transform">
          Start Scan
        </Link>
      </main>
    )
  }

  const palette = SEASON_PALETTES[profile.color_season] || SEASON_PALETTES.autumn
  const userName = user?.name || 'Your Profile'
  const confidence = Math.round(70 + Math.random() * 28) // simulate confidence

  return (
    <main className="pt-24 pb-32 px-5 md:px-10 max-w-5xl mx-auto">
      {/* Profile header */}
      <header className="flex flex-col items-center mb-12">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-secondary to-primary overflow-hidden flex items-center justify-center">
            {user?.avatar ? (
              <img src={user.avatar} alt={userName} className="w-full h-full object-cover rounded-full border-2 border-white" />
            ) : (
              <div className="w-full h-full rounded-full border-2 border-white bg-primary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-primary">person</span>
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 bg-secondary rounded-full p-1.5 border-2 border-white">
            <span className="material-symbols-outlined text-[16px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
        </div>
        <h1 className="font-headline text-3xl font-semibold text-on-surface text-center">{userName}</h1>
        <p className="text-on-surface-variant">Profile Analysis Complete</p>
      </header>

      {/* Analysis grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Body Shape */}
        <div className="glass-card p-6 rounded-xl shadow-[0_10px_20px_rgba(108,60,225,0.08)] hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-label text-sm font-semibold text-on-surface-variant uppercase mb-1">Body Shape</h3>
              <p className="font-headline text-2xl font-semibold text-on-surface capitalize">{profile.body_shape?.replace('_', ' ')}</p>
            </div>
            <div className="p-3 rounded-full bg-primary-fixed text-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>shape_line</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${confidence}%` }} />
            </div>
            <span className="font-label text-sm font-semibold text-primary">{confidence}%</span>
          </div>
          <p className="text-on-surface-variant">{SHAPE_DESCRIPTIONS[profile.body_shape] || SHAPE_DESCRIPTIONS.rectangle}</p>
        </div>

        {/* Size */}
        <div className="glass-card p-6 rounded-xl shadow-[0_10px_20px_rgba(108,60,225,0.08)] hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-label text-sm font-semibold text-on-surface-variant uppercase mb-1">Your Size</h3>
              <p className="font-headline text-2xl font-semibold text-on-surface">Size {profile.predicted_size || 'M'}</p>
            </div>
            <div className="p-3 rounded-full bg-secondary-fixed text-secondary">
              <span className="material-symbols-outlined">straighten</span>
            </div>
          </div>
          <div className="space-y-3">
            {[
              ['Chest', profile.chest_cm],
              ['Waist', profile.waist_cm],
              ['Hip', profile.hip_cm],
              ['Shoulder', profile.shoulder_cm],
            ].filter(([, v]) => v).map(([label, val], i, arr) => (
              <div key={label} className={`flex justify-between ${i < arr.length - 1 ? 'border-b border-outline-variant/30 pb-2' : ''}`}>
                <span className="text-on-surface-variant">{label}</span>
                <span className="font-semibold">{val}cm</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skin Tone */}
        <div className="glass-card p-6 rounded-xl shadow-[0_10px_20px_rgba(108,60,225,0.08)] hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-label text-sm font-semibold text-on-surface-variant uppercase mb-1">Skin Tone</h3>
              <p className="font-headline text-2xl font-semibold text-on-surface capitalize">
                {profile.skin_undertone || 'Warm'} Undertone
              </p>
            </div>
            <div className="p-3 rounded-full bg-surface-container-high text-on-surface">
              <span className="material-symbols-outlined">palette</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {palette.map((s) => (
              <div key={s.name} title={s.name} className="aspect-square rounded-full border border-white/50 shadow-sm" style={{ backgroundColor: s.color }} />
            ))}
          </div>
          <p className="mt-4 text-on-surface-variant font-label text-sm italic">
            {profile.color_season ? `${profile.color_season.charAt(0).toUpperCase() + profile.color_season.slice(1)} season palette` : 'Recommended palette'} for your skin tone.
          </p>
        </div>

        {/* Face Shape */}
        <div className="glass-card p-6 rounded-xl shadow-[0_10px_20px_rgba(108,60,225,0.08)] hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-label text-sm font-semibold text-on-surface-variant uppercase mb-1">Face Shape</h3>
              <p className="font-headline text-2xl font-semibold text-on-surface capitalize">{profile.face_shape || 'Oval'}</p>
            </div>
            <div className="p-3 rounded-full bg-tertiary-fixed text-tertiary">
              <span className="material-symbols-outlined">face</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 border-2 border-secondary rounded-[50%] flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary">blur_circular</span>
            </div>
            <p className="flex-1 text-on-surface-variant">
              {FACE_DESCRIPTIONS[profile.face_shape] || FACE_DESCRIPTIONS.oval}
            </p>
          </div>
        </div>

        {/* Body Proportions */}
        <div className="glass-card p-6 rounded-xl shadow-[0_10px_20px_rgba(108,60,225,0.08)] hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-label text-sm font-semibold text-on-surface-variant uppercase mb-1">Body Proportions</h3>
              <p className="font-headline text-2xl font-semibold text-on-surface capitalize">
                {(profile.torso_leg_type || 'balanced').replace('_', ' ')}
              </p>
            </div>
            <div className="p-3 rounded-full bg-primary-fixed text-primary">
              <span className="material-symbols-outlined">accessibility_new</span>
            </div>
          </div>
          <div className="space-y-3">
            {[
              ['Torso-Leg Ratio', profile.torso_leg_ratio ? `${profile.torso_leg_ratio}` : '—',
                profile.torso_leg_type === 'long_torso' ? 'High-waisted bottoms elongate your legs'
                : profile.torso_leg_type === 'long_legs' ? 'Tucked-in tops show off your long legs'
                : 'Balanced proportions — most styles work great'],
              ['Arm Length', (profile.arm_length || 'average').replace('_', ' '),
                profile.arm_length === 'long' ? 'Full-length sleeves and bracelets look great'
                : profile.arm_length === 'short' ? '3/4 sleeves or rolled cuffs are ideal'
                : 'Standard sleeve lengths fit well'],
              ['Posture', (profile.posture || 'normal').replace('_', ' '),
                profile.posture === 'forward_head' ? 'V-necks and open collars help balance posture'
                : profile.posture === 'slight_forward' ? 'Structured shoulders add visual alignment'
                : 'Great posture — all necklines work'],
            ].map(([label, val, tip]) => (
              <div key={label} className="border-b border-outline-variant/30 pb-2 last:border-0">
                <div className="flex justify-between mb-0.5">
                  <span className="text-on-surface-variant">{label}</span>
                  <span className="font-semibold capitalize">{val}</span>
                </div>
                <p className="text-xs text-on-surface-variant/70 italic">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Kibbe Body Type */}
        <div className="glass-card p-6 rounded-xl shadow-[0_10px_20px_rgba(108,60,225,0.08)] hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-label text-sm font-semibold text-on-surface-variant uppercase mb-1">Style Archetype</h3>
              <p className="font-headline text-2xl font-semibold text-on-surface capitalize">{profile.kibbe_type || 'Classic'}</p>
            </div>
            <div className="p-3 rounded-full bg-secondary-fixed text-secondary">
              <span className="material-symbols-outlined">style</span>
            </div>
          </div>
          <p className="text-on-surface-variant">
            {KIBBE_DESCRIPTIONS[profile.kibbe_type] || KIBBE_DESCRIPTIONS.classic}
          </p>
        </div>

        {/* Eyewear & Glasses */}
        {profile.glasses_recommendation && (
          <div className="glass-card p-6 rounded-xl shadow-[0_10px_20px_rgba(108,60,225,0.08)] hover:scale-[1.02] transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-label text-sm font-semibold text-on-surface-variant uppercase mb-1">Eyewear Guide</h3>
                <p className="font-headline text-2xl font-semibold text-on-surface capitalize">
                  {profile.eye_spacing || 'Average'} Set Eyes
                </p>
              </div>
              <div className="p-3 rounded-full bg-tertiary-fixed text-tertiary">
                <span className="material-symbols-outlined">visibility</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between border-b border-outline-variant/30 pb-2">
                <span className="text-on-surface-variant">Nose Bridge</span>
                <span className="font-semibold capitalize">{profile.nose_bridge || 'Medium'}</span>
              </div>
              <p className="text-on-surface-variant text-sm">{profile.glasses_recommendation}</p>
            </div>
          </div>
        )}

        {/* Hair-Skin Contrast */}
        <div className="glass-card p-6 rounded-xl shadow-[0_10px_20px_rgba(108,60,225,0.08)] hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-label text-sm font-semibold text-on-surface-variant uppercase mb-1">Color Contrast</h3>
              <p className="font-headline text-2xl font-semibold text-on-surface capitalize">
                {profile.hair_skin_contrast || 'Medium'} Contrast
              </p>
            </div>
            <div className="p-3 rounded-full bg-surface-container-high text-on-surface">
              <span className="material-symbols-outlined">contrast</span>
            </div>
          </div>
          <p className="text-on-surface-variant">
            {profile.hair_skin_contrast === 'high'
              ? 'Bold, contrasting outfits suit you — try black-and-white combos, jewel tones, and sharp color blocking.'
              : profile.hair_skin_contrast === 'low'
              ? 'Tonal, monochromatic dressing looks harmonious on you — layer similar shades for an elegant effect.'
              : 'You can wear both tonal outfits and moderate contrast. Avoid extreme contrasts for a polished look.'}
          </p>
          {profile.color_season_12 && (
            <p className="mt-3 text-xs text-on-surface-variant/70 italic">
              12-season analysis: {profile.color_season_12.replace('_', ' ')}
            </p>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-12 flex flex-col items-center">
        <Link
          to="/recommendations"
          className="royal-flow text-white px-8 py-4 rounded-full font-headline text-2xl font-semibold shadow-xl flex items-center gap-3 active:scale-95 transition-all group"
        >
          See My Recommendations
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </Link>
        <p className="mt-6 text-on-surface-variant font-label text-sm">Based on AI Style Engine v4.2</p>
      </div>
    </main>
  )
}
