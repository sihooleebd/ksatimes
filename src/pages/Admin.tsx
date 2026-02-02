import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { pdfjs } from 'react-pdf';

// Ensure worker is set up
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Magazine {
    id: string;
    title: string;
    publishDate: string;
    authors: string[];
    pdfPath: string;
    thumbnailPath?: string;
}

type ContentType = 'ksatimes' | 'ewc';

const contentConfig = {
    ksatimes: {
        label: 'KSA TIMES',
        apiEndpoint: '/api/magazines',
        itemName: 'Magazine',
    },
    ewc: {
        label: 'English Writing Contest',
        apiEndpoint: '/api/ewc',
        itemName: 'Entry',
    },
};

const Admin: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ContentType>('ksatimes');
    const [items, setItems] = useState<Magazine[]>([]);
    const [title, setTitle] = useState('');
    const [publishDate, setPublishDate] = useState('');
    const [authors, setAuthors] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auth state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [inputPassword, setInputPassword] = useState('');

    // Edit state
    const [editingItem, setEditingItem] = useState<Magazine | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editPublishDate, setEditPublishDate] = useState('');
    const [editAuthors, setEditAuthors] = useState('');

    const config = contentConfig[activeTab];

    const fetchItems = async () => {
        try {
            const res = await fetch(config.apiEndpoint);
            const data = await res.json();
            setItems(data);
        } catch (error) {
            console.error(`Error fetching ${config.itemName.toLowerCase()}s:`, error);
        }
    };

    useEffect(() => {
        const storedPassword = localStorage.getItem('adminPassword');
        if (storedPassword) {
            verifyPassword(storedPassword);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchItems();
        }
    }, [activeTab, isAuthenticated]);

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
                fetchItems();
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

            const viewport = page.getViewport({ scale: 1.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

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
            const res = await fetch(config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'x-admin-password': password
                },
                body: formData,
            });

            if (res.ok) {
                alert(`${config.itemName} added successfully`);
                setTitle('');
                setPublishDate('');
                setAuthors('');
                setFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                fetchItems();
            } else {
                alert(`Failed to add ${config.itemName.toLowerCase()}`);
            }
        } catch (error) {
            console.error(`Error adding ${config.itemName.toLowerCase()}:`, error);
            alert(`Error adding ${config.itemName.toLowerCase()}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(`Are you sure you want to delete this ${config.itemName.toLowerCase()}?`)) return;

        try {
            const res = await fetch(`${config.apiEndpoint}/${id}`, {
                method: 'DELETE',
                headers: {
                    'x-admin-password': password
                }
            });

            if (res.ok) {
                fetchItems();
            } else {
                alert(`Failed to delete ${config.itemName.toLowerCase()}`);
            }
        } catch (error) {
            console.error(`Error deleting ${config.itemName.toLowerCase()}:`, error);
        }
    };

    const handleMigration = async (item: Magazine) => {
        if (!item.pdfPath) return;

        try {
            setLoading(true);
            const response = await fetch(item.pdfPath);
            const blob = await response.blob();
            const pdfFile = new File([blob], "temp.pdf", { type: "application/pdf" });

            const thumbnailBlob = await generateThumbnail(pdfFile);

            if (thumbnailBlob) {
                const formData = new FormData();
                formData.append('thumbnail', thumbnailBlob, 'thumbnail.jpg');
                formData.append('title', item.title);

                const res = await fetch(`${config.apiEndpoint}/${item.id}/thumbnail`, {
                    method: 'POST',
                    headers: {
                        'x-admin-password': password
                    },
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    setItems(prev => prev.map(m => m.id === item.id ? { ...m, thumbnailPath: data.thumbnailPath } : m));
                    console.log(`Thumbnail generated for ${item.title}`);
                } else {
                    console.error(`Failed to upload thumbnail for ${item.title}`);
                }
            }
        } catch (error) {
            console.error(`Error migrating ${item.title}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartEdit = (item: Magazine) => {
        setEditingItem(item);
        setEditTitle(item.title);
        setEditPublishDate(item.publishDate);
        setEditAuthors(item.authors.join(', '));
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;

        setLoading(true);
        try {
            const res = await fetch(`${config.apiEndpoint}/${editingItem.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': password
                },
                body: JSON.stringify({
                    title: editTitle,
                    publishDate: editPublishDate,
                    authors: editAuthors.split(',').map(a => a.trim())
                })
            });

            if (res.ok) {
                const updatedItem = await res.json();
                setItems(prev => prev.map(m => m.id === editingItem.id ? updatedItem : m));
                setEditingItem(null);
                alert(`${config.itemName} updated successfully`);
            } else {
                alert(`Failed to update ${config.itemName.toLowerCase()}`);
            }
        } catch (error) {
            console.error(`Error updating ${config.itemName.toLowerCase()}:`, error);
            alert(`Error updating ${config.itemName.toLowerCase()}`);
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
                    <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            className="text-sm text-gray-600 hover:text-gray-900 underline"
                        >
                            Return to Main
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-gray-600 hover:text-gray-900 underline"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {(Object.keys(contentConfig) as ContentType[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {contentConfig[tab].label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Add New {config.itemName}</h2>
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
                                ref={fileInputRef}
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
                            {loading ? 'Uploading...' : `Add ${config.itemName}`}
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <h2 className="text-xl font-semibold p-6 border-b">Existing {config.itemName}s</h2>
                    <ul className="divide-y divide-gray-200">
                        {items.map((item) => (
                            <li key={item.id} className="p-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                                    <p className="text-sm text-gray-500">{item.publishDate} • {item.authors.join(', ')}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {!item.thumbnailPath && (
                                        <button
                                            onClick={() => handleMigration(item)}
                                            className="text-blue-600 hover:text-blue-900 font-medium"
                                            disabled={loading}
                                        >
                                            Generate Thumbnail
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleStartEdit(item)}
                                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="text-red-600 hover:text-red-900 font-medium"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                        {items.length === 0 && (
                            <li className="p-6 text-center text-gray-500">No {config.itemName.toLowerCase()}s found.</li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-semibold mb-4">Edit {config.itemName}</h3>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Publish Year</label>
                                <input
                                    type="text"
                                    value={editPublishDate}
                                    onChange={(e) => setEditPublishDate(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Authors (comma separated)</label>
                                <input
                                    type="text"
                                    value={editAuthors}
                                    onChange={(e) => setEditAuthors(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingItem(null)}
                                    className="flex-1 py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
