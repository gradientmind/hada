# Moltbot Gateway Container
# Built from source: https://github.com/moltbot/moltbot

FROM node:22-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Clone moltbot from GitHub
RUN git clone --depth 1 https://github.com/moltbot/moltbot.git .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build UI (required before main build)
RUN pnpm ui:build

# Build the project
RUN pnpm build

# Create config directory
RUN mkdir -p /root/.moltbot

# Copy configuration
COPY config/moltbot.json /root/.moltbot/moltbot.json

# Expose Gateway port
EXPOSE 18789

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:18789/health || exit 1

# Start Gateway in headless mode
CMD ["node", "/app/moltbot.mjs", "gateway", "--port", "18789", "--bind", "lan", "--verbose"]
