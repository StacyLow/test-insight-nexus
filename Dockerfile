# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lockb ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with Node.js for backend and nginx for frontend
FROM node:18-alpine

# Install nginx
RUN apk add --no-cache nginx

# Set working directory
WORKDIR /app

# Copy backend files
COPY server/ ./server/
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy built frontend to nginx directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create nginx directories
RUN mkdir -p /var/log/nginx /var/lib/nginx/tmp

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'nginx &' >> /start.sh && \
    echo 'node server/app.js' >> /start.sh && \
    chmod +x /start.sh

# Expose ports
EXPOSE 5010 3001

# Start both services
CMD ["/start.sh"]