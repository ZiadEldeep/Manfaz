FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

EXPOSE 3003

CMD ["sh", "-c", "npx prisma generate && npm start"]
