# 📱 Escáner Remoto - Guía de Uso

## ¿Qué es?

El **Escáner Remoto** permite usar tu celular o tablet como un escáner de códigos de barras inalámbrico para el POS. Los productos se agregan automáticamente al carrito en la PC.

## 🚀 Cómo Usarlo

### Paso 1: Iniciar la Aplicación

En tu PC, ejecuta:
```bash
npm start
```

O con Docker:
```bash
docker compose up -d --build
```

### Paso 2: Abrir el POS en la PC

En tu navegador de PC, abre:
```
http://localhost:4200/cobrar
```

### Paso 3: Abrir el Escáner en el Celular

En tu celular/tablet (conectado a la misma red WiFi), abre:
```
http://192.168.1.22:4200/scanner-remote
```

**Nota:** Reemplaza `192.168.1.22` con la IP de tu PC. Para encontrarla:
- Windows: `ipconfig` en CMD
- Mac/Linux: `ifconfig` en Terminal

### Paso 4: Dar Permisos de Cámara

1. El navegador pedirá permiso para usar la cámara
2. Presiona **"Permitir"**
3. La cámara se activará automáticamente

### Paso 5: Escanear

1. Apunta la cámara del celular al código de barras
2. Cuando lo detecte, verás una confirmación verde
3. El producto aparecerá **automáticamente** en el carrito del POS

## 📊 Características

✅ **Sincronización en Tiempo Real**: Los escaneos aparecen instantáneamente en el POS
✅ **Contador de Escaneos**: Ve cuántos productos has escaneado
✅ **Feedback Visual**: Confirmación verde al escanear exitosamente
✅ **Vibración**: El celular vibra al escanear (si está disponible)
✅ **Selección de Cámara**: Si tienes múltiples cámaras, puedes elegir cuál usar
✅ **Cámara Trasera Automática**: En móviles, selecciona la cámara trasera por defecto

## 🔧 Solución de Problemas

### La cámara no funciona en el celular

**Problema:** Chrome bloquea la cámara en conexiones HTTP (no seguras)

**Solución:**
1. En el celular, abre Chrome y ve a: `chrome://flags`
2. Busca: **"Insecure origins treated as secure"**
3. Actívalo (Enabled)
4. Agrega tu IP: `http://192.168.1.22:4200`
5. Reinicia Chrome

### Los escaneos no aparecen en el POS

**Verificar:**
1. ✅ Ambos dispositivos están en la misma red WiFi
2. ✅ La PC tiene el POS abierto en `/cobrar`
3. ✅ El celular tiene el escáner abierto en `/scanner-remote`
4. ✅ Ambos navegadores tienen localStorage habilitado

**Solución rápida:**
- Recarga ambas páginas (PC y celular)
- Escanea de nuevo

### El código se escanea pero no encuentra el producto

**Causa:** El PLU no existe en la base de datos

**Solución:**
- Verifica que el producto esté registrado con ese PLU
- Prueba buscarlo manualmente en el POS

## 💡 Consejos de Uso

1. **Iluminación**: Asegúrate de tener buena luz para escanear
2. **Distancia**: Mantén el celular a 10-20cm del código
3. **Estabilidad**: Mantén el celular quieto al escanear
4. **Limpieza**: Limpia la cámara si no detecta bien los códigos

## 🎯 Flujo de Trabajo Recomendado

1. **Empleado en caja**: Tiene la PC con el POS abierto
2. **Empleado escaneando**: Tiene el celular con el escáner remoto
3. **Cliente trae productos** → Escaneas con el celular → Aparecen en el POS
4. **Cobrar**: El empleado en caja procesa el pago normalmente

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Chrome (Android/iOS)
- ✅ Safari (iOS)
- ✅ Edge (Android)
- ✅ Firefox (Android)

### Dispositivos Probados
- ✅ iPhone (iOS 12+)
- ✅ Android (versión 8+)
- ✅ Tablets Android
- ✅ iPad

## 🔒 Seguridad

- Los datos se sincronizan solo en la red local
- No se envía información a internet
- Los códigos se borran automáticamente después de 10 segundos
- Cada dispositivo tiene un ID único para evitar duplicados

## 🆘 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica los logs en la terminal donde corre `npm start`
3. Reinicia ambos dispositivos
4. Verifica la conexión WiFi

---

**¡Listo para escanear! 🎉**
