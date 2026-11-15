import { useEffect, useRef, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import AnalyzerPage from './pages/AnalyzerPage.jsx';

export default function App() {
  const [page, setPage] = useState('home');
  // Section id to scroll to after switching back to the home page.
  const pendingSection = useRef(null);

  useEffect(() => {
    const id = pendingSection.current;
    if (id) {
      pendingSection.current = null;
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo(0, 0);
    }
  }, [page]);

  function goToSection(id) {
    if (page === 'home') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    pendingSection.current = id;
    setPage('home');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Navbar page={page} onNavigate={setPage} onSection={goToSection} />
      <main id="main" className="flex-1">
        {page === 'home' ? <HomePage onStart={() => setPage('analyze')} /> : <AnalyzerPage />}
      </main>
      <Footer onNavigate={setPage} />
    </div>
  );
}
