FROM node:22

WORKDIR /app

COPY ./package.json ./package-lock.json ./
RUN npm install && npm install -g nodemon && npm install compromise && npm install chalk

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]