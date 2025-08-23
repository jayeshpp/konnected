# services/identity/Dockerfile
# This Dockerfile builds the 'identity' service.

# --- Stage 1: Base builder for all services/apps (content from Dockerfile.base) ---
# This stage is now self-contained within this Dockerfile.
FROM node:20-alpine AS base

# Set the working directory inside the container
WORKDIR /app

# Copy pnpm related configuration files first to leverage Docker cache
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY pnpm-workspace.yaml ./

# Copy all package.json files from apps, packages, and services directories.
COPY apps/*/package.json ./apps/
COPY packages/*/package.json ./packages/
COPY services/*/package.json ./services/

# Install pnpm globally and then install all monorepo dependencies.
RUN npm install -g pnpm && pnpm fetch --prod

# Copy the entire monorepo source code into the builder stage.
COPY . .

# Build all shared packages first.
RUN pnpm --filter "./packages/*" build

# --- Stage 2: Builder for 'identity' service ---
# This stage now correctly references the 'base' stage defined directly above it.
FROM base AS builder

# Set the working directory inside the container
WORKDIR /app

# Build the specific 'identity' service.
# This assumes your 'identity' service's package.json has a name like `@konnected/identity`
# and a `build` script defined.
RUN pnpm --filter @konnected/identity build

# Use pnpm deploy to create a self-contained production-ready directory
# for the 'identity' service, including its production node_modules.
# We deploy it to a temporary directory within the builder stage.
RUN pnpm --filter @konnected/identity deploy /tmp/identity-deploy

# --- Runtime Stage ---
# This stage creates a lean production image for the 'identity' service.
FROM node:20-alpine

# Set the working directory for the runtime environment
WORKDIR /app

RUN npm install -g pnpm

# Copy the deployed production artifacts from the builder stage.
# This includes the service's dist folder, its package.json, and its production node_modules.
COPY --from=builder /tmp/identity-deploy/node_modules ./node_modules
COPY --from=builder /tmp/identity-deploy/dist ./dist
COPY --from=builder /tmp/identity-deploy/package.json ./package.json

# If your 'identity' service depends on specific shared packages (e.g., database, types),
# copy their built output as well. Adjust paths as per your monorepo structure.
# Note: These should ideally be bundled by your service's build process,
# but if not, ensure they are copied here.
# COPY --from=builder /app/packages/database/dist ./packages/database/dist
# COPY --from=builder /app/packages/types/dist ./packages/types/dist

# Set environment variables for production.
ENV NODE_ENV production

# Expose the port on which the identity service will listen.
EXPOSE 5001

# Define the command to run the identity service when the container starts.
# The `dist/index.js` is now directly in the current working directory.
CMD ["node", "dist/index.js"]
