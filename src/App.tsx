import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import FloatingButtons from './components/FloatingButtons';
import PageTransition from './components/PageTransition';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Admin from './pages/Admin';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageTransition>
            <Landing />
          </PageTransition>
        } />
        <Route path="/ksatimes" element={
          <PageTransition>
            <Home type="ksatimes" />
          </PageTransition>
        } />
        <Route path="/ewc" element={
          <PageTransition>
            <Home type="ewc" />
          </PageTransition>
        } />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AnimatedRoutes />
      <FloatingButtons />
    </Router>
  );
}

export default App;
