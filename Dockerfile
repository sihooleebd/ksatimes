# Build stage for frontend
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy server files
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --production

COPY server/ ./

# Create data directories
RUN mkdir -p data uploads/pdfs uploads/thumbnails

# Copy built frontend to be served by the server
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start server
CMD ["node", "index.js"]
