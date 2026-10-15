FROM node:22-alpine

WORKDIR /app

# Install build dependencies for sharp and native modules if necessary
RUN apk add --no-cache vips-dev python3 make g++

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
