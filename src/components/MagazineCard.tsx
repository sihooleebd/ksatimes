import React, { useRef, useEffect, useState } from 'react';
import { Calendar, Users } from 'lucide-react';
import { Document, Page } from 'react-pdf';

interface Magazine {
    id: string;
    title: string;
    publishDate: string;
    authors: string[];
    pdfPath: string;
    thumbnailPath?: string;
}

interface MagazineCardProps {
    magazine: Magazine;
    onClick: (id: string) => void;
}

const MagazineCard: React.FC<MagazineCardProps> = ({ magazine, onClick }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pageHeight, setPageHeight] = useState<number>(424);

    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                // Magazine ratio: height = width * 1.3407
                setPageHeight(Math.floor(containerWidth * 1.3407));
            }
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    return (
        <div
            className="group cursor-pointer flex flex-col gap-4 transition-transform duration-300 hover:-translate-y-2 animate-fade-in"
            onClick={() => onClick(magazine.id)}
        >
            <div
                ref={containerRef}
                className="relative w-full overflow-hidden rounded-sm shadow-md transition-shadow duration-300 group-hover:shadow-xl bg-gray-100 flex items-center justify-center"
                style={{ aspectRatio: '1 / 1.3407' }}
            >
                {magazine.thumbnailPath ? (
                    <img
                        src={magazine.thumbnailPath}
                        alt={magazine.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <Document
                        file={magazine.pdfPath}
                        loading={<div className="w-full h-full bg-gray-200 animate-pulse" />}
                        className="w-full h-full flex items-center justify-center"
                    >
                        <Page
                            pageNumber={1}
                            height={pageHeight}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                            className="transition-transform duration-500 group-hover:scale-105"
                        />
                    </Document>
                )}
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10 pointer-events-none" />
            </div>

            <div className="space-y-2">
                <h3 className="font-serif text-xl font-semibold text-warm-brown">{magazine.title}</h3>

                <div className="flex items-center gap-2 text-sm text-warm-brown/80">
                    <Calendar size={14} />
                    <span>{magazine.publishDate}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-warm-brown/80">
                    <Users size={14} />
                    <span>{magazine.authors.join(', ')}</span>
                </div>
            </div>
        </div>
    );
};

export default MagazineCard;
