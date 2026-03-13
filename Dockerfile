# .NET SDK als basis (bevat dotnet runtime + compiler)
FROM mcr.microsoft.com/dotnet/sdk:10.0

# Installeer Node.js
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

# Publiceer de C# runner (NuGet restore + compilatie tijdens image build)
RUN dotnet publish runner/runner.csproj -c Release -o runner-bin

ENV PORT=3003
EXPOSE 3003

CMD ["node", "app.js"]
