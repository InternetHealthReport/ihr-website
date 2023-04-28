FROM node:16.9.1-alpine as dependencies
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm install


FROM node:16.9.1-alpine as build
WORKDIR /app
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
RUN npm run build

FROM nginx:1.20-alpine
COPY --from=build /app/dist /usr/share/nginx/html