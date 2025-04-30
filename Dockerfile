FROM node:20-alpine as build

WORKDIR /app

# 서브모듈 초기화 및 환경 변수 파일 복사
RUN git submodule update --init --recursive
COPY package*.json ./
RUN npm ci

# 서브모듈의 환경 변수 파일 복사
COPY techlog-env/front/env-common.env .env

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
