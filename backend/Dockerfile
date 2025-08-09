FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production=false
COPY prisma ./prisma
COPY src ./src
ENV PORT=4000
EXPOSE 4000
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node src/server.js"]