# Sito pubblico di prova di BigAnt OS: solo la pagina già costruita e un piccolo server Node senza dipendenze.
# Ricostruire la pagina con: node scripts/build-online.js --pubblica
FROM node:24-alpine
WORKDIR /app
COPY package.json ./
COPY online/servi.js online/servi.js
COPY online/pubblica/index.html online/pubblica/index.html
USER node
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "online/servi.js"]
