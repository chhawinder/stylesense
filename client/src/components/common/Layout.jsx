import { Outlet } from 'react-router-dom'
import TopAppBar from './TopAppBar'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <>
      <TopAppBar />
      <Outlet />
      <BottomNav />
    </>
  )
}
