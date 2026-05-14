import { Routes, Route } from 'react-router-dom'
import Layout from './components/common/Layout'
import ProtectedRoute from './components/common/ProtectedRoute'
import Home from './pages/Home'
import Scan from './pages/Scan'
import Profile from './pages/Profile'
import Recommendations from './pages/Recommendations'
import ProductDetail from './pages/ProductDetail'
import Wardrobe from './pages/Wardrobe'
import TopEnsembles from './pages/TopEnsembles'

export default function App() {
  return (
    <Routes>
      {/* Scan is full-screen, no layout, requires auth */}
      <Route path="/scan" element={<ProtectedRoute><Scan /></ProtectedRoute>} />

      {/* All other pages share the nav layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/wardrobe" element={<ProtectedRoute><Wardrobe /></ProtectedRoute>} />
        <Route path="/ensembles" element={<ProtectedRoute><TopEnsembles /></ProtectedRoute>} />
      </Route>
    </Routes>
  )
}
