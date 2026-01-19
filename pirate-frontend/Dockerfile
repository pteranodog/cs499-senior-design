from node:22-alpine

WORKDIR /app/

COPY ./containers/pirate-frontend/package.json /app
RUN npm install

COPY ./containers/pirate-frontend/public/ /app/public
COPY ./containers/pirate-frontend/src/ /app/src

CMD ["npm", "start"]
EXPOSE 3000
