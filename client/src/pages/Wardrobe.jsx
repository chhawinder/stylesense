import { useState } from 'react'

const tabs = ['Saved Items', 'Past Outfits', 'Style History']

const savedItems = [
  { id: 1, collection: 'Heritage Collection', title: 'Wool Tailored Blazer', price: 12499, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7DeWc6mktUeFWp8q4NLVj7nd__iD7OZ_tLUd6WfJk55jGjKivIPJUmCABxxa7VfXNfiue-jIrJfd-C5wUI_QU2vVrKlvtjIGUmw4E35xa4S15bZ2NDuArt8KNznVEPwt09EnxjrJKYLzA3dGo2MRxsEs_K8cmeqSVgZqqSBt1EDqTVDbqx2H9SizPyiQJuSadAIfiN1FViHhqVPf0DkC3xWNcqS-mhg7KRc3cOzHZPsvBARvN68nNvey6zmGnbZOMqty69BIF_w3R' },
  { id: 2, collection: 'Ethnic Modern', title: 'Floral Silk Blouse', price: 5200, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMZGu_wrGf-jm2R4U8TQtzcnM7sF-mHgU5WgLTlgkih2fyJ8xU5G7x7Rvd2NJzP4p8_IrAeWxrmWv5Vx9mPz0Ej0NQeu_9wdv-gWhu-G1IBUJQYTrYG85bKM_FGs09x0S-2N7QpNjXTaH9DXt8DglAX6rDcBi1crDg2fqQaWdOyoLgVOnDE6LMfN7V6njdmuD2GojLgGTyEPJbyAOp_D9_2Fj4plBaSrZszqDRIsUu3hGRKFGUkwwL8Ig77cKT6WqoedFN-SiX8Vh8' },
  { id: 3, collection: 'Lounge Premium', title: 'Ivory Wide-Leg Trousers', price: 7899, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWNspcaTA6WrcR9Eq823tUQq_gLl6lOWEjXbgolVhyEH2xXuj-GBZoouapMuepBByj9zTLFENOeqNIrMHYBZ7adAw7nr0KTjEn7kDghcT4HkCvwLyc67cvsX3Su5JufYd9AcHorM-J-4nzkM8NQlul7HV13b9CXpnqdY2dEH3yUwq35RnaYntnUFhuJBaOTwf6SZeZi4bOCUk2UU4yQt8oHteKXwr7ZCWD2oKKKKv6X4_n26HF11xWrItE66ymuU5AHGT-xIsuWCUm' },
  { id: 4, collection: 'Accessories', title: 'Geometric Gold Pendant', price: 15000, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkitkn7mZWMvZxjxmKTNy4R4rs-Xd-kYEJ0r8sqzvl2lIerDKqS_g2JW9KwvIq7OHId7LeVev52KNfol9Y9FJZ95cvKxdDs4pfguyOKAWayagWG2C0dvkJPnpp6Vj7ppy9P6Q3hbTI61IXeRl8gg9lw9J5SEweVb-QsDKUNQ0c7IrOoe6l_yjvUTHqX0djofUcdv3PFa6QVoyJ-bcbMr8GUFJyuG2oBLQJX1vaaHTVEurX_L6Yfr3g45jaN15wPXg5uIsV1JItkvUG' },
]

const pastOutfits = [
  { tag: 'Professional', title: 'Corporate Gala', date: 'Oct 12', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKPY5knPGxYibLUFaTb5j3qWsYy4p8eNzDLoYo4f0QJ8BlkFSkvuS6wZHIwvfdHtaB8esctGNFElzMwhsqTJYUNRijyy2nkhqlblnMQTuKwY8pXiCHm-QFAvOGidQGq-XPgC8xWy3hKxPlugjW5DXDwg8B8yf_hO9VLBFIVY-iy5ehuDJvDOwoV3gEg2NmXfPWipKE7v5Fwh_eeS0cpaenvdYqluafZ0bX6fzmzsAAOYr4UDuX6tsSgo9waK8A-cb_F5HQnB8ZKY5T' },
  { tag: 'Celebration', title: 'Diwali Soirée', date: 'Oct 31', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzEznaXtrcYocbOiCpA5VnXESjVmsmKJtnsXF8nKLaUVvtcMG_YS_49MFUaXElCI9OiBnqRbdUyvREb_QLj6-GjF92CJD5JT-IE85dkRUDYvmgw87DbyiAeOPTvDTqn7rBjzB7t3PpjHfpX4mDgmMPRFuHv6L7G3IwU-ZSP9rTF3wzU_Lk7lPNQOe_O_BhQlRfQfxLtcGFcT8eRJd7fgS6AjLQmbs4KJTQm_BOymM0Sg2Gkxaw7KskmRLIOMMxe1f-rB7eLwFqJ3dr' },
  { tag: 'Casual Luxe', title: 'Sunday Brunch', date: 'Nov 05', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzcLQmY_6Mea71hjw15KwqapUW1TP2l3zhC3x_c9YX8UfNpu8NjZcQP5_Pgxtr5ov2iMlHe5UBDDEziZYlziswr6W8WEAJPmxvYToqU5Cvjc_DTenwKvpCaNhzyB3URx-Wtqnr_zxZj2WExzlpdQsmWLn_sPtAMZUKcuCJ2kkQd0o6hCRt3ra0GiDZTpm73UElYoHchaDvz-vEAS2p7dimoHMrXsvdv6gUQXieJs3Z1euBA3u33Xc7yNVvrC4LnTh0qqp7OzVycFZd' },
]

export default function Wardrobe() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <main className="mt-20 px-5 md:px-10 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <section className="py-6">
        <h2 className="font-display text-5xl font-bold text-on-surface mb-2">My Wardrobe</h2>
        <p className="font-body text-lg text-on-surface-variant max-w-2xl">
          Manage your curated collections, review your style evolution, and organize your premium fashion identity.
        </p>
      </section>

      {/* Tabs */}
      <nav className="flex gap-4 overflow-x-auto pb-4 mb-6 hide-scrollbar">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-6 py-3 rounded-full font-label text-sm font-semibold transition-all ${
              activeTab === i
                ? 'bg-primary text-on-primary shadow-lg'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Saved Items Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
        {savedItems.map((item) => (
          <div
            key={item.id}
            className="group relative flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:scale-[1.02]"
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
              <button className="absolute top-2 right-2 p-2 glass-card rounded-full text-error hover:scale-110 transition-transform">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>delete</span>
              </button>
            </div>
            <div className="p-4">
              <p className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{item.collection}</p>
              <h3 className="font-headline text-lg font-semibold text-on-surface mt-1">{item.title}</h3>
              <div className="flex justify-between items-center mt-3">
                <span className="font-headline text-base font-semibold text-primary">₹{item.price.toLocaleString()}</span>
                <button className="text-primary hover:underline font-label text-sm font-semibold">Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Past Outfits */}
      <section className="border-t border-outline-variant/30 pt-6">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="font-headline text-3xl font-semibold text-on-surface">Recent Ensembles</h3>
            <p className="text-on-surface-variant">Review your most successful looks by occasion.</p>
          </div>
          <button className="text-primary font-label text-sm font-semibold">View All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
          {pastOutfits.map((outfit) => (
            <div key={outfit.title} className="flex-none w-[280px] bg-surface-container-low rounded-2xl overflow-hidden shadow-sm">
              <div className="h-[340px] relative">
                <img src={outfit.img} alt={outfit.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-4 right-4 glass-card p-3 rounded-xl">
                  <span className="font-label text-xs font-semibold bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full uppercase">
                    {outfit.tag}
                  </span>
                  <p className="font-headline text-sm font-semibold mt-1">
                    {outfit.title} &bull; {outfit.date}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
