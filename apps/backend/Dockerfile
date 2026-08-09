FROM node:22

WORKDIR /app

COPY . .

RUN npm ci
RUN npm run build:packages
RUN npm run build --workspace=apps/backend

EXPOSE 3000

CMD ["npm", "start", "--workspace=apps/backend"]
