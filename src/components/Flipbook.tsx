import React, { useState, useCallback, forwardRef, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import HTMLFlipBook from 'react-pageflip';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FlipbookProps {
    pdfPath: string;
    onClose: () => void;
}

interface PageProps {
    pageNumber: number;
    width: number;
    height: number;
    shouldRender: boolean;
    isCover?: boolean;
}


// Wrapper for PDF Page to be used in FlipBook
const PDFPage = forwardRef<HTMLDivElement, PageProps>(({ pageNumber, width, height, shouldRender, isCover = false }, ref) => {
    return (
        <div
            ref={ref}
            className={`shadow-sm overflow-hidden flex items-center justify-center ${isCover ? 'bg-gradient-to-br from-warm-brown/5 to-warm-brown/10' : 'bg-white'
                }`}
            style={{ width: `${width}px`, height: `${height}px` }}
        >
            {shouldRender ? (
                <Page
                    pageNumber={pageNumber}
                    height={height}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    loading={
                        <div className="flex items-center justify-center w-full h-full">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-warm-brown/20 rounded-full"></div>
                                <div className="w-12 h-12 border-4 border-warm-brown border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                            </div>
                        </div>
                    }
                />
            ) : (
                <div className="flex items-center justify-center w-full h-full text-gray-300">
                    <div className="animate-pulse w-12 h-12 rounded-full bg-gray-200"></div>
                </div>
            )}
        </div>
    );
});

PDFPage.displayName = 'PDFPage';

const Flipbook: React.FC<FlipbookProps> = ({ pdfPath, onClose }) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [dimensions, setDimensions] = useState({ width: 600, height: 848 }); // A4 ratio
    const [isMobile, setIsMobile] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const flipBookRef = useRef<any>(null);

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    }, []);

    const onFlip = useCallback((e: any) => {
        setCurrentPage(e.data);
    }, []);

    // Calculate dimensions based on window - ENFORCE MAGAZINE RATIO (1.3407)
    useEffect(() => {
        const updateDimensions = () => {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const mobile = windowWidth < 768;
            const MAGAZINE_RATIO = 1.3407; // Actual magazine ratio

            setIsMobile(mobile);

            if (mobile) {
                // Mobile: single page view
                const maxPageWidth = Math.min(windowWidth * 0.95, 500);
                const maxPageHeight = windowHeight * 0.9;

                // Calculate based on magazine ratio
                let pageWidth = maxPageWidth;
                let pageHeight = pageWidth * MAGAZINE_RATIO;

                if (pageHeight > maxPageHeight) {
                    pageHeight = maxPageHeight;
                    pageWidth = pageHeight / MAGAZINE_RATIO;
                }

                setDimensions({
                    width: Math.floor(pageWidth),
                    height: Math.floor(pageHeight)
                });
            } else {
                // Desktop: double page view - enforce magazine ratio
                const maxPageWidth = Math.min(windowWidth * 0.48, 700);
                const maxPageHeight = windowHeight * 0.9;

                // Calculate based on magazine ratio
                let pageWidth = maxPageWidth;
                let pageHeight = pageWidth * MAGAZINE_RATIO;

                if (pageHeight > maxPageHeight) {
                    pageHeight = maxPageHeight;
                    pageWidth = pageHeight / MAGAZINE_RATIO;
                }

                setDimensions({
                    width: Math.floor(pageWidth),
                    height: Math.floor(pageHeight)
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Keyboard controls: arrow keys and Esc
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!flipBookRef.current) return;

            switch (e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    flipBookRef.current.pageFlip().flipPrev();
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    flipBookRef.current.pageFlip().flipNext();
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-4 animate-fade-in">
            <button
                onClick={onClose}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:text-gray-300 z-50 p-2 bg-black/50 rounded-full transition-colors"
                aria-label="Close (Esc)"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            <div className="relative flex items-center justify-center w-full h-full">
                <Document
                    file={pdfPath}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="flex justify-center items-center"
                    loading={
                        <div className="text-white text-center">
                            <div className="relative inline-block">
                                <div className="w-16 h-16 border-4 border-white/20 rounded-full"></div>
                                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                            </div>
                            <p className="mt-4">Loading PDF...</p>
                        </div>
                    }
                >
                    {numPages > 0 && (
                        // @ts-ignore - react-pageflip types are sometimes missing or tricky
                        <HTMLFlipBook
                            ref={flipBookRef}
                            width={dimensions.width}
                            height={dimensions.height}
                            size="fixed"
                            minWidth={isMobile ? 300 : 400}
                            maxWidth={isMobile ? 500 : 700}
                            minHeight={isMobile ? 424 : 565}
                            maxHeight={isMobile ? 700 : 990}
                            maxShadowOpacity={0.5}
                            showCover={false}
                            mobileScrollSupport={true}
                            swipeDistance={30}
                            clickEventForward={false}
                            useMouseEvents={true}
                            className="shadow-2xl mx-auto"
                            flippingTime={400}
                            drawShadow={true}
                            usePortrait={isMobile}
                            onFlip={onFlip}
                        >
                            {/* Blank page for proper alignment with soft cover */}
                            <div key="blank_page" style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px`, backgroundColor: 'transparent' }} />

                            {/* All PDF pages */}
                            {Array.from(new Array(numPages), (_, index) => {
                                const pageNum = index + 1;
                                // Load pages within range: current page +/- 5 (reduced from 10 for performance)
                                // Note: currentPage from react-pageflip is 0-indexed
                                const shouldRender = Math.abs(index - currentPage) <= 5;
                                const isCover = index === 0;

                                return (
                                    <PDFPage
                                        key={`page_${pageNum}`}
                                        pageNumber={pageNum}
                                        width={dimensions.width}
                                        height={dimensions.height}
                                        shouldRender={shouldRender}
                                        isCover={isCover}
                                    />
                                );
                            })}
                        </HTMLFlipBook>
                    )}
                </Document>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-xs sm:text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                {isMobile ? 'Swipe to flip pages' : 'Click edges, drag, or use arrow keys • Press Esc to close'}
            </div>
        </div>
    );
};

export default Flipbook;
