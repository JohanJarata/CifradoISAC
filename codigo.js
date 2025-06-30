const crypto = require('crypto');

// === CONSTANTES ===
const BIT_PAIRS = ['00', '01', '10', '11'];
const DNA_BASES = ['I', 'S', 'A', 'C'];

// === FUNCIONES DE APOYO MEJORADAS ===
// Modificado para usar Buffer y manejar Unicode correctamente
function stringToBinary(text) {
    // Codificar la cadena en un Buffer utilizando UTF-8, luego convertir cada byte a su representación binaria de cadena.
    const buffer = Buffer.from(text, 'utf8');
    const binaryString = buffer
        .toString('binary') // Esto dará una cadena en la que cada carácter es un byte
        .split('')
        .map(char => char.charCodeAt(0).toString(2).padStart(8, '0')) // Convertir cada byte char en binario de 8 bit
        .join('');
    console.log(`  string To Binary: '${text}' -> '${binaryString}'`);
    return binaryString;
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
    const text = Buffer.from(bufferBytes).toString('utf8');
    console.log(`binaryToString: '${binary}'`);
    return text;
}

function hexToBinary(hex) {
    const binary = hex.split('').map(c =>
        parseInt(c, 16).toString(2).padStart(4, '0')
    ).join('');
    console.log(`hex To Binary (clave): '${hex}' -> '${binary}'`);
    return binary;
}

function passwordToHex(password) {
    const hash = crypto.createHash('sha256');
    hash.update(password);
    const hex = hash.digest('hex');
    console.log(`password To Hex: '${password}' -> '${hex}'`);
    return hex;
}

// === GENERADOR DE NÚMEROS PSEUDOALEATORIOS (LCG) ===
// Implementación de un Generador Congruencial Lineal (LCG) para pseudoaleatoriedad determinística.
// Necesario para que las permutaciones sean reproducibles en el descifrado.
function createLCG(initialSeed) {
    // Asegura que la semilla sea un entero positivo y no cero.
    let currentSeed = Math.abs(Math.floor(initialSeed || 1));
    if (currentSeed === 0) currentSeed = 1; // La semilla no puede ser cero para LCG

    // Parámetros comunes para LCG (similar a la función rand() de glibc)
    const a = 1103515245;
    const c = 12345;
    const m = Math.pow(2, 31); // Módulo (2^31)

    return function() {
        currentSeed = (a * currentSeed + c) % m;
        return currentSeed;
    };
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
        this.blockSizeBits = block_size_chars * 8;
        this.dnaMaps = this._generateDnaMaps();
        this.reverseDnaMaps = this._generateReverseDnaMaps();
        //console.log(`  Tamaño de bloque (bytes): ${this.blockSizeChars}`);
        console.log(`  Clave Binaria (desde Hex): ${this.keyBinary}`);

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
        console.log(`  Clave Binaria Original: ${this.keyBinary}`);
        console.log(`  Longitud deseada: ${targetLength}`);
        if (this.keyBinary.length === 0) throw new Error("La clave binaria no puede estar vacía.");
        let repeatedKey = this.keyBinary.repeat(Math.ceil(targetLength / this.keyBinary.length));
        const adaptedKey = repeatedKey.slice(0, targetLength);
        console.log(`  Clave Adaptada: ${adaptedKey}`);
        return adaptedKey;
    }

    _xorBinStr(bin1, bin2) {
        console.log(`  Binario clave : ${bin1}`);
        console.log(`  Binario texto : ${bin2}`);
        const minLength = Math.min(bin1.length, bin2.length);
        bin1 = bin1.slice(0, minLength);
        bin2 = bin2.slice(0, minLength);
        const result = bin1.split('').map((b, i) => b === bin2[i] ? '0' : '1').join('');
        console.log(`  Resultado XOR : ${result}`);
        //console.log("------------------");
        return result;
    }

    _encodeDNA(binaryStr) {
        let dnaSeq = [];
        let currentMap = this.dnaMaps[0]; // Usando el primer mapa fijo
        for (let i = 0; i < binaryStr.length; i += 2) {
            const pair = binaryStr.substr(i, 2);
            const dnaBase = currentMap[pair] || 'A';
            dnaSeq.push(dnaBase);
        }
        const result = dnaSeq.join('');
        //console.log(`  Resultado ADN codificado: ${result}`);
        //console.log("------------------");
        return result;
    }

    _decodeDNA(dnaStr) {
        console.log(`  Cadena ADN de entrada: ${dnaStr}`);
        let binarySeq = [];
        let currentMap = this.reverseDnaMaps[0]; // Usando el primer mapa inverso fijo
        for (let base of dnaStr) {
            const bitPair = currentMap[base];
            if (!bitPair) {
                console.error(`  Error: Caracter ADN desconocido en _decodeDNA: ${base}`);
                throw new Error("Caracter ADN desconocido: " + base);
            }
            binarySeq.push(bitPair);
        }
        const result = binarySeq.join('');
        console.log(`  Resultado Binario decodificado: ${result}`);
        //console.log("------------------");
        return result;
    }

    // Helper para intercambiar caracteres en un string (ya que los strings son inmutables)
    _swapChars(str, idx1, idx2) {
        const arr = str.split('');
        const temp = arr[idx1];
        arr[idx1] = arr[idx2];
        arr[idx2] = temp;
        return arr.join('');
    }

    // Función modificada para aplicar una permutación "aleatoria" (determinística)
    _positionalModifyDNA(dnaStr, seed) {
        console.log(`  Cadena ADN original: ${dnaStr}`);
        console.log(`  Semilla de permutación: ${seed}`);
        if (!dnaStr) {
            console.log("  Cadena ADN vacía, no se aplica modificación.");
            return "";
        }

        let modified = dnaStr;
        const getNextPRN = createLCG(seed); // Inicializa el PRNG con la semilla
        // Número de intercambios: dos veces la longitud de la cadena para mayor complejidad
        const numSwaps = dnaStr.length * 2;

        console.log(`  Realizando ${numSwaps} intercambios basados en la semilla.`);

        for (let i = 0; i < numSwaps; i++) {
            const idx1 = getNextPRN() % modified.length; // Obtiene índice aleatorio 1
            const idx2 = getNextPRN() % modified.length; // Obtiene índice aleatorio 2
            modified = this._swapChars(modified, idx1, idx2); // Realiza el intercambio
        }
        console.log(`  ADN modificado posicionalmente (permutado): ${modified}`);
        return modified;
    }

    // Función modificada para revertir la permutación "aleatoria"
    _reversePositionalModifyDNA(modifiedDnaStr, seed) {
        console.log(`  Cadena ADN modificada de entrada: ${modifiedDnaStr}`);
        console.log(`  Semilla de permutación (para revertir): ${seed}`);
        if (!modifiedDnaStr) {
            console.log("  Cadena ADN modificada vacía, no se revierte.");
            return "";
        }

        let original = modifiedDnaStr;
        const getNextPRN = createLCG(seed); // Inicializa el PRNG con la misma semilla
        const numSwaps = modifiedDnaStr.length * 2; // Mismo número de intercambios que en el cifrado

        // Regenera la secuencia de los pares de índices intercambiados
        // en el orden en que fueron generados durante el cifrado.
        const swapLog = [];
        for (let i = 0; i < numSwaps; i++) {
            const idx1 = getNextPRN() % original.length;
            const idx2 = getNextPRN() % original.length;
            swapLog.push([idx1, idx2]);
        }

        // Aplica los intercambios en orden inverso para revertir la permutación.
        console.log(`  Revirtiendo ${numSwaps} intercambios en orden inverso.`);
        for (let i = numSwaps - 1; i >= 0; i--) {
            const [idx1, idx2] = swapLog[i];
            original = this._swapChars(original, idx1, idx2);
        }
        console.log(`  ADN revertido posicionalmente: ${original}`);
        //console.log("---------------------------------");
        return original;
    }

    encrypt(plaintext) {
        let cipherText = "";

        console.log("\n--- PASO 1: Convertir Mensaje a Binario ---");
        const fullBinary = stringToBinary(plaintext);
        console.log("\n--- PASO 2: Generar y Procesar IV (Vector de Inicialización) ---");
        // Generar IV aleatorio (en binario)
        const ivBytes = crypto.randomBytes(this.blockSizeChars);
        const ivHex = ivBytes.toString('hex');
        console.log(`  IV aleatorio (Bytes Hex): ${ivHex}`);
        const ivBinary = hexToBinary(ivHex);

        const ivDNA = this._encodeDNA(ivBinary);
        //console.log(`  IV codificado en ADN: ${ivDNA}`);
        cipherText += ivDNA;
        console.log(`  Texto cifrado IV : ${cipherText}`);

        console.log("\n--- PASO 3: Calcular Semilla de Clave ---");
        // Asegúrate de que keyInitialSeed sea un número válido para el PRNG
        const keyInitialSeed = parseInt(this.keyBinary.substr(0, 8), 2) >>> 0;
        console.log(`  Semilla inicial de la clave (primeros 8 bits de hash binario como entero): ${keyInitialSeed}`);

        console.log("\n--- PASO 4: Adaptar Clave y Realizar XOR con Mensaje ---");
        const keyForBlock = this._adaptKey(fullBinary.length);
        const xorResult = this._xorBinStr(keyForBlock, fullBinary);

        console.log("\n--- PASO 5: Codificar Resultado XOR a ADN ---");
        const encodedDNA = this._encodeDNA(xorResult);
        console.log(`  Resultado de XOR (Codificado en ADN): ${encodedDNA}`);

        console.log("\n--- PASO 6: Aplicar Modificación Posicional Aleatoria al ADN ---");
        // La semilla para esta modificación es la keyInitialSeed, que es determinística.
        const modifiedDNA = this._positionalModifyDNA(encodedDNA, keyInitialSeed);

        cipherText += modifiedDNA;
        console.log(`  Texto cifrado final (IV + ADN Modificado): ${cipherText}`);
        return cipherText;
    }

    decrypt(ciphertextDNA) {
        console.log(`Texto cifrado de entrada: '${ciphertextDNA}'`);

        if (!ciphertextDNA || ciphertextDNA.length === 0) {
            console.error("Error: Texto cifrado vacío.");
            throw new Error("Texto cifrado vacío.");
        }

        console.log("\n--- PASO 1: Extraer y Decodificar IV ---");
        const ivDNALength = this.blockSizeChars * 4; // 1 byte = 8 bits = 4 DNA bases (2 bits por base)
        console.log(`  Longitud esperada del IV en bases de ADN: ${ivDNALength}`);

        if (ciphertextDNA.length < ivDNALength) {
            console.error("Error: Texto cifrado demasiado corto para contener el IV.");
            throw new Error("Texto cifrado demasiado corto para contener el IV.");
        }

        const ivDNA = ciphertextDNA.substr(0, ivDNALength);
        const cipherBlocks = ciphertextDNA.substr(ivDNALength);
        console.log(`  IV extraído (ADN): ${ivDNA}`);
        console.log(`  Bloques cifrados restantes (ADN): ${cipherBlocks}`);

        const ivBinary = this._decodeDNA(ivDNA);

        console.log("\n--- PASO 2: Calcular Semilla de Clave para Descifrado ---");
        const keyInitialSeed = parseInt(this.keyBinary.substr(0, 8), 2) >>> 0;
        console.log(`  Semilla inicial de la clave (primeros 8 bits de hash binario como entero): ${keyInitialSeed}`);

        console.log("\n--- PASO 3: Revertir Modificación Posicional Aleatoria del ADN ---");
        // Usa la misma keyInitialSeed para revertir la permutación
        const originalDNA = this._reversePositionalModifyDNA(cipherBlocks, keyInitialSeed);
        //console.log(`  ADN revertido posicionalmente (original después de la modificación): ${originalDNA}`);

        console.log("\n--- PASO 4: Decodificar ADN Revertido a Binario ---");
        const binaryAfterDNA = this._decodeDNA(originalDNA);

        console.log("\n--- PASO 5: Adaptar Clave y Realizar XOR para Obtener Mensaje Original ---");
        const keyForBlock = this._adaptKey(binaryAfterDNA.length);
        const originalBinary = this._xorBinStr(keyForBlock, binaryAfterDNA);

        console.log("\n--- PASO 6: Convertir Binario Original a Texto ---");
        const originalPlaintext = binaryToString(originalBinary);
        return originalPlaintext;
    }
}

// === FUNCIONES PÚBLICAS ===
function encrypt(key, text) {
    const keyHex = passwordToHex(key);
    const cipher = new DNAEncryptionDecryption(keyHex);
    const encryptedResult = cipher.encrypt(text);
    return encryptedResult;
}

function decrypt(key, encryptedText) {
    console.log("\n--- DESCIFRADO ---");
    const keyHex = passwordToHex(key);
    const decipher = new DNAEncryptionDecryption(keyHex);
    try {
        const decryptedResult = decipher.decrypt(encryptedText);
        return decryptedResult;
    } catch (error) {
        console.error("[ERROR] No se pudo descifrar:", error.message);
        console.log("--- FIN FUNCIÓN GLOBAL: decrypt (CON ERROR) ---");
        return "[ERROR] Mensaje corrupto o clave incorrecta";
    }
}

// === EJEMPLO DE USO ===
const mensajeOriginal = "hola mundo 😃👋";
const miContraseña = "hola123";

console.log(`Mensaje Original : '${mensajeOriginal}'`);
console.log(`Contraseña       : '${miContraseña}'`);

// Ciframos
const mensajeCifrado = encrypt(miContraseña, mensajeOriginal);
console.log(`RESULTADO FINAL - Mensaje Cifrado: '${mensajeCifrado}'`);

// Desciframos
const mensajeDescifrado = decrypt(miContraseña, mensajeCifrado);
console.log(`RESULTADO FINAL - Mensaje Descifrado: '${mensajeDescifrado}'`);
