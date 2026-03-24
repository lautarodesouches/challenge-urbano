FROM node:18-alpine

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm config set ignore-scripts false && pnpm i

COPY . .
RUN pnpm run build

CMD ["pnpm", "run", "start:dev"]
