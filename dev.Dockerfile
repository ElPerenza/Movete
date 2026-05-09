FROM node:24-alpine

RUN apk add git

WORKDIR /movete

COPY ./package.json ./package-lock.json ./
COPY ./server/package.json ./server/
COPY ./ui/package.json ./ui/

RUN npm install

COPY ./ ./