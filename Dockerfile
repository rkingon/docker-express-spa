FROM node:10.15.3

ENV PORT 5000

WORKDIR /home/node

RUN npm install -g yarn

COPY yarn.lock package.json ./

RUN yarn install

COPY . ./

CMD ["bash", "-c", "yarn start"]
