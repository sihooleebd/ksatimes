# KSA Publications

A digital magazine viewer for KSA student publications, featuring an interactive flipbook reader.

## Features

-  **Interactive Flipbook Reader** - Page-turning animation with swipe/click/keyboard support
-  **Responsive Design** - Works on desktop and mobile devices
-  **Warm, Modern UI** - Clean design with smooth page transitions
-  **Admin Panel** - Upload and manage publications with authentication
-  **Docker Ready** - Easy deployment with Docker Compose

## Quick Start

### Prerequisites
- Node.js 20+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/sihooleebd/ksatimes
cd ksatimes

# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
```

### Configuration

Create a `.env` file in the `server` directory:

```env
ADMIN_PASSWORD=your_secure_password_here
PORT=3001
```

> **Required:** The server will not start without `ADMIN_PASSWORD` set.

### Development

```bash
# Terminal 1: Start the backend
cd server
npm run dev

# Terminal 2: Start the frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Production with Docker

```bash
# Build and run
docker compose up --build

# Access at http://localhost:3001
```

## Project Structure

```
ksatimes/
├── src/                    # Frontend React app
│   ├── components/         # React components
│   ├── pages/              # Page components
│   └── index.css           # Global styles
├── server/                 # Express backend
│   ├── data/               # JSON data storage
│   ├── uploads/            # PDF and thumbnail files
│   └── index.js            # Server entry point
├── Dockerfile              # Production Docker build
├── docker-compose.yml      # Docker orchestration
└── README.md
```

## API Endpoints

| Method | Endpoint             | Description                              |
| ------ | -------------------- | ---------------------------------------- |
| GET    | `/api/magazines`     | List all magazines                       |
| POST   | `/api/magazines`     | Add new magazine (auth required)         |
| PUT    | `/api/magazines/:id` | Update magazine metadata (auth required) |
| DELETE | `/api/magazines/:id` | Delete magazine (auth required)          |
| GET    | `/api/ewc`           | List all EWC entries                     |
| POST   | `/api/ewc`           | Add new EWC entry (auth required)        |
| PUT    | `/api/ewc/:id`       | Update EWC entry (auth required)         |
| DELETE | `/api/ewc/:id`       | Delete EWC entry (auth required)         |

## Tech Stack

- **Frontend:** React, Vite, TailwindCSS, Framer Motion, react-pageflip, react-pdf
- **Backend:** Express, Node.js, Multer
- **Deployment:** Docker, Docker Compose

## License

MIT

---

Developer: 25-083 이시후
