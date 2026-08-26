FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --chown=node:node package*.json ./
COPY --chown=node:node server.js ./server.js
COPY --chown=node:node public ./public

USER node

EXPOSE 3001

CMD ["node", "server.js"]
