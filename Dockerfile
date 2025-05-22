FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies
RUN npm install

COPY . .

RUN apk add --no-cache bash
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /usr/local/bin/wait-for-it.sh
RUN chmod +x /usr/local/bin/wait-for-it.sh

EXPOSE 3000

CMD ["wait-for-it.sh", "db:5432", "--", "node", "dist/index.js"]