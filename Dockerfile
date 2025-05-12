FROM node:20-alpine

# ✅ Install necessary build tools, Python, and Linux headers
RUN apk add --no-cache \
  python3 \
  make \
  g++ \
  linux-headers \
  && ln -sf python3 /usr/bin/python

WORKDIR /app

ENV NODE_ENV production

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
