FROM node:22 AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build
FROM nginx:stable-alpine-slim
WORKDIR /app
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80