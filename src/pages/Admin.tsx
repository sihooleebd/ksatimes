import React, { useState, useEffect } from 'react';

interface Magazine {
    id: string;
    title: string;
    publishDate: string;
    authors: string[];
    pdfPath: string;
    thumbnailPath?: string;
}

import { pdfjs } from 'react-pdf';
// Ensure worker is set up
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const Admin: React.FC = () => {
    const [magazines, setMagazines] = useState<Magazine[]>([]);
    const [title, setTitle] = useState('');
    const [publishDate, setPublishDate] = useState('');
    const [authors, setAuthors] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    // Auth state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [inputPassword, setInputPassword] = useState('');

    const fetchMagazines = async () => {
        try {
            const res = await fetch('/api/magazines');
            const data = await res.json();
            setMagazines(data);
        } catch (error) {
            console.error('Error fetching magazines:', error);
        }
    };

    useEffect(() => {
        const storedPassword = localStorage.getItem('adminPassword');
        if (storedPassword) {
            verifyPassword(storedPassword);
        } else {
            fetchMagazines(); // Still fetch list even if not logged in (optional, but good for UX)
        }
    }, []);

    const verifyPassword = async (pwd: string) => {
        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pwd })
            });

            if (res.ok) {
                setIsAuthenticated(true);
                setPassword(pwd);
                localStorage.setItem('adminPassword', pwd);
                fetchMagazines();
            } else {
                localStorage.removeItem('adminPassword');
                setIsAuthenticated(false);
                if (inputPassword) alert('Invalid password');
            }
        } catch (error) {
            console.error('Auth error:', error);
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        verifyPassword(inputPassword);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setPassword('');
        setInputPassword('');
        localStorage.removeItem('adminPassword');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const generateThumbnail = async (pdfFile: File): Promise<Blob | null> => {
        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await pdfjs.getDocument(arrayBuffer).promise;
            const page = await pdf.getPage(1);

            const viewport = page.getViewport({ scale: 1.0 }); // Scale 1.0 is usually enough for thumbnail
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            // Set dimensions to match magazine ratio or just keep original aspect ratio
            // Magazine ratio is approx 1:1.3407
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            if (context) {
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                await page.render(renderContext as any).promise;

                return new Promise((resolve) => {
                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', 0.8);
                });
            }
            return null;
        } catch (error) {
            console.error("Error generating thumbnail:", error);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title || !publishDate) {
            alert('Please fill in all required fields');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('publishDate', publishDate);
        formData.append('authors', JSON.stringify(authors.split(',').map(a => a.trim())));
        formData.append('pdf', file);

        // Generate and append thumbnail
        const thumbnailBlob = await generateThumbnail(file);
        if (thumbnailBlob) {
            formData.append('thumbnail', thumbnailBlob, 'thumbnail.jpg');
        }

        try {
            const res = await fetch('/api/magazines', {
                method: 'POST',
                headers: {
                    'x-admin-password': password
                },
                body: formData,
            });

            if (res.ok) {
                alert('Magazine added successfully');
                setTitle('');
                setPublishDate('');
                setAuthors('');
                setFile(null);
                fetchMagazines();
            } else {
                alert('Failed to add magazine');
            }
        } catch (error) {
            console.error('Error adding magazine:', error);
            alert('Error adding magazine');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this magazine?')) return;

        try {
            const res = await fetch(`/api/magazines/${id}`, {
                method: 'DELETE',
                headers: {
                    'x-admin-password': password
                }
            });

            if (res.ok) {
                fetchMagazines();
            } else {
                alert('Failed to delete magazine');
            }
        } catch (error) {
            console.error('Error deleting magazine:', error);
        }
    };

    const handleMigration = async (magazine: Magazine) => {
        if (!magazine.pdfPath) return;

        try {
            setLoading(true);
            // Fetch the PDF
            const response = await fetch(magazine.pdfPath);
            const blob = await response.blob();
            const pdfFile = new File([blob], "temp.pdf", { type: "application/pdf" });

            const thumbnailBlob = await generateThumbnail(pdfFile);

            if (thumbnailBlob) {
                const formData = new FormData();
                formData.append('thumbnail', thumbnailBlob, 'thumbnail.jpg');
                formData.append('title', magazine.title);

                const res = await fetch(`/api/magazines/${magazine.id}/thumbnail`, {
                    method: 'POST',
                    headers: {
                        'x-admin-password': password
                    },
                    body: formData
                });

                if (res.ok) {
                    // Update local state
                    const data = await res.json();
                    setMagazines(prev => prev.map(m => m.id === magazine.id ? { ...m, thumbnailPath: data.thumbnailPath } : m));
                    console.log(`Thumbnail generated for ${magazine.title}`);
                } else {
                    console.error(`Failed to upload thumbnail for ${magazine.title}`);
                }
            }
        } catch (error) {
            console.error(`Error migrating ${magazine.title}:`, error);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                    <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Admin Access</h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                value={inputPassword}
                                onChange={(e) => setInputPassword(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Login
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">KSA Times Admin</h1>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-600 hover:text-gray-900 underline"
                    >
                        Logout
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Add New Magazine</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Publish Year</label>
                            <input
                                type="text"
                                value={publishDate}
                                onChange={(e) => setPublishDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Authors (comma separated)</label>
                            <input
                                type="text"
                                value={authors}
                                onChange={(e) => setAuthors(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">PDF File</label>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Uploading...' : 'Add Magazine'}
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <h2 className="text-xl font-semibold p-6 border-b">Existing Magazines</h2>
                    <ul className="divide-y divide-gray-200">
                        {magazines.map((magazine) => (
                            <li key={magazine.id} className="p-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">{magazine.title}</h3>
                                    <p className="text-sm text-gray-500">{magazine.publishDate} • {magazine.authors.join(', ')}</p>
                                </div>
                                <button
                                    onClick={() => handleDelete(magazine.id)}
                                    className="text-red-600 hover:text-red-900 font-medium"
                                >
                                    Delete
                                </button>
                                {!magazine.thumbnailPath && (
                                    <button
                                        onClick={() => handleMigration(magazine)}
                                        className="ml-4 text-blue-600 hover:text-blue-900 font-medium"
                                        disabled={loading}
                                    >
                                        Generate Thumbnail
                                    </button>
                                )}
                            </li>
                        ))}
                        {magazines.length === 0 && (
                            <li className="p-6 text-center text-gray-500">No magazines found.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Admin;
