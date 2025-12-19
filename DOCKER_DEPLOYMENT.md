# 🐳 Guía de Despliegue con Docker

## 📋 Requisitos Previos

- Docker Desktop instalado en tu PC
- PC y celular en la misma red WiFi
- Conocer la IP de tu PC (usa `ipconfig` en CMD)

---

## 🚀 Paso 1: Construir y Ejecutar con Docker

Abre PowerShell o CMD en la carpeta del proyecto y ejecuta:

```powershell
docker compose up -d --build
```

**¿Qué hace este comando?**
- `docker compose up`: Inicia los servicios
- `-d`: Modo detached (en segundo plano)
- `--build`: Reconstruye la imagen con los últimos cambios

---

## ⏱️ Paso 2: Esperar a que Compile

La primera vez tardará **5-10 minutos** porque:
1. Descarga la imagen de Node.js
2. Instala todas las dependencias (`npm install`)
3. Compila la aplicación Angular

**Ver el progreso:**
```powershell
docker compose logs -f
```

**Espera a ver este mensaje:**
```
✔ Browser application bundle generation complete.
** Angular Live Development Server is listening on 0.0.0.0:4200 **
```

Presiona `Ctrl+C` para salir de los logs (el contenedor seguirá corriendo).

---

## 🌐 Paso 3: Verificar la IP de tu PC

En PowerShell/CMD:
```powershell
ipconfig
```

Busca la sección **"Adaptador de LAN inalámbrica Wi-Fi"** o **"Ethernet"**:
```
Dirección IPv4. . . . . . . . . : 192.168.1.22
```

**Anota esta IP** (ejemplo: `192.168.1.22`)

---

## 📱 Paso 4: Probar desde el Celular

### A. Abrir el Escáner Remoto

En tu celular, abre Chrome y ve a:
```
http://TU_IP_AQUI:4200/scanner-remote
```

**Ejemplo:**
```
http://192.168.1.22:4200/scanner-remote
```

### B. Dar Permisos de Cámara

1. Chrome pedirá permiso para usar la cámara
2. Presiona **"Permitir"**
3. La cámara se activará

### C. Si la Cámara NO Funciona (Solo HTTP)

**Problema:** Chrome bloquea cámaras en HTTP por seguridad

**Solución:**
1. En el celular, abre una nueva pestaña: `chrome://flags`
2. Busca: **"Insecure origins treated as secure"**
3. Actívalo (Enabled)
4. En el campo que aparece, escribe: `http://192.168.1.22:4200`
5. Presiona **"Relaunch"** para reiniciar Chrome
6. Vuelve a abrir: `http://192.168.1.22:4200/scanner-remote`

---

## 💻 Paso 5: Abrir el POS en la PC

En tu navegador de PC:
```
http://localhost:4200/cobrar
```

O también puedes usar:
```
http://192.168.1.22:4200/cobrar
```

---

## 🎯 Paso 6: Probar el Sistema

1. **En el celular**: Apunta la cámara a un código de barras
2. **Verás**: Confirmación verde en el celular
3. **En el POS**: El producto aparece automáticamente en el carrito

---

## 🛠️ Comandos Útiles de Docker

### Ver logs en tiempo real
```powershell
docker compose logs -f
```

### Detener el contenedor
```powershell
docker compose down
```

### Reiniciar el contenedor
```powershell
docker compose restart
```

### Ver estado del contenedor
```powershell
docker compose ps
```

### Reconstruir después de cambios en el código
```powershell
docker compose up -d --build
```

### Entrar al contenedor (para debugging)
```powershell
docker exec -it mi-app-angular sh
```

---

## 🔍 Solución de Problemas

### ❌ Error: "Cannot start service angular-app: Ports are not available"

**Causa:** El puerto 4200 ya está en uso

**Solución:**
```powershell
# Ver qué está usando el puerto 4200
netstat -ano | findstr :4200

# Matar el proceso (reemplaza PID con el número que viste)
taskkill /PID <PID> /F

# O cambia el puerto en docker-compose.yml:
ports:
  - "4201:4200"  # Usa 4201 en lugar de 4200
```

### ❌ No puedo acceder desde el celular

**Verificar:**
1. ✅ PC y celular en la misma WiFi
2. ✅ Firewall de Windows permite el puerto 4200
3. ✅ La IP es correcta (usa `ipconfig`)

**Solución Firewall:**
```powershell
# Ejecutar como Administrador
New-NetFirewallRule -DisplayName "Angular Dev Server" -Direction Inbound -LocalPort 4200 -Protocol TCP -Action Allow
```

### ❌ El contenedor se detiene solo

**Ver logs de error:**
```powershell
docker compose logs
```

**Causas comunes:**
- Error de compilación (revisa los logs)
- Falta de memoria (aumenta RAM de Docker Desktop)

---

## 📊 Arquitectura del Sistema

```
┌─────────────────┐         WiFi         ┌──────────────────┐
│   PC (Docker)   │◄────────────────────►│     Celular      │
│                 │                       │                  │
│  POS (Cobrar)   │                       │ Escáner Remoto   │
│  localhost:4200 │                       │  192.168.1.22    │
│                 │                       │                  │
│  ┌───────────┐  │   localStorage Sync   │  ┌────────────┐  │
│  │  Carrito  │◄─┼───────────────────────┼─►│   Cámara   │  │
│  └───────────┘  │                       │  └────────────┘  │
└─────────────────┘                       └──────────────────┘
```

---

## 🎉 ¡Listo para Usar!

Una vez que veas la pantalla del escáner en tu celular y el POS en tu PC, ya puedes empezar a escanear productos.

**Flujo de trabajo:**
1. Cliente trae productos
2. Escaneas con el celular
3. Productos aparecen en el POS
4. Cobras normalmente

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `docker compose logs -f`
2. Verifica la red: `ping 192.168.1.22` desde el celular
3. Reinicia Docker: `docker compose restart`
4. Reconstruye: `docker compose up -d --build`
