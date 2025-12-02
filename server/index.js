import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const DATA_FILE = path.join(__dirname, 'data', 'magazines.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure directories exist
fs.ensureDirSync(path.join(__dirname, 'data'));
fs.ensureDirSync(UPLOADS_DIR);

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR)
    },
    filename: function (req, file, cb) {
        // Use timestamp for initial naming (req.body not available here)
        if (file.fieldname === 'thumbnail') {
            const timestamp = Date.now();
            const ext = path.extname(file.originalname) || '.jpg';
            cb(null, `thumbnail-${timestamp}${ext}`);
        } else {
            cb(null, file.originalname);
        }
    }
});

const upload = multer({ storage: storage });
const uploadFields = upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]);

// Helper to read data
const readData = async () => {
    try {
        if (!await fs.pathExists(DATA_FILE)) {
            await fs.writeJson(DATA_FILE, []);
            return [];
        }
        return await fs.readJson(DATA_FILE);
    } catch (error) {
        console.error("Error reading data:", error);
        return [];
    }
};

// Helper to write data
const writeData = async (data) => {
    try {
        await fs.writeJson(DATA_FILE, data, { spaces: 4 });
    } catch (error) {
        console.error("Error writing data:", error);
    }
};

// Auth Middleware
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'syediscool';

const authenticate = (req, res, next) => {
    const password = req.headers['x-admin-password'];
    if (password === ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// POST /api/auth/verify
app.post('/api/auth/verify', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

// GET /api/magazines
app.get('/api/magazines', async (req, res) => {
    const magazines = await readData();
    // Map pdfPath to full URL or relative path served by static middleware
    const magazinesWithUrl = magazines.map(m => ({
        ...m,
        pdfPath: `/uploads/${path.basename(m.pdfPath)}`,
        thumbnailPath: m.thumbnailPath ? `/uploads/${path.basename(m.thumbnailPath)}` : null
    }));
    res.json(magazinesWithUrl);
});

// POST /api/magazines
app.post('/api/magazines', authenticate, uploadFields, async (req, res) => {
    try {
        const { title, publishDate, authors } = req.body;
        const files = req.files;
        const pdfFile = files['pdf'] ? files['pdf'][0] : null;
        const thumbnailFile = files['thumbnail'] ? files['thumbnail'][0] : null;

        if (!pdfFile) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        const magazines = await readData();

        const newMagazine = {
            id: Date.now().toString(),
            title,
            publishDate,
            authors: JSON.parse(authors || '[]'),
            pdfPath: `/uploads/${pdfFile.filename}`,
            thumbnailPath: thumbnailFile ? `/uploads/${thumbnailFile.filename}` : null
        };

        magazines.unshift(newMagazine); // Add to beginning
        await writeData(magazines);

        res.status(201).json(newMagazine);
    } catch (error) {
        console.error("Error adding magazine:", error);
        res.status(500).json({ error: 'Failed to add magazine' });
    }
});

// POST /api/magazines/:id/thumbnail
app.post('/api/magazines/:id/thumbnail', authenticate, uploadFields, async (req, res) => {
    try {
        const { id } = req.params;
        const files = req.files;
        const file = files['thumbnail'] ? files['thumbnail'][0] : null;

        if (!file) {
            return res.status(400).json({ error: 'No thumbnail file uploaded' });
        }

        let magazines = await readData();
        const magazineIndex = magazines.findIndex(m => m.id === id);

        if (magazineIndex === -1) {
            // Clean up uploaded file if magazine not found
            await fs.remove(file.path);
            return res.status(404).json({ error: 'Magazine not found' });
        }

        // Remove old thumbnail if exists
        if (magazines[magazineIndex].thumbnailPath) {
            const oldFilename = path.basename(magazines[magazineIndex].thumbnailPath);
            const oldFilePath = path.join(UPLOADS_DIR, oldFilename);
            if (await fs.pathExists(oldFilePath)) {
                await fs.remove(oldFilePath);
            }
        }

        magazines[magazineIndex].thumbnailPath = `/uploads/${file.filename}`;
        await writeData(magazines);

        res.json({ message: 'Thumbnail updated successfully', thumbnailPath: magazines[magazineIndex].thumbnailPath });
    } catch (error) {
        console.error("Error updating thumbnail:", error);
        res.status(500).json({ error: 'Failed to update thumbnail' });
    }
});

// DELETE /api/magazines/:id
app.delete('/api/magazines/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        let magazines = await readData();
        const magazineToDelete = magazines.find(m => m.id === id);

        if (!magazineToDelete) {
            return res.status(404).json({ error: 'Magazine not found' });
        }

        // Remove file
        const filename = path.basename(magazineToDelete.pdfPath);
        const filePath = path.join(UPLOADS_DIR, filename);
        if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
        }

        // Remove thumbnail if exists
        if (magazineToDelete.thumbnailPath) {
            const thumbFilename = path.basename(magazineToDelete.thumbnailPath);
            const thumbFilePath = path.join(UPLOADS_DIR, thumbFilename);
            if (await fs.pathExists(thumbFilePath)) {
                await fs.remove(thumbFilePath);
            }
        }

        magazines = magazines.filter(m => m.id !== id);
        await writeData(magazines);

        res.json({ message: 'Magazine deleted successfully' });
    } catch (error) {
        console.error("Error deleting magazine:", error);
        res.status(500).json({ error: 'Failed to delete magazine' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
