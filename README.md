# 🔐 Bot de Cifrado ADN para Discord

## 🌟 Descripción General

Este es un bot avanzado de **cifrado y descifrado para Discord**, basado en técnicas criptográficas inspiradas en secuencias de **ADN**. Permite a los usuarios enviar mensajes privados al bot para proteger o recuperar contenido mediante una **clave secreta**. Todo el proceso se realiza de forma **segura a través de mensajes directos (DMs)**.

### 🔬 El sistema utiliza:
- Generación de claves con **SHA-256**.
- Codificación **binaria UTF-8**, compatible con Unicode.
- Mapeo de bits a secuencias de ADN: `I`, `S`, `A`, `C`.
- Operaciones **XOR** y **desplazamiento posicional** para mayor seguridad.

---

## 🔧 Características Principales

### ✅ Funciones Disponibles
- 🔒 **Cifrar Mensajes**: Protege tu texto usando una clave.
- 🔓 **Descifrar Mensajes**: Recupera el mensaje original con la clave correcta.
- ❓ **Ayuda Interactiva**: Explicaciones paso a paso.
- 📱 **Menú Interactivo**: Botones para navegar entre funciones.
- 🔐 **Soporte Público/Privado**:
  - Comandos en servidores: `!cifrar`, `!descifrar`, `!menu`.
  - Procesos cifrado/descifrado a través de DMs.

---

## 🧩 Comandos Disponibles

| Comando | Función |
|--------|--------|
| `!hola`, `!hi`, `!hello` | Saludo inicial |
| `!start`, `!menu`, `!help` | Mostrar menú principal |
| `!cifrar`, `!encrypt`, `!c` | Iniciar proceso de cifrado |
| `!descifrar`, `!decrypt`, `!d` | Iniciar proceso de descifrado |
| `!info` | Información del bot |
| `cancelar` | Detener proceso actual |

---

## ⚙️ Requisitos del Sistema

- Node.js `v16.x` o superior  
- Paquetes:
  - [`discord.js`](https://www.npmjs.com/package/discord.js)
  - `crypto` (módulo nativo de Node.js)

---

## 📦 Instalación Paso a Paso

### 1. Clona el repositorio
```bash
git clone https://github.com/tu-usuario/nombre-del-repo.git
cd nombre-del-repo
```

### 2. Instala dependencias
```bash
npm install discord.js
```
> `crypto` ya está incluido con Node.js, no necesitas instalarlo.

### 3. Crea el archivo `config.json`
```json
{
  "token": "TU_TOKEN_DE_BOT",
  "prefix": "!",
  "channelId": "ID_DEL_CANAL_PUBLICO_OP"
}
```
> Si no usarás canal público, puedes omitir `"channelId"` o establecerlo en `null`.

#### Ejemplo:
```json
{
  "prefix": "|",
  "token": "TU_TOKEN_AQUÍ"
}
```

---

### 4. Crea tu bot en el [Discord Developer Portal](https://discord.com/developers/applications)
1. Crea una nueva aplicación.
2. En la pestaña **Bot**, añade un bot y copia el token.
3. En la pestaña **OAuth2**, selecciona los permisos:
   - `Guilds`
   - `Guild Messages`
   - `Message Content`
   - `Direct Messages`
4. Usa el enlace generado para invitar al bot a tu servidor.

---

## 🚀 Iniciar el Bot

Ejecuta el siguiente comando:

```bash
node index.js
```

Si ves en la consola:

```
✅ Bot conectado como NOMBRE_DEL_BOT
🛠️ Prefijo configurado: !
🌐 En X servidores
```

¡El bot está listo para usarse!

---

## 📁 Estructura del Proyecto

```
nombre-del-repo/
├── index.js          # Código principal
├── config.json       # Configuración del bot
└── README.md         # Este archivo
```

---

## 📁 Estructura del Código

### 📂 Archivos Principales
- `index.js`: Código completo del bot.
- `config.json`: Contiene el token, prefijo, y canal (opcional).

### 📦 Módulos Internos
- `DNAEncryptionDecryption`: Clase principal para cifrado/descifrado.
- `stringToBinary` / `binaryToString`: Conversión entre texto y binario.
- `passwordToHex`: Derivación de clave desde una contraseña.
- `getPermutations`: Generación de permutaciones para mapeo ADN.

---

## 🧪 Seguridad y Consideraciones

- 🔑 **La clave es obligatoria**: sin ella, no se puede descifrar el mensaje.
- 🚫 **Sin almacenamiento persistente**: el bot no guarda datos ni claves.
- 🔐 **Procesamiento en memoria**: todos los datos se eliminan después de cada operación.

---

## 📜 Licencia

Este proyecto está licenciado bajo [MIT License](LICENSE). Puedes usarlo, modificarlo o distribuirlo libremente con la debida atribución.

---

## 📣 ¿Cómo Contribuir?

Puedes contribuir agregando o mejorando:
- Historial seguro local.
- Manejo de múltiples usuarios simultáneamente.
- Exportación/importación de claves.
- Integraciones con APIs externas.

---

## 💬 Contacto

- 📧 Correo: johanjarata@gmail.com  
- 🌐 GitHub: [github.com/JohanJarata]

---

🎉 ¡Gracias por usar este bot de cifrado ADN para Discord!
