FROM node:lts

WORKDIR /app

COPY package*.json ./

RUN npm install -g @nestjs/cli
RUN npm install --legacy-peer-deps

COPY . .

RUN nest build

EXPOSE 8000

CMD [ "npm", "run", "start:dev" ]