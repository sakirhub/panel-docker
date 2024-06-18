FROM node:lts

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps
RUN ls -al /app && npm install --legacy-peer-deps && ls -al /app/node_modules

COPY . .

RUN npm run build

CMD ["npm", "run", "start:dev"]
