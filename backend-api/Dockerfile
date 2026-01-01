FROM node:18-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund && \
    npm cache clean --force

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
