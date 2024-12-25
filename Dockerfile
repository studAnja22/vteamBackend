FROM node:20

WORKDIR /server

COPY package*.json ./

RUN npm install

RUN npm install -g nodemon

COPY . ./

CMD [ "node", "app.mjs" ]
