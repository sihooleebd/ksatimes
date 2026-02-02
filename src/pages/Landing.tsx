import React from 'react';
import { Link } from 'react-router-dom';

const Landing: React.FC = () => {
    return (
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-warm-brown mb-4 text-center">
                KSA Publications
            </h1>
            <p className="text-warm-brown/70 mb-16 text-center max-w-md">
                Select a publication to explore
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                {/* KSA TIMES Card */}
                <Link
                    to="/ksatimes"
                    className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-warm-brown/10 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-warm-brown/5 to-warm-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-warm-brown/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-warm-brown/20 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-warm-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                        </div>
                        <h2 className="font-serif text-2xl font-bold text-warm-brown mb-3">
                            KSA TIMES
                        </h2>
                        <p className="text-warm-brown/70 text-sm leading-relaxed">
                            Exploring culture, art, and stories written by KSA students.
                        </p>
                        <div className="mt-6 flex items-center text-warm-gold font-medium text-sm group-hover:text-warm-brown transition-colors">
                            <span>Browse Magazines</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </Link>

                {/* English Writing Contest Card */}
                <Link
                    to="/ewc"
                    className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-warm-brown/10 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-muted-green/10 to-sage/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-muted-green/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-muted-green/30 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-warm-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                        </div>
                        <h2 className="font-serif text-2xl font-bold text-warm-brown mb-3">
                            English Writing Contest
                        </h2>
                        <p className="text-warm-brown/70 text-sm leading-relaxed">
                            Showcasing exceptional English writing from talented KSA students.
                        </p>
                        <div className="mt-6 flex items-center text-muted-green font-medium text-sm group-hover:text-warm-brown transition-colors">
                            <span>Browse Entries</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </Link>
            </div>

            <footer className="mt-24 text-center text-sm text-warm-brown/60">
                <p>&copy; {new Date().getFullYear()} KSA Publications. All rights reserved.</p>
                <p className="mt-2 text-xs text-gray-500">Developer: 25-083 이시후</p>
                <Link to="/admin" className="mt-2 inline-block text-xs text-warm-brown/40 hover:text-warm-brown transition-colors">Admin</Link>
            </footer>
        </div>
    );
};

export default Landing;
