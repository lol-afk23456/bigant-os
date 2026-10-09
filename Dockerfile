# Server reale di BigAnt OS (Fase 1 · docs/FASE-1-SERVER-REALE.md).
FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js ./
COPY src ./src
COPY public ./public
COPY scripts ./scripts
RUN mkdir -p /data && chown -R node:node /data
USER node
ENV NODE_ENV=production
ENV BIGANT_MODALITA=reale
EXPOSE 8080
CMD ["node", "server.js"]
