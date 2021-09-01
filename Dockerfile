# syntax=docker/dockerfile:1
FROM debian:jessie

RUN apt-get update
RUN apt-get install curl python make automake libtool g++ -y
RUN curl -fs https://raw.githubusercontent.com/mafintosh/node-install/master/install | sh
RUN node-install 16.8.0

#FROM node:16-alpine
#RUN apk update
#RUN apk add libtool automake gcc
#RUN apk add --no-cache libtool autoconf automake g++ make
WORKDIR /app
COPY . .
RUN npm i
CMD ["node", "dist/bin.js"]

