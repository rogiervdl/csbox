# .NET SDK als basis (bevat dotnet runtime + compiler)
FROM mcr.microsoft.com/dotnet/sdk:10.0

# Installeer Node.js
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Gebruiker zonder rechten voor de code van studenten
RUN groupadd --system --gid 10001 csboxrun && \
    useradd --system --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin csboxrun

WORKDIR /app

# Installeer npm dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Kopieer de rest van de app
COPY . .

# Kopieer vendor bestanden (Monaco + marked + Prism)
RUN npm run setup

# Publiceer de C# runner (NuGet restore + compilatie tijdens image build)
RUN dotnet publish runner/runner.csproj -c Release -o runner-bin

# De app is niet leesbaar voor de gebruiker van de studentencode
RUN chmod -R o-rwx /app

# Studentenprogramma's draaien als die gebruiker (zie buildSandboxSpawnOptions in app.js)
ENV RUN_UID=10001
ENV RUN_GID=10001

ENV PORT=3003
EXPOSE 3003

CMD ["node", "app.js"]
