FROM node:22

WORKDIR /app

COPY ./package.json ./package-lock.json ./
RUN npm install && npm install -g nodemon

COPY . .

EXPOSE 3000

CMD ["nodemon", "--legacy-watch", "--inspec=0.0.0.0", "server.js"]