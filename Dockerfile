# Use Node 18 LTS (or Node 20) as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package manifests first for efficient caching
COPY package.json package-lock.json ./

# Install dependencies (using lockfile)
RUN npm ci && npm cache clean --force

# Copy the rest of the application code
COPY . . 

# Build the Next.js app for production
RUN npm run build

# Set environment to production (Next.js uses this for optimizations)
ENV NODE_ENV=production

# Expose the port that Next.js listens on (defaults to 3000)
EXPOSE 3000

# Start the Next.js server
CMD ["npm", "start"]
