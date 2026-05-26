FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy source code
COPY . .

# Create upload directories
RUN mkdir -p /app/uploads/avatars /app/uploads/images /app/uploads/documents /app/uploads/videos /app/uploads/audio /app/uploads/stickers

EXPOSE 5000

CMD sh -c "npx prisma migrate deploy --schema=./prisma/schema.prisma 2>/dev/null; npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss && node prisma/seed.js 2>/dev/null; node src/index.js"
