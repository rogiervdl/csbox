# .NET SDK als basis (bevat dotnet runtime + compiler)
FROM mcr.microsoft.com/dotnet/sdk:10.0

# Installeer Node.js (via NodeSource)
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Installeer npm dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Kopieer de rest van de app
COPY . .

# Kopieer vendor bestanden (Monaco + JSZip)
RUN npm run setup

# Render gebruikt poort via env variabele PORT
ENV PORT=3003
EXPOSE 3003

CMD ["node", "app.js"]
