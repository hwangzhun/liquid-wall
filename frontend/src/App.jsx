import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import PostForm from './components/PostForm';
import LoginModal from './components/LoginModal';
import HomePage from './pages/HomePage';

// Ambient blobs background
function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      <div className="blob blob-1 rounded-full mix-blend-multiply dark:mix-blend-normal" />
      <div className="blob blob-2 rounded-full mix-blend-multiply dark:mix-blend-normal" />
      <div className="blob blob-3 rounded-full mix-blend-multiply dark:mix-blend-normal" />
    </div>
  );
}

function AppInner() {
  const { isLoggedIn } = useAuth();

  // Dark mode state – persisted in localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('liquid-wall-dark');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('liquid-wall-dark', String(darkMode));
  }, [darkMode]);

  // Shared search query lifted to App level so Navbar ↔ HomePage can share it
  const [searchQuery, setSearchQuery] = useState('');

  // Post form visibility
  const [postFormOpen, setPostFormOpen] = useState(false);

  // Login modal visibility
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // When a new post is submitted, HomePage will handle the refresh
  const [newPost, setNewPost] = useState(null);

  function handleToggleDark() {
    setDarkMode(d => !d);
  }

  return (
    <div className="min-h-screen font-display antialiased text-slate-900 dark:text-slate-100 bg-light-pastel relative overflow-x-hidden selection:bg-[#197fe6]/30">
      <BackgroundBlobs />

      <Navbar
        onSearch={setSearchQuery}
        onOpenPost={() => {
          if (isLoggedIn) {
            setPostFormOpen(true);
          } else {
            setLoginModalOpen(true);
          }
        }}
        onOpenLogin={() => setLoginModalOpen(true)}
        darkMode={darkMode}
        onToggleDark={handleToggleDark}
      />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              searchQuery={searchQuery}
              postFormOpen={postFormOpen}
              setPostFormOpen={setPostFormOpen}
              newPost={newPost}
              onRequireLogin={() => setLoginModalOpen(true)}
            />
          }
        />
      </Routes>

      {/* Post Form Modal – only when logged in */}
      {isLoggedIn && postFormOpen && (
        <PostForm
          onClose={() => setPostFormOpen(false)}
          onSubmit={(post) => {
            setNewPost(post);
            setPostFormOpen(false);
          }}
        />
      )}

      {/* Login Modal */}
      {loginModalOpen && (
        <LoginModal onClose={() => setLoginModalOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  );
}
