FROM node:15.11-alpine3.10
WORKDIR /app
COPY ./server/package.json /app
RUN npm install
COPY ./server /app
CMD node server.js