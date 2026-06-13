import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AssessPage from "./pages/AssessPage";
import ModelsPage from "./pages/ModelsPage";
import AboutPage from "./pages/AboutPage";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import HeritageScatter from "./components/layout/HeritageScatter";

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
      <main className="relative min-h-[calc(100vh-72px)] bg-transparent pt-24 pb-8 text-text sm:pt-28">
        <div className="bg-scatter">
          <HeritageScatter />
        </div>
        <div className="bg-illustration bg-illustration--stupa-right" />
        <div className="bg-illustration bg-illustration--stupa-left" />
        <div className="bg-illustration bg-illustration--window" />
        <div className="bg-illustration bg-illustration--temple" />
        <div className="bg-illustration bg-illustration--peacock" />
        <div className="mx-auto max-w-[1280px] px-3 sm:px-5 lg:px-6 relative z-10">
          <div className="fade-in">
            <Routes>
              <Route path="/" element={<AssessPage />} />
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
