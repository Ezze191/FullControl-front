# Dockerfile para desarrollo con hot-reload
FROM node:20-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache bash

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar Angular CLI globalmente y dependencias
RUN npm install -g @angular/cli@17.3.0 && \
    npm ci

# Copiar el código fuente
COPY . .

# Exponer el puerto de desarrollo
EXPOSE 4200

# Comando para iniciar el servidor de desarrollo con hot-reload
CMD ["ng", "serve", "--host", "0.0.0.0", "--poll", "2000", "--disable-host-check"]