FROM node:lts

WORKDIR /app

COPY package*.json ./

RUN npm install -g @nestjs/cli
RUN npm install --legacy-peer-deps

COPY . .

RUN nest build


CMD [ "npm", "run", "start:dev" ]