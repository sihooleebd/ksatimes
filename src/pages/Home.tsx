import React, { useEffect, useState } from 'react';
import MagazineGrid from '../components/MagazineGrid';
import Flipbook from '../components/Flipbook';

interface Magazine {
    id: string;
    title: string;
    publishDate: string;
    authors: string[];
    pdfPath: string;
    thumbnailPath?: string;
}

const Home: React.FC = () => {
    const [magazines, setMagazines] = useState<Magazine[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMagazineId, setSelectedMagazineId] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/magazines')
            .then(res => res.json())
            .then(data => {
                setMagazines(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading magazines:', err);
                setLoading(false);
            });
    }, []);

    const handleMagazineClick = (id: string) => {
        setSelectedMagazineId(id);
    };

    const handleCloseReader = () => {
        setSelectedMagazineId(null);
    };

    const selectedMagazine = magazines.find(m => m.id === selectedMagazineId);

    return (
        <div className="min-h-screen bg-cream px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-16 text-center">
                    <h1 className="mb-4 font-serif text-5xl font-bold tracking-tight text-warm-brown sm:text-6xl">
                        KSA TIMES
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-warm-brown/80">
                        Exploring culture, art, and stories written by KSA students.
                    </p>
                </header>

                <main>
                    {loading ? (
                        <div className="flex justify-center items-center py-24">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-warm-brown/20 rounded-full"></div>
                                <div className="w-16 h-16 border-4 border-warm-brown border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                            </div>
                        </div>
                    ) : (
                        <MagazineGrid magazines={magazines} onMagazineClick={handleMagazineClick} />
                    )}
                </main>

                <footer className="mt-24 text-center text-sm text-warm-brown/60">
                    <p>&copy; {new Date().getFullYear()} KSA TIMES. All rights reserved. KSA TIMES is an official research group of the <a href="https://www.ksa.hs.kr">KSA of KAIST</a>.</p>
                    <p className="mt-2 text-xs text-gray-500">Developer: 25-083 이시후</p>
                </footer>
            </div>

            {
                selectedMagazine && (
                    <Flipbook
                        pdfPath={selectedMagazine.pdfPath}
                        onClose={handleCloseReader}
                    />
                )
            }
        </div >
    );
};

export default Home;
