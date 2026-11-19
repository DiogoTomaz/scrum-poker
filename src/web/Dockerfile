FROM node:22.17.1-alpine3.22 AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.28.0-alpine AS runtime
RUN command -v wget
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/scrum-poker-web/browser /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=12 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
