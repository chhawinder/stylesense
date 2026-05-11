import { Link } from 'react-router-dom'

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
              className="royal-flow text-on-primary font-headline text-2xl font-semibold px-12 py-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              Get Started
            </Link>
            <button className="flex items-center gap-2 px-6 py-2 border border-outline-variant rounded-full bg-white text-on-surface-variant hover:bg-surface-container-low transition-colors">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5S5tYV7wSzEP-vNPsET-jTSYCCajEcDK-P4nBqnEk9cKiU7C7vziTqx4H4RQpSBSeocqpIGrOsDOmlcz2zF5baJcn93F5TQty8czapQCu2a-fi2rkpX8NZhVusrGO-FFXYJ3AsAOj6ECfy6Hd-0OsjS_UkKxVxxJG-uxnyh4NCiHNEGXqrrKvqkWDgaXcoMpyS92HqLx9mRk8_5oKzSx7OCDXe5N7IeFmhihC9wKm9rXFQw4fI33Oflk2I9PfCB3lfVUfi5nEt1pn"
                alt="Google"
                className="w-5 h-5"
              />
              <span className="font-label text-sm font-semibold">Sign in with Google</span>
            </button>
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
          className="royal-flow w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center text-on-primary hover:scale-110 active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-3xl">add_a_photo</span>
        </Link>
      </div>
    </main>
  )
}
