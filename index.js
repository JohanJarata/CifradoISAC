const crypto = require('crypto');

// === CONSTANTES ===
const BIT_PAIRS = ['00', '01', '10', '11'];
const DNA_BASES = ['I', 'S', 'A', 'C'];

// === FUNCIONES DE APOYO MEJORADAS ===
// Modificado para usar Buffer y manejar Unicode correctamente
function stringToBinary(text) {
    // Codificar la cadena en un Buffer utilizando UTF-8, luego convertir cada byte a su representación binaria de cadena.
    return Buffer.from(text, 'utf8')
        .toString('binary') // Esto dará una cadena en la que cada carácter es un byte
        .split('')
        .map(char => char.charCodeAt(0).toString(2).padStart(8, '0')) // Convertir cada byte char en binario de 8 bit
        .join('');
}

// Modificado para usar Buffer y manejar Unicode correctamente
function binaryToString(binary) {
    // Convert the binary string back to a Buffer
    const bufferBytes = [];
    for (let i = 0; i < binary.length; i += 8) {
        const byteString = binary.substr(i, 8);
        bufferBytes.push(parseInt(byteString, 2));
    }
    // Create a Buffer from the array of byte values and decode as UTF-8
    return Buffer.from(bufferBytes).toString('utf8');
}

function hexToBinary(hex) {
    return hex.split('').map(c =>
        parseInt(c, 16).toString(2).padStart(4, '0')
    ).join('');
}

function passwordToHex(password) {
    const hash = crypto.createHash('sha256');
    hash.update(password);
    return hash.digest('hex');
}

// === GENERACIÓN DE PERMUTACIONES ===
function getPermutations(arr) {
    const result = [];
    function permute(arr, memo = []) {
        if (arr.length === 0) result.push(memo);
        else {
            for (let i = 0; i < arr.length; i++) {
                const curr = arr.splice(i, 1);
                permute(arr.slice(), memo.concat(curr));
                arr.splice(i, 0, curr[0]);
            }
        }
    }
    permute(arr);
    return result;
}

// === CLASE PRINCIPAL: CIFRADO ADN ===
class DNAEncryptionDecryption {
    constructor(keyHex, block_size_chars = 16) {
        if (!keyHex || !/^[0-9a-fA-F]+$/.test(keyHex)) {
            throw new Error("La clave debe ser hexadecimal válida.");
        }
        this.keyBinary = hexToBinary(keyHex);
        this.blockSizeChars = block_size_chars;
        // The block size in bits should now be based on bytes (8 bits per byte)
        // instead of UTF-16 code units (16 bits per char)
        this.blockSizeBits = block_size_chars * 8; // Changed to 8 bits per byte
        this.totalSumAccumulator = 0;
        this.dnaMaps = this._generateDnaMaps();
        this.reverseDnaMaps = this._generateReverseDnaMaps();
    }

    _generateDnaMaps() {
        const permutations = getPermutations(DNA_BASES);
        return permutations.map(p => {
            const map = {};
            BIT_PAIRS.forEach((pair, i) => map[pair] = p[i]);
            return map;
        });
    }

    _generateReverseDnaMaps() {
        return this.dnaMaps.map(map => {
            const reverseMap = {};
            Object.entries(map).forEach(([k, v]) => reverseMap[v] = k);
            return reverseMap;
        });
    }

    _adaptKey(targetLength) {
        if (this.keyBinary.length === 0) throw new Error("La clave binaria no puede estar vacía.");
        let repeatedKey = this.keyBinary.repeat(Math.ceil(targetLength / this.keyBinary.length));
        return repeatedKey.slice(0, targetLength);
    }

    _xorBinStr(bin1, bin2) {
        const minLength = Math.min(bin1.length, bin2.length);
        bin1 = bin1.slice(0, minLength);
        bin2 = bin2.slice(0, minLength);
        return bin1.split('').map((b, i) => b === bin2[i] ? '0' : '1').join('');
    }

    _encodeDNA(binaryStr) {
        let dnaSeq = [];
        let currentMap = this.dnaMaps[0];
        for (let i = 0; i < binaryStr.length; i += 2) {
            const pair = binaryStr.substr(i, 2);
            dnaSeq.push(currentMap[pair] || 'A'); // Fallback to 'A' if pair not found, though should not happen with valid binary
        }
        return dnaSeq.join('');
    }

    _decodeDNA(dnaStr) {
        let binarySeq = [];
        let currentMap = this.reverseDnaMaps[0];
        for (let base of dnaStr) {
            const bitPair = currentMap[base];
            if (!bitPair) throw new Error("Caracter ADN desconocido: " + base);
            binarySeq.push(bitPair);
        }
        return binarySeq.join('');
    }

    _positionalModifyDNA(dnaStr, seed) {
        if (!dnaStr) return "";
        const shiftAmount = seed % dnaStr.length;
        return dnaStr.slice(shiftAmount) + dnaStr.slice(0, shiftAmount);
    }

    _reversePositionalModifyDNA(modifiedDnaStr, seed) {
        if (!modifiedDnaStr) return "";
        const shiftAmount = seed % modifiedDnaStr.length;
        const restorePoint = modifiedDnaStr.length - shiftAmount;
        return modifiedDnaStr.slice(restorePoint) + modifiedDnaStr.slice(0, restorePoint);
    }

    encrypt(plaintext) {
        let cipherText = "";

        // Convertir todo el texto a binario primero (ahora maneja Unicode)
        const fullBinary = stringToBinary(plaintext);

        // Generamos IV aleatorio (en binario)
        // Ensure IV generation is byte-aligned (blockSizeChars * 8 bits)
        const ivBinary = crypto.randomBytes(this.blockSizeChars)
            .toString('hex') // Convert to hex
            .split('')
            .map(c => parseInt(c, 16).toString(2).padStart(4, '0')) // Convert each hex char to 4-bit binary
            .join('');

        const ivDNA = this._encodeDNA(ivBinary);
        cipherText += ivDNA;

        const keyInitialSeed = parseInt(this.keyBinary.substr(0, 8), 2) >>> 0;
        const ivInteger = parseInt(ivBinary, 2) >>> 0;
        this.totalSumAccumulator = (ivInteger ^ keyInitialSeed) >>> 0;

        // Procesar todo el texto como un solo bloque para mantener la integridad
        const keyForBlock = this._adaptKey(fullBinary.length);
        const xorResult = this._xorBinStr(keyForBlock, fullBinary);
        const encodedDNA = this._encodeDNA(xorResult);
        const modifiedDNA = this._positionalModifyDNA(encodedDNA, keyInitialSeed);
        cipherText += modifiedDNA;

        return cipherText;
    }

    decrypt(ciphertextDNA) {
        if (!ciphertextDNA || ciphertextDNA.length === 0) throw new Error("Texto cifrado vacío.");

        // IV DNA length should be based on blockSizeChars * 4 (DNA bases per byte * 2 bits per base)
        const ivDNALength = this.blockSizeChars * 4; // 1 byte = 8 bits = 4 DNA bases
        if (ciphertextDNA.length < ivDNALength) throw new Error("Texto cifrado demasiado corto para contener el IV.");

        const ivDNA = ciphertextDNA.substr(0, ivDNALength);
        const cipherBlocks = ciphertextDNA.substr(ivDNALength);

        const ivBinary = this._decodeDNA(ivDNA);
        const ivInteger = parseInt(ivBinary, 2) >>> 0;
        const keyInitialSeed = parseInt(this.keyBinary.substr(0, 8), 2) >>> 0;
        this.totalSumAccumulator = (ivInteger ^ keyInitialSeed) >>> 0;

        const originalDNA = this._reversePositionalModifyDNA(cipherBlocks, keyInitialSeed);
        const binaryAfterDNA = this._decodeDNA(originalDNA);
        const keyForBlock = this._adaptKey(binaryAfterDNA.length);
        const originalBinary = this._xorBinStr(keyForBlock, binaryAfterDNA);
        const originalPlaintext = binaryToString(originalBinary);

        return originalPlaintext;
    }
}

// === FUNCIONES PÚBLICAS ===
function encrypt(key, text) {
    const keyHex = passwordToHex(key);
    const cipher = new DNAEncryptionDecryption(keyHex);
    return cipher.encrypt(text);
}

function decrypt(key, encryptedText) {
    const keyHex = passwordToHex(key);
    const decipher = new DNAEncryptionDecryption(keyHex);
    try {
        return decipher.decrypt(encryptedText);
    } catch (error) {
        console.error("[ERROR] No se pudo descifrar:", error.message);
        return "[ERROR] Mensaje corrupto o clave incorrecta";
    }
}


//---------------------------------------------
// codigo del bot
const { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

// Variables globales mejoradas
const prefix = config.prefix || '!';
const ongoingProcesses = new Map();

// Función para mostrar el menú principal
async function showMainMenu(message) {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('encrypt')
        .setLabel('🔒 Cifrar')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('decrypt')
        .setLabel('🔓 Descifrar')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('help')
        .setLabel('❓ Ayuda')
        .setStyle(ButtonStyle.Secondary),
    );

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🔐 Bot de Cifrado Avanzado')
    .setDescription('Selecciona una opción para continuar:')
    .addFields(
      { name: '🔒 Cifrar', value: 'Protege tu mensaje con cifrado seguro', inline: true },
      { name: '🔓 Descifrar', value: 'Recupera tu mensaje cifrado', inline: true },
      // { name: '📜 Historial', value: 'Ver tus últimos mensajes procesados', inline: true },
      { name: '❓ Ayuda', value: 'Muestra información sobre cómo usar el bot', inline: true }
    )
    .setFooter({ text: `Prefijo: ${prefix} | También puedes usar comandos como ${prefix}cifrar, ${prefix}descifrar` })
    .setThumbnail(client.user.displayAvatarURL());

  await message.channel.send({
    embeds: [embed],
    components: [row]
  });
}

// Función para mostrar ayuda
async function showHelp(message) {
  const helpEmbed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('📚 Ayuda del Bot de Cifrado')
    .setDescription('Cómo usar este bot:')
    .addFields(
      { name: `${prefix}cifrar / ${prefix}encrypt`, value: 'Inicia el proceso para cifrar un mensaje' },
      { name: `${prefix}descifrar / ${prefix}decrypt`, value: 'Inicia el proceso para descifrar un mensaje' },
      { name: `${prefix}menu`, value: 'Muestra el menú principal con botones interactivos' },
      { name: 'Proceso de cifrado', value: '1. El bot te pedirá una clave secreta\n2. Luego el texto a cifrar\n3. Finalmente recibirás tu mensaje cifrado' },
      { name: 'Importante', value: '🔐 **Guarda tu clave en un lugar seguro** - Sin ella no podrás descifrar los mensajes' }
    )
    .setFooter({ text: 'Bot desarrollado con ❤️ por la comunidad' });

  await message.channel.send({ embeds: [helpEmbed] });
}

// Procesos interactivos
async function handleEncryptionProcess(user, message) {
  try {
    ongoingProcesses.set(user.id, { 
      stage: 'waitingForKeyCifrar',
      type: 'encrypt'
    });
    
    const keyRequestEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🔒 Proceso de Cifrado - Paso 1/2')
      .setDescription('Por favor, introduce tu **clave secreta**:')
      .addFields(
        { name: 'Requisitos:', value: '• Mínimo 6 caracteres\n• Recomendado usar combinación de letras y números' },
        { name: 'Importante:', value: '⚠ **No compartas esta clave** con nadie\n⚠ Sin la clave correcta no podrás descifrar el mensaje' }
      )
      .setFooter({ text: 'Escribe "cancelar" en cualquier momento para detener el proceso' });
    
    await user.send({ embeds: [keyRequestEmbed] });
    await message.channel.send(`📩 ${user}, revisa tus mensajes privados para continuar con el cifrado.`);
  } catch (error) {
    console.error('Error en handleEncryptionProcess:', error);
    ongoingProcesses.delete(user.id);
    await message.channel.send('❌ No pude enviarte un mensaje privado. ¿Tienes los DMs habilitados?');
  }
}

async function handleDecryptionProcess(user, message) {
  try {
    ongoingProcesses.set(user.id, {
      stage: 'waitingForKeyDescifrar',
      type: 'decrypt'
    });
    
    const keyRequestEmbed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('🔓 Proceso de Descifrado - Paso 1/2')
      .setDescription('Por favor, introduce la **clave secreta** que usaste para cifrar:')
      .addFields(
        { name: 'Nota:', value: 'Debes usar exactamente la misma clave que usaste al cifrar el mensaje' },
        { name: '¿Problemas?', value: 'Si no recuerdas la clave, lamentablemente no podrás recuperar el mensaje original' }
      )
      .setFooter({ text: 'Escribe "cancelar" en cualquier momento para detener el proceso' });
    
    await user.send({ embeds: [keyRequestEmbed] });
    await message.channel.send(`📩 ${user}, revisa tus mensajes privados para continuar con el descifrado.`);
  } catch (error) {
    console.error('Error en handleDecryptionProcess:', error);
    ongoingProcesses.delete(user.id);
    await message.channel.send('❌ No pude enviarte un mensaje privado. ¿Tienes los DMs habilitados?');
  }
}

// Evento ready mejorado
client.on("ready", () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  console.log(`🛠️ Prefijo configurado: ${prefix}`);
  console.log(`🌐 En ${client.guilds.cache.size} servidores`);
  
  // Establecer actividad del bot
  client.user.setActivity({
    name: `${prefix}help | Cifrado seguro`,
    type: 'PLAYING'
  });
});

// Manejo de interacciones de botones
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  
  await interaction.deferReply({ ephemeral: true });
  
  switch (interaction.customId) {
    case 'encrypt':
      await handleEncryptionProcess(interaction.user, interaction);
      await interaction.editReply({ content: '🔒 Iniciando proceso de cifrado... Revisa tus mensajes privados.', ephemeral: true });
      break;
    case 'decrypt':
      await handleDecryptionProcess(interaction.user, interaction);
      await interaction.editReply({ content: '🔓 Iniciando proceso de descifrado... Revisa tus mensajes privados.', ephemeral: true });
      break;
    case 'help':
      await showHelp(interaction);
      await interaction.deleteReply();
      break;
  }
});

// Manejo de mensajes
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Manejo de cancelación
  if (message.content.toLowerCase() === 'cancelar' && ongoingProcesses.has(message.author.id)) {
    ongoingProcesses.delete(message.author.id);
    return await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Proceso cancelado correctamente')
      ]
    });
  }

  // Procesar mensajes privados
  if (message.channel.type === ChannelType.DM) {
    const userId = message.author.id;
    
    if (!ongoingProcesses.has(userId)) return;
    
    const process = ongoingProcesses.get(userId);

    try {
      switch (process.stage) {
        case 'waitingForKeyCifrar':
          if (!message.content.trim() || message.content.toLowerCase() === 'cancelar') {
            await message.channel.send("❌ Proceso de cifrado cancelado.");
            return ongoingProcesses.delete(userId);
          }
          
          if (message.content.length < 6) {
            await message.channel.send("⚠ La clave debe tener al menos 6 caracteres. Por favor, introduce una clave más segura:");
            return;
          }
          
          process.key = message.content;
          await message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('🔒 Proceso de Cifrado - Paso 2/2')
                .setDescription('Ahora, por favor, introduce el texto que deseas cifrar:')
                .setFooter({ text: 'Este mensaje será cifrado con la clave que proporcionaste' })
            ]
          });
          process.stage = 'waitingForTextCifrar';
          break;

        case 'waitingForTextCifrar':
          if (!message.content.trim() || message.content.toLowerCase() === 'cancelar') {
            await message.channel.send("❌ Proceso de cifrado cancelado.");
            return ongoingProcesses.delete(userId);
          }
          
          process.text = message.content;
          const encryptedText = encrypt(process.key, process.text);
          
          
          // Mensaje de éxito
          const successEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Cifrado Completado')
            .setDescription('Tu mensaje ha sido cifrado correctamente:')
            .addFields(
              { name: 'Texto cifrado', value: `\`\`\`\n${encryptedText}\n\`\`\`` },
              { name: 'Clave usada', value: `||${process.key}||`, inline: true },
              { name: 'Longitud', value: `${encryptedText.length} caracteres`, inline: true }
            )
            .setFooter({ text: 'Guarda esta información en un lugar seguro' });
          
          await message.channel.send({ embeds: [successEmbed] });
          
          // Enviar a canal público configurado si existe
          if (config.channelId) {
            const targetChannel = await client.channels.fetch(config.channelId).catch(() => null);
            
            if (targetChannel?.type === ChannelType.GuildText) {
              await targetChannel.send({
                embeds: [
                  new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('📩 Nuevo Mensaje Cifrado')
                    .setDescription(`De: ${message.author.tag}`)
                    .addFields(
                      { name: 'Texto Cifrado', value: `\`\`\`\n${encryptedText}\n\`\`\`` },
                      { name: 'Longitud', value: `${encryptedText.length} caracteres`, inline: true },
                      { name: 'Hora', value: new Date().toLocaleTimeString(), inline: true }
                    )
                    .setFooter({ text: `ID de usuario: ${message.author.id}` })
                ]
              });
            }
          }
          
          ongoingProcesses.delete(userId);
          break;

        case 'waitingForKeyDescifrar':
          if (!message.content.trim() || message.content.toLowerCase() === 'cancelar') {
            await message.channel.send("❌ Proceso de descifrado cancelado.");
            return ongoingProcesses.delete(userId);
          }
          
          process.key = message.content;
          await message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🔓 Proceso de Descifrado - Paso 2/2')
                .setDescription('Ahora, por favor, introduce el texto cifrado que deseas descifrar:')
                .setFooter({ text: 'Asegúrate de que es exactamente el mismo texto cifrado' })
            ]
          });
          process.stage = 'waitingForTextDescifrar';
          break;

        case 'waitingForTextDescifrar':
          if (!message.content.trim() || message.content.toLowerCase() === 'cancelar') {
            await message.channel.send("❌ Proceso de descifrado cancelado.");
            return ongoingProcesses.delete(userId);
          }
          
          process.text = message.content;
          const decryptedText = decrypt(process.key, process.text);
          
          
          await message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🔓 Descifrado Completado')
                .setDescription('Tu mensaje ha sido descifrado correctamente:')
                .addFields(
                  { name: 'Texto original', value: `\`\`\`\n${decryptedText}\n\`\`\`` },
                  { name: 'Clave usada', value: `||${process.key}||`, inline: true },
                  { name: 'Longitud', value: `${decryptedText.length} caracteres`, inline: true }
                )
                .setFooter({ text: 'Este mensaje solo es visible para ti' })
            ]
          });
          
          ongoingProcesses.delete(userId);
          break;
      }
    } catch (error) {
      console.error("Error en procesamiento:", error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Error en el proceso')
        .setDescription('Ocurrió un error al procesar tu solicitud:')
        .addFields(
          { name: 'Posible causa', value: '• Clave incorrecta\n• Texto cifrado corrupto\n• Error del sistema' }
        )
        .setFooter({ text: 'Por favor, intenta nuevamente' });
      
      await message.channel.send({ embeds: [errorEmbed] });
      ongoingProcesses.delete(userId);
    }
    return;
  }

  // Comandos en canales públicos
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  try {
    switch (command) {
      case "hola":
      case "hi":
      case "hello":
        await message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0x5865F2)
              .setDescription(`👋 ¡Hola ${message.author}! Usa \`${prefix}menu\` para ver todas mis funciones.`)
          ]
        });
        break;

      case "start":
      case "menu":
      case "help":
        await showMainMenu(message);
        break;

      case "cifrar":
      case "encrypt":
      case "c":
        await handleEncryptionProcess(message.author, message);
        break;

      case "descifrar":
      case "decrypt":
      case "d":
        await handleDecryptionProcess(message.author, message);
        break;

      case "info":
        await message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0x5865F2)
              .setTitle('ℹ Información del Bot')
              .setDescription('Bot de cifrado seguro para Discord')
              .addFields(
                { name: 'Prefijo', value: prefix, inline: true },
                { name: 'Versión', value: '2.0', inline: true },
                { name: 'Desarrollador', value: 'TuNombre', inline: true },
                { name: 'Comandos', value: `Usa \`${prefix}help\` para ver todos los comandos` }
              )
              .setFooter({ text: `Solicitado por ${message.author.tag}` })
              .setTimestamp()
          ]
        });
        break;

      default:
        await message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFFA500)
              .setDescription(`❓ Comando no reconocido. Usa \`${prefix}help\` para ver la lista de comandos disponibles.`)
          ]
        });
    }
  } catch (error) {
    console.error("Error en comando:", error);
    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('❌ Error en el comando')
          .setDescription('Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.')
      ]
    });
  }
});

client.login(config.token);

