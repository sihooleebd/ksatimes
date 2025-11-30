import React from 'react';
import MagazineCard from './MagazineCard';

interface Magazine {
    id: string;
    title: string;
    publishDate: string;
    authors: string[];
    pdfPath: string;
}

interface MagazineGridProps {
    magazines: Magazine[];
    onMagazineClick: (id: string) => void;
}

const MagazineGrid: React.FC<MagazineGridProps> = ({ magazines, onMagazineClick }) => {
    return (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {magazines.map((magazine) => (
                <MagazineCard
                    key={magazine.id}
                    magazine={magazine}
                    onClick={onMagazineClick}
                />
            ))}
        </div>
    );
};

export default MagazineGrid;
