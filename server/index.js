import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_FILE = path.join(__dirname, 'data', 'entries.json');

app.use('/uploads', express.static(UPLOADS_DIR));

// Ensure directories exist
fs.ensureDirSync(path.join(__dirname, 'data'));
fs.ensureDirSync(UPLOADS_DIR);

// Generate a short hash ID
const generateId = () => crypto.randomBytes(8).toString('hex');

// Get file paths from ID
const getPdfPath = (id) => `/uploads/${id}.pdf`;
const getThumbnailPath = (id) => `/uploads/${id}.jpg`;
const getPdfFilePath = (id) => path.join(UPLOADS_DIR, `${id}.pdf`);
const getThumbnailFilePath = (id) => path.join(UPLOADS_DIR, `${id}.jpg`);

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, `temp-${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });
const uploadFields = upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]);

// Read/Write helpers for unified data file
const readData = async () => {
    try {
        if (!await fs.pathExists(DATA_FILE)) {
            await fs.writeJson(DATA_FILE, []);
            return [];
        }
        return await fs.readJson(DATA_FILE);
    } catch (error) {
        console.error('Error reading data:', error);
        return [];
    }
};

const writeData = async (data) => {
    try {
        await fs.writeJson(DATA_FILE, data, { spaces: 4 });
    } catch (error) {
        console.error('Error writing data:', error);
    }
};

// Auth
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'syediscool';

const authenticate = (req, res, next) => {
    const password = req.headers['x-admin-password'];
    if (password === ADMIN_PASSWORD) next();
    else res.status(401).json({ error: 'Unauthorized' });
};

app.post('/api/auth/verify', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) res.json({ success: true });
    else res.status(401).json({ error: 'Invalid password' });
});

// Route factory - filters by type
const createRoutes = (type, basePath) => {
    // GET - list items of this type
    app.get(basePath, async (req, res) => {
        const allItems = await readData();
        const items = allItems.filter(item => item.type === type);
        const itemsWithPaths = items.map(item => ({
            ...item,
            pdfPath: getPdfPath(item.id),
            thumbnailPath: getThumbnailPath(item.id)
        }));
        res.json(itemsWithPaths);
    });

    // POST - add new item
    app.post(basePath, authenticate, uploadFields, async (req, res) => {
        try {
            const { title, publishDate, authors } = req.body;
            const pdfFile = req.files['pdf']?.[0];
            const thumbnailFile = req.files['thumbnail']?.[0];

            if (!pdfFile) return res.status(400).json({ error: 'No PDF file uploaded' });

            const id = generateId();
            await fs.rename(pdfFile.path, getPdfFilePath(id));
            if (thumbnailFile) await fs.rename(thumbnailFile.path, getThumbnailFilePath(id));

            const newItem = {
                id,
                title,
                publishDate,
                authors: JSON.parse(authors || '[]'),
                type
            };

            const allItems = await readData();
            allItems.unshift(newItem);
            await writeData(allItems);

            res.status(201).json({
                ...newItem,
                pdfPath: getPdfPath(id),
                thumbnailPath: getThumbnailPath(id)
            });
        } catch (error) {
            console.error('Error adding item:', error);
            res.status(500).json({ error: 'Failed to add item' });
        }
    });

    // POST - update thumbnail
    app.post(`${basePath}/:id/thumbnail`, authenticate, uploadFields, async (req, res) => {
        try {
            const { id } = req.params;
            const file = req.files['thumbnail']?.[0];
            if (!file) return res.status(400).json({ error: 'No thumbnail file uploaded' });

            const allItems = await readData();
            const item = allItems.find(m => m.id === id && m.type === type);

            if (!item) {
                await fs.remove(file.path);
                return res.status(404).json({ error: 'Item not found' });
            }

            const thumbPath = getThumbnailFilePath(id);
            if (await fs.pathExists(thumbPath)) await fs.remove(thumbPath);
            await fs.rename(file.path, thumbPath);

            res.json({ message: 'Thumbnail updated', thumbnailPath: getThumbnailPath(id) });
        } catch (error) {
            console.error('Error updating thumbnail:', error);
            res.status(500).json({ error: 'Failed to update thumbnail' });
        }
    });

    // PUT - update item metadata
    app.put(`${basePath}/:id`, authenticate, async (req, res) => {
        try {
            const { id } = req.params;
            const { title, publishDate, authors } = req.body;

            const allItems = await readData();
            const itemIndex = allItems.findIndex(m => m.id === id && m.type === type);

            if (itemIndex === -1) {
                return res.status(404).json({ error: 'Item not found' });
            }

            // Update metadata
            if (title) allItems[itemIndex].title = title;
            if (publishDate) allItems[itemIndex].publishDate = publishDate;
            if (authors) allItems[itemIndex].authors = typeof authors === 'string' ? JSON.parse(authors) : authors;

            await writeData(allItems);

            res.json({
                ...allItems[itemIndex],
                pdfPath: getPdfPath(id),
                thumbnailPath: getThumbnailPath(id)
            });
        } catch (error) {
            console.error('Error updating item:', error);
            res.status(500).json({ error: 'Failed to update item' });
        }
    });

    // DELETE - remove item
    app.delete(`${basePath}/:id`, authenticate, async (req, res) => {
        try {
            const { id } = req.params;
            let allItems = await readData();
            const item = allItems.find(m => m.id === id && m.type === type);

            if (!item) return res.status(404).json({ error: 'Item not found' });

            // Remove files
            const pdfPath = getPdfFilePath(id);
            const thumbPath = getThumbnailFilePath(id);
            if (await fs.pathExists(pdfPath)) await fs.remove(pdfPath);
            if (await fs.pathExists(thumbPath)) await fs.remove(thumbPath);

            allItems = allItems.filter(m => m.id !== id);
            await writeData(allItems);

            res.json({ message: 'Item deleted successfully' });
        } catch (error) {
            console.error('Error deleting item:', error);
            res.status(500).json({ error: 'Failed to delete item' });
        }
    });
};

// Create routes for both content types
createRoutes('magazines', '/api/magazines');
createRoutes('ewc', '/api/ewc');

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
