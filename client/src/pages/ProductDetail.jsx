import { Link } from 'react-router-dom'

const images = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDKCIaKTd6desTFxeFLiysHwsLXI--XNjZ3CX0UzHUEX047j4sNseBPqmtfqxy4e6T_OpbIyPUkpvB4w9bX02AKGKkbS4lqvCePcmCShObrTpJFbh5XIMdlY7iESuKMF4ah_SBuK_q44wftpB8-79C0kh6QKURjcrYX-em3uQz5lVRQ_6bQhCFP8GaKgcmwmYXloTOWrfNzVS4eh8k30hmoTFJPQc88jEIFZLq4rZ187gLKjCQuqttD76-j1HjAx4SfNhTdamsSo_Iw',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuALVbmiO-6vxbPx71TDyOHWzErDCCk8f6yyIpViQ0rY98U0V09qLM2rekZgSiV9VNoddRWnT2Pekii9o3vHZ_b2MifpAgwUf7X9KN-hEf_52MXE-jG3NTHX4ktl9xYM5X_h1vQxI_MdegRs56g3ICIpf6mkhNo9f4w5QvbGdb9aV7uOgUL2nvMi5BmDLp_DB_8rdSQC3JEluOTRuKaFLhaLAsLMr_1gXTHXqd6eAGe1Khmnc0vggqDKNjryIzrPIp8FSXRMvCh78gxk',
]

const reasons = [
  { icon: 'face', title: 'Visual Balance', desc: 'Deep V-neckline elongates your neck, perfectly complementing your oval face shape.' },
  { icon: 'palette', title: 'Color Harmony', desc: 'Mustard yellow provides a striking contrast against your warm undertones for a radiant glow.' },
  { icon: 'accessibility_new', title: 'Silhouette Match', desc: 'The structured A-line cut accentuates your hourglass figure while maintaining an airy feel.' },
]

const completeLook = [
  { category: 'BOTTOMS', title: 'Linen Wide Trousers', price: 4200, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzEaAgH7PpkobJ8gz-pkXIBn2CIfR_012napjSaFmQu0rQEXPiY6I-fTfSwH_0k8BYzfrjhhAGRjtB4qhb1t-U21b8c2BfWT33d16jIfAkxb3cm8vlVgRKm8lNZV1BqDFGbzDAbURE6tNarW6vyZoSEeu9S5XCly0_JFnql9yBrlPWPaAPaaonsgey1_pp_W3lFGyRVUjkC0agGm7qXeLAU3mrC6LgTRWXIfVFKxoCifnEq7aUcGB_qZhApjBSJY-vmZIJSMyfMaJk' },
  { category: 'SHOES', title: 'Nude Pointed Heels', price: 8990, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCh-FJ9eXRD_NnpWpkpN_X48mfJvwo8nzLKmh5z-e0CCpUcgAN_FyRqew7L3Ct7w8Wyqw3kMpNoHJ7SgVoxeuItH9kMUbAvvouCNstibxXJIVbpXTPZHhRYeraNCwxBBhZjamiTB9EiYsLQ9NA7F0exTp63Hg76h6qPGpNYa-uxOeqtE3lKfChjKCnug_xdG3wpgNEaCUttJuIsCGFWTg1Lci_b4IPIkd8gZk0667zCkAYByaGOWsYsZbJFuBE1GDMLGfOfDu_qPlHw' },
  { category: 'ACCESSORIES', title: 'Gold Pearl Pendant', price: 2500, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTCNaAIqvCtNJP28QKwHdy9vFv_OkmZPnVoW2ILnbKv2fmFZO48R70rJS2vIT5DOvvA-T7XY9Wm5WU4h7XbyoxbCW7wP98KIGvYMPF94ksqD28e23PV-QQ8yy-PIZp7lWtgBLxiwcdlopvK6S7Q4TNYkg4a5dElDPPzBeiZDr2CiKsYpRWLYn12Yns61h1bbbbbMgduRHycIPs1ouv8m_zz6mA-jbwj6KirHl02-LagKCyJOrBl19S_84vqMBiq0_ju6ANLtO1oV2q' },
]

export default function ProductDetail() {
  return (
    <main className="pt-20 pb-32">
      {/* Image carousel */}
      <section className="relative w-full overflow-hidden aspect-[3/4] md:aspect-video mb-6">
        <div className="flex h-full snap-x snap-mandatory overflow-x-auto hide-scrollbar">
          {images.map((src, i) => (
            <div key={i} className="flex-shrink-0 w-full h-full snap-center">
              <img src={src} alt={`Product view ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-primary' : 'bg-surface-container-highest'}`} />
          ))}
        </div>
        <button className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-surface/90 backdrop-blur-md flex items-center justify-center shadow-lg text-primary hover:scale-105 transition-transform">
          <span className="material-symbols-outlined">favorite</span>
        </button>
      </section>

      {/* Product identity */}
      <section className="px-5 md:px-10 mb-6">
        <div className="flex justify-between items-start mb-2">
          <p className="font-label text-sm font-semibold text-secondary uppercase tracking-widest">Heritage Collection</p>
          <div className="px-3 py-1 bg-primary-container text-on-primary-container rounded-full text-[10px] font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            AI PICK
          </div>
        </div>
        <h1 className="font-headline text-3xl font-semibold mb-1">Amber Silk V-Neck A-Line</h1>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="font-headline text-2xl font-semibold text-primary">₹14,999</span>
          <span className="text-outline line-through font-label text-sm">₹18,500</span>
        </div>
      </section>

      {/* Why this works */}
      <section className="px-5 md:px-10 mb-12">
        <div className="bg-primary-container text-on-primary-container rounded-xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined text-[80px]">flare</span>
          </div>
          <h3 className="font-headline text-2xl font-semibold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            Why This Works For You
          </h3>
          <div className="space-y-4">
            {reasons.map((r) => (
              <div key={r.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">{r.icon}</span>
                </div>
                <div>
                  <p className="font-label text-sm font-semibold">{r.title}</p>
                  <p className="text-on-primary-container/80 text-sm">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop button */}
      <section className="px-5 md:px-10 mb-12">
        <button className="w-full royal-flow py-5 rounded-xl shadow-[0_10px_20px_rgba(108,60,225,0.3)] text-white font-bold text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-transform">
          <span className="material-symbols-outlined">shopping_bag</span>
          Shop Now on Ajio Luxury
        </button>
      </section>

      {/* Complete the look */}
      <section className="mb-12">
        <div className="px-5 md:px-10 flex justify-between items-center mb-2">
          <h2 className="font-headline text-2xl font-semibold">Complete the Look</h2>
          <button className="text-primary font-label text-sm font-semibold">View Guide</button>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar px-5 md:px-10 pb-4">
          {completeLook.map((item) => (
            <div key={item.title} className="flex-shrink-0 w-[180px] bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden">
              <div className="h-[200px] bg-surface-container">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <p className="font-label text-xs text-secondary font-semibold">{item.category}</p>
                <p className="text-sm font-semibold truncate">{item.title}</p>
                <p className="text-primary text-sm">₹{item.price.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
