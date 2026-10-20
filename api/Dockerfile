FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY *.js ./

RUN mkdir -p /data && \
    chown -R node:node /app /data

USER node

ENV PORT=3001
ENV DB_PATH=/data/waitlist.db

EXPOSE 3001

CMD ["node", "server.js"]
