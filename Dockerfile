FROM mcr.microsoft.com/playwright:v1.41.0-jammy

WORKDIR /app

# WICHTIG: Verhindert, dass Playwright Browser nochmal herunterlädt
# (Spart Zeit und Speicherfehler)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
