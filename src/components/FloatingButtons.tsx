import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const FloatingButtons: React.FC = () => {
    const location = useLocation();
    const isHome = location.pathname === '/';

    // Only show home button when not on landing page
    if (isHome) return null;

    return (
        <div className="fixed bottom-6 right-6 z-40">
            <Link
                to="/"
                className="w-14 h-14 bg-warm-brown text-cream rounded-full shadow-lg hover:bg-warm-brown/90 transition-all hover:scale-110 flex items-center justify-center"
                aria-label="Back to Home"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            </Link>
        </div>
    );
};

export default FloatingButtons;
