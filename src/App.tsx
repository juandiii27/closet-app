import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ReactNode, useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ClosetProvider } from './context/ClosetContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoadingScreen } from './components/ui/LoadingScreen';

// Lazy Load Pages
const Closet = lazy(() => import('./pages/Closet'));
const Upload = lazy(() => import('./pages/Upload'));
const Outfits = lazy(() => import('./pages/Outfits'));
const Login = lazy(() => import('./pages/Login'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const Shop = lazy(() => import('./pages/Shop'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));

// Basic wrapper to protect routes
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, profile } = useAuth();

  // Note: loading is handled at the top level now for initial load, 
  // but we keep this check for route transitions if needed
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  // Check if onboarding is needed (skip if we are already ON the onboarding page)
  const isOnboarding = window.location.pathname === '/onboarding';
  if (!profile?.onboardingCompleted && !isOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 7000); // 7 seconds splash screen

    return () => clearTimeout(timer);
  }, []);

  if (showSplash || loading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route element={<Layout />}>
            <Route path="/" element={<ProtectedRoute><Closet /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/outfits" element={<ProtectedRoute><Outfits /></ProtectedRoute>} />
            <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
          </Route>
          {/* Public Routes */}
          <Route path="/profile/:userId" element={<PublicProfile />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ClosetProvider>
          <AppContent />
        </ClosetProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
