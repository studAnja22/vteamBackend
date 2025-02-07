FROM node:20

WORKDIR /server

COPY package*.json ./

RUN npm install

RUN npm install -g nodemon

COPY . ./

EXPOSE 1337

CMD [ "node", "app.mjs" ]
