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

### 2. Instala Node.js y las dependencias necesarias

#### 🔽 Si aún **NO tienes Node.js ni npm instalados**:

1. Ve al sitio oficial: [https://nodejs.org](https://nodejs.org)
2. Descarga e instala la **versión recomendada para producción (LTS)**.
3. Verifica la instalación abriendo una terminal o consola y escribiendo:

```bash
node -v
npm -v
```

> Deberías ver las versiones de Node.js y npm. Por ejemplo:
> `v18.17.1` y `9.6.7`

#### 📦 Luego, instala las dependencias del proyecto:

```bash
npm install discord.js
```

> Nota: **No necesitas instalar `crypto`**, ya que es parte del núcleo de Node.js (viene incluido).

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

#### 🧱 Paso a paso detallado:

1. Entra a [Discord Developer Portal](https://discord.com/developers/applications) con tu cuenta de Discord.
2. Haz clic en **"New Application"** y coloca un nombre (ej. `BotCifradoADN`). Luego presiona "Create".
3. En el menú lateral izquierdo, ve a la sección **"Bot"**.
4. Haz clic en **"Add Bot"** y confirma con "Yes, do it!".
5. Opcionalmente, personaliza:
   - **Nombre del bot**
   - **Imagen de perfil (avatar)**

#### 🔐 Copia el Token del Bot
1. En la sección "Bot", haz clic en **"Reset Token"** (si es nuevo) y luego en **"Copy"**.
2. Guarda este token en tu archivo `config.json` en el campo `"token"`.

#### ⚙️ Habilita las Intents necesarias
Asegúrate de activar estas opciones en la sección **Privileged Gateway Intents**:
- ✅ PRESENCE INTENT *(opcional)*
- ✅ SERVER MEMBERS INTENT *(opcional)*
- ✅ MESSAGE CONTENT INTENT *(requerido para leer el contenido de los mensajes)*

#### 🔗 Configura los permisos e invita el bot
1. Ve a la sección **OAuth2 → URL Generator**.
2. Marca los siguientes scopes:
   - ✅ `bot`
3. En la sección **Bot Permissions**, selecciona:
   - ✅ `Send Messages`
   - ✅ `Read Message History`
   - ✅ `View Channels`
   - ✅ `Send Messages in Threads`
   - ✅ `Use Slash Commands`
   - ✅ `Read Messages/View Channels`
   - ✅ `Use Application Commands`
4. Copia la URL generada en la parte inferior y pégala en tu navegador.
5. Selecciona el servidor donde deseas agregar el bot y haz clic en **Autorizar**.

✅ ¡Tu bot ya estará dentro del servidor de Discord y listo para recibir comandos!

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
