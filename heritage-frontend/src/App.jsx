import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AssessPage from './pages/AssessPage';
import ModelsPage from './pages/ModelsPage';
import AboutPage from './pages/AboutPage';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

export default function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '12px',
            background: '#1A1614',
            color: '#FFFFFF',
          },
        }}
      />
      <Navbar />
      <main className="min-h-[calc(100vh-72px)] bg-bg pt-28 pb-8 text-text">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
          <Routes>
            <Route path="/" element={<AssessPage />} />
            <Route path="/models" element={<ModelsPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </Router>
  );
}
