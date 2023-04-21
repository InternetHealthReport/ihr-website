#BUILDER
FROM node:16.9.1-alpine as builder

RUN apk add --no-cache python3 make g++

#Builder directory
WORKDIR /ihr-website

#Copy builder source
COPY package*.json ./

# installing all dependencies
RUN npm install

# Copy all files
COPY . .

# MAIN
FROM node:16.9.1-alpine as main

# Make main app directory
WORKDIR /app

#Copy all from builder stage
COPY --from=builder /ihr-website/.  ./

#Start the serve
CMD ["npm", "run", "serve"]
