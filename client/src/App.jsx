import { Routes, Route } from 'react-router-dom'
import Layout from './components/common/Layout'
import Home from './pages/Home'
import Scan from './pages/Scan'
import Profile from './pages/Profile'
import Preferences from './pages/Preferences'
import Recommendations from './pages/Recommendations'
import ProductDetail from './pages/ProductDetail'
import Wardrobe from './pages/Wardrobe'

export default function App() {
  return (
    <Routes>
      {/* Scan is full-screen, no layout */}
      <Route path="/scan" element={<Scan />} />

      {/* All other pages share the nav layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/wardrobe" element={<Wardrobe />} />
      </Route>
    </Routes>
  )
}
