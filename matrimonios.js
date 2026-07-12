const fs = require('fs');
const path = require('path');

// Base de datos local para almacenar los matrimonios de forma permanente
const rutaMatrimonios = path.join(__dirname, '../../matrimonios.json');
if (!fs.existsSync(rutaMatrimonios)) fs.writeFileSync(rutaMatrimonios, JSON.stringify({}));

module.exports = {
    comando: ['/casar', '/marry', '/divorcio', '/divorciar', '/divorcie'],
    run: async (sock, remitente, msg, obtenerMencionado) => {
        try {
            const esGrupo = remitente.endsWith('@g.us');
            if (!esGrupo) return;

            const quienEnvia = msg.key.participant || msg.key.remoteJid;
            const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
            const textoLimpio = textoMensaje.toLowerCase().trim();

            const esBoda = textoLimpio.startsWith('/casar') || textoLimpio.startsWith('/marry');

            let db = JSON.parse(fs.readFileSync(rutaMatrimonios, 'utf8'));
            if (!db[remitente]) db[remitente] = {}; 

            const context = msg.message?.extendedTextMessage?.contextInfo || null;
            const menciones = context?.mentionedJid || [];

            // ==========================================
            // 🔥 SECCIÓN: MATRIMONIO (/casar o /marry)
            // ==========================================
            if (esBoda) {
                let usuario1 = null;
                let usuario2 = null;

                if (menciones.length >= 2) {
                    usuario1 = menciones[0];
                    usuario2 = menciones[1];
                } else if (menciones.length === 1) {
                    usuario1 = quienEnvia;
                    usuario2 = menciones[0];
                } else {
                    return await sock.sendMessage(remitente, { 
                        text: '⚠️ *Uso correcto de las bodas:*\n\n• `/casar @persona` o `/marry @persona` (Casarte con alguien)\n• `/casar @persona1 @persona2` (Casar a dos miembros)' 
                    });
                }

                if (usuario1 === usuario2) {
                    return await sock.sendMessage(remitente, { text: '😂 ¡No puedes casarte contigo mismo!' });
                }

                const numLimpio1 = usuario1.split('@')[0];
                const numLimpio2 = usuario2.split('@')[0];

                if (db[remitente][usuario1]) {
                    const parejaNum = db[remitente][usuario1].split('@')[0];
                    return await sock.sendMessage(remitente, { 
                        text: `🚫 ¡Un momento! @${numLimpio1} ya está casado/a con @${parejaNum}. ¡Aquí no se vale el bimatrimonio! 😤`,
                        mentions: [usuario1, db[remitente][usuario1]]
                    });
                }
                if (db[remitente][usuario2]) {
                    const parejaNum = db[remitente][usuario2].split('@')[0];
                    return await sock.sendMessage(remitente, { 
                        text: `🚫 ¡Escándalo! @${numLimpio2} ya tiene un compromiso con @${parejaNum}. ¡Operación cancelada! 🛑`,
                        mentions: [usuario2, db[remitente][usuario2]]
                    });
                }

                db[remitente][usuario1] = usuario2;
                db[remitente][usuario2] = usuario1;
                fs.writeFileSync(rutaMatrimonios, JSON.stringify(db, null, 2));

                const frasesBoda = [
                    `📜 _¡Que el amor, el respeto y la felicidad los acompañen en esta gran aventura por siempre!_ 🥂 ✨`,
                    `🌌 ✨ _Que la vida les conceda un amor infinito, de esos que desafían al olvido y se escriben en las estrellas._ ✨ 🪐`,
                    `🕊️ 🕊️ _Que el sendero que hoy emprenden juntos esté libre de tormentas y lleno de luz, prosperidad y paz._ 🕯️ 🌸`,
                    `👑 💞 _¡Que vivan felices, que vivan plenos y que su amor sea para siempre!_ 💒 💍`,
                    `🎭 😉 _¡Felicidades! Que el matrimonio te sea leve..._ 🤭 🔒`
                ];

                const fraseElegidaBoda = frasesBoda[Math.floor(Math.random() * frasesBoda.length)];

                const mensajeBoda = `💒  ✨  *¡UNIÓN SAGRADA EN WHATSAPP!*  ✨  💒\n\n` +
                                    `👑  Ha nacido una hermosa alianza en la comunidad.\n` +
                                    `💞  @${numLimpio1}  x  @${numLimpio2}  han unido sus vidas en matrimonio oficial de rol.\n\n` +
                                    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                                    `${fraseElegidaBoda}`;

                return await sock.sendMessage(remitente, { text: mensajeBoda, mentions: [usuario1, usuario2] });
            }

            // ==========================================
            // 💔 SECCIÓN: DIVORCIO OBLIGATORIO CON ETIQUETA
            // ==========================================
            else {
                let usuarioEx1 = null;
                let usuarioEx2 = null;

                if (menciones.length >= 2) {
                    usuarioEx1 = menciones[0];
                    usuarioEx2 = menciones[1];
                    
                    if (db[remitente][usuarioEx1] !== usuarioEx2) {
                        return await sock.sendMessage(remitente, { text: '👀 Esas dos personas no están casadas entre sí en este grupo.' });
                    }
                } else if (menciones.length === 1) {
                    usuarioEx1 = quienEnvia;
                    usuarioEx2 = menciones[0];

                    if (db[remitente][usuarioEx1] !== usuarioEx2) {
                        return await sock.sendMessage(remitente, { text: '👀 No puedes divorciarte de alguien con quien no estás casado.' });
                    }
                } else {
                    return await sock.sendMessage(remitente, { 
                        text: '⚠️ *Uso correcto del divorcio:*\n\n• `/divorcio @pareja` (Divorciarte de tu pareja)\n• `/divorcio @persona1 @persona2` (Separar a dos miembros)' 
                    });
                }

                // Eliminamos los registros de la base de datos de forma mutua
                delete db[remitente][usuarioEx1];
                delete db[remitente][usuarioEx2];
                fs.writeFileSync(rutaMatrimonios, JSON.stringify(db, null, 2));

                const numExLimpio1 = usuarioEx1.split('@')[0];
                const numExLimpio2 = usuarioEx2.split('@')[0];

                const frasesDivorcio = [
                    `🏝️  @${numExLimpio1}, por fin te deshiciste de esa sal. ¡Ambos vuelven a estar solteros! 👋 ✨`,
                    `🏆  🚀  _¡Felicidades por sobrevivir a tu peor decisión y salir ganando!_  🥳  ✨`,
                    `🧹  🍃  _Qué alivio ver que por fin sacaste la basura de tu vida... ¡Aire limpio!_  🕊️  😎`,
                    `🛑  💥  _Se acabó el simulacro de paciencia: oficialmente se fue tu mayor problema._  🧠  💆`,
                    `🍀  🪐  _¡Por fin te deshiciste de esa sal! Ahora sí se viene la buena suerte para tu vida._  👑  🌈`
                ];

                const fraseElegidaDivorcio = frasesDivorcio[Math.floor(Math.random() * frasesDivorcio.length)];

                const mensajeDivorcio = `💔  ═══  *SE ACABÓ EL AMOR*  ═══  💔\n\n` +
                                        `⚖️  En el libro se firmaron... ¡Se acabó! Firmaron cada quien por su lado y rompieron el lazo.\n` +
                                        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                                        `${fraseElegidaDivorcio}\n\n` +
                                        `👉  _Ambas personas (@${numExLimpio1} y @${numExLimpio2}) vuelven a estar solteras y disponibles en el mercado de la comunidad._  💥`;

                // CORRECCIÓN CLAVE: Pasamos ambos usuarios en la lista de menciones para que WhatsApp los marque en azul y les avise
                return await sock.sendMessage(remitente, { text: mensajeDivorcio, mentions: [usuarioEx1, usuarioEx2] });
            }

        } catch (error) {
            console.error('Error en el archivo de bodas matrimonios.js:', error);
        }
    }
};
