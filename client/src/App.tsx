import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthLayout } from '@/shared/layouts/AuthLayout'
import { AppLayout } from '@/shared/layouts/AppLayout'
import { Home } from '@/pages/Home'
import { SignIn } from '@/pages/SignIn'
import { SignUp } from '@/pages/SignUp'

export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<SignIn />} />
        <Route path="/register" element={<SignUp />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
      </Route>
    </Routes>
  </BrowserRouter>
)
