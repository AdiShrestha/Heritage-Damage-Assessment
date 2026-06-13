import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AssessPage from './pages/AssessPage';
import ComparePage from './pages/ComparePage';
import BatchPage from './pages/BatchPage';
import ModelsPage from './pages/ModelsPage';
import AboutPage from './pages/AboutPage';
import UncertaintyPage from './pages/UncertaintyPage';
import DashboardPage from './pages/DashboardPage';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import HeritageScatter from './components/layout/HeritageScatter';

export default function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "12px",
            background: "#1C1816",
            color: "#F5F0EB",
          },
        }}
      />
      <Navbar />
      <main className="relative min-h-[calc(100vh-72px)] bg-transparent pt-24 pb-8 text-text print:pt-4">
        <div className="bg-scatter print:hidden"><HeritageScatter /></div>
        <div className="bg-illustration bg-illustration--stupa-right print:hidden" />
        <div className="bg-illustration bg-illustration--stupa-left print:hidden" />
        <div className="bg-illustration bg-illustration--window print:hidden" />
        <div className="bg-illustration bg-illustration--temple print:hidden" />
        <div className="bg-illustration bg-illustration--peacock print:hidden" />
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 relative z-10 print:max-w-none print:px-0">
          <div className="fade-in">
            <Routes>
              <Route path="/" element={<AssessPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/batch" element={<BatchPage />} />
              <Route path="/uncertainty" element={<UncertaintyPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/models" element={<ModelsPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </div>
        </div>
      </main>
      <Footer />
    </Router>
  );
}
