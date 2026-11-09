
# ==================================
# STAGE 1: FRONTEND BUILD
# ==================================

FROM node:22-alpine AS frontend-build

WORKDIR /frontend

# Copy frontend package files
COPY Frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source code
COPY Frontend/ ./

# Build React application
RUN npm run build


# ==================================
# STAGE 2: BACKEND
# ==================================

FROM node:22-alpine AS backend

WORKDIR /app

ENV NODE_ENV=production

# Copy backend package files
COPY Backend/package*.json ./

# Install backend dependencies
RUN npm ci --omit=dev

# Copy backend source code
COPY Backend/ ./

# Create public folder
RUN mkdir -p public

# Copy React production build into public
COPY --from=frontend-build /frontend/dist/ ./public/

# Expose backend port
EXPOSE 3000

# Start backend server
CMD ["node", "server.js"]
