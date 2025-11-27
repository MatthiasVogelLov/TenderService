# Wir nutzen das offizielle Playwright Image von Microsoft
# Das enthält bereits alle Browser und Abhängigkeiten!
FROM mcr.microsoft.com/playwright:v1.41.0-jammy

WORKDIR /app

# Kopiere package Dateien und installiere Node Module
COPY package.json ./
RUN npm install

# Kopiere den Rest des Codes
COPY . .

# Öffne Port 3000
EXPOSE 3000

# Starte den Server
CMD ["node", "server.js"]
