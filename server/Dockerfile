FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY scripts ./scripts
RUN addgroup -S emr && adduser -S emr -G emr && chown -R emr:emr /app
USER emr
EXPOSE 5000
CMD ["node", "src/server.js"]
