FROM node:16-alpine

WORKDIR /ihr_website

COPY . /ihr_website/

RUN npm install 

RUN export NODE_OPTIONS=--openssl-legacy-provider

EXPOSE 8080

CMD ["npm", "run", "serve"]