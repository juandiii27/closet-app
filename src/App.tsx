import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import { Layout } from './components/Layout';
import { ClosetProvider } from './context/ClosetContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingScreen } from './components/ui/LoadingScreen';

// Lazy Load Pages
const Closet = lazy(() => import('./pages/Closet'));
const Upload = lazy(() => import('./pages/Upload'));
const Outfits = lazy(() => import('./pages/Outfits'));
const Login = lazy(() => import('./pages/Login'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const StoreMap = lazy(() => import('./pages/StoreMap'));
const Shop = lazy(() => import('./pages/Shop'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));

// Basic wrapper to protect routes
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, profile } = useAuth();
  if (loading) return <LoadingScreen text="Verifying session..." />;
  if (!user) return <Navigate to="/login" replace />;

  // Check if onboarding is needed (skip if we are already ON the onboarding page)
  const isOnboarding = window.location.pathname === '/onboarding';
  if (!profile?.onboardingCompleted && !isOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <ClosetProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route element={<Layout />}>
                <Route path="/" element={<ProtectedRoute><Closet /></ProtectedRoute>} />
                <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
                <Route path="/outfits" element={<ProtectedRoute><Outfits /></ProtectedRoute>} />
                <Route path="/map" element={<ProtectedRoute><StoreMap /></ProtectedRoute>} />
                <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
              </Route>
              {/* Public Routes */}
              <Route path="/profile/:userId" element={<PublicProfile />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ClosetProvider>
    </AuthProvider>
  );
}

export default App;
