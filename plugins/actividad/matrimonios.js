const fs = require('fs');
const path = require('path');

// Base de datos local para almacenar los matrimonios de forma permanente
const rutaMatrimonios = path.join(process.cwd(), 'matrimonios.json');
if (!fs.existsSync(rutaMatrimonios)) fs.writeFileSync(rutaMatrimonios, JSON.stringify({}));

module.exports = {
  // CONFIGURADO: Quitamos las barras diagonales para compatibilidad total con tu index.js
  comando: ['casar', 'marry', 'divorcio', 'divorciar', 'divorcie'],
  run: async (sock, remitente, msg, obtenerMencionado) => {
    try {
      const esGrupo = remitente.endsWith('@g.us');
      if (!esGrupo) return;

      const quienEnvia = msg.key.participant || msg.key.remoteJid;
      const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
      let textoLimpio = String(textoMensaje).toLowerCase().trim();

      // Cortamos la barra si viene escrita para no romper la lógica de condiciones
      let comandoEscrito = textoLimpio.startsWith('/') ? textoLimpio.slice(1) : textoLimpio;
      const esBoda = comandoEscrito.startsWith('casar') || comandoEscrito.startsWith('marry');

      let db = JSON.parse(fs.readFileSync(rutaMatrimonios, 'utf8'));
      if (!db[remitente]) db[remitente] = {}; 

      const context = msg.message?.extendedTextMessage?.contextInfo || null;
      const menciones = context?.mentionedJid || [];

      // ==========================================
      // 🔥 SECCIÓN: MATRIMONIO (casar o marry)
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
            text: '⚠️ *Uso correcto de las bodas:*\n\n• `casar @persona` o `marry @persona` (Casarte con alguien)\n• `casar @persona1 @persona2` (Casar a dos miembros)' 
          }, { quoted: msg });
        }

        if (usuario1 === usuario2) {
          return await sock.sendMessage(remitente, { text: '😂 ¡No puedes casarte contigo mismo!' }, { quoted: msg });
        }

        let numLimpio1 = String(usuario1).split('@');
        let numLimpio2 = String(usuario2).split('@');

        if (db[remitente][usuario1]) {
          let parejaNum = String(db[remitente][usuario1]).split('@');
          return await sock.sendMessage(remitente, { 
            text: `🚫 ¡Un momento! @${numLimpio1} ya está casado/a con @${parejaNum}. ¡Aquí no se vale el bimatrimonio! 😤`,
            mentions: [usuario1, db[remitente][usuario1]]
          }, { quoted: msg });
        }
        if (db[remitente][usuario2]) {
          let parejaNum = String(db[remitente][usuario2]).split('@');
          return await sock.sendMessage(remitente, { 
            text: `🚫 ¡Escándalo! @${numLimpio2} ya tiene un compromiso con @${parejaNum}. ¡Operación cancelada! 🛑`,
            mentions: [usuario2, db[remitente][usuario2]]
          }, { quoted: msg });
        }

        db[remitente][usuario1] = usuario2;
        db[remitente][usuario2] = usuario1;
        fs.writeFileSync(rutaMatrimonios, JSON.stringify(db, null, 2));

        // CONSERVADO: Tus frases aleatorias originales de matrimonio intactas
        const frasesBoda = [
          `📜 _¡Que el amor, el respeto y la felicidad los acompañen en esta gran aventura por siempre!_ 🥂 ✨`,
          `🌌 ✨ _Que la vida les conceda un amor infinito, de esos que desafían al olvido y se escriben en las estrellas._ ✨ 🪐`,
          `🕊️ 🕊️ _Que el sendero que hoy emprenden juntos esté libre de tormentas y lleno de luz, prosperidad y paz._ 🕯️ 🌸`,
          `👑 💞 _¡Que vivan felices, que vivan plenos y que su amor sea para siempre!_ 💒 💍`,
          `🎭 😉 _¡Felicidades! Que el matrimonio te sea leve..._ 🤭 🔒`
        ];

        const fraseElegidaBoda = frasesBoda[Math.floor(Math.random() * frasesBoda.length)];

        // MENSAJE ÚNICO DE BODA: Directo, limpio, sin títulos de relleno y con emojis alineados
        let mensajeBoda = `💒 ✨ *¡UNIÓN SAGRADA EN WHATSAPP!* ✨ 💒\n\n`;
        mensajeBoda += `👑 Ha nacido una hermosa alianza en la comunidad.\n`;
        mensajeBoda += `💞 @${numLimpio1} x @${numLimpio2} han unido sus vidas en matrimonio oficial de rol.\n\n`;
        mensajeBoda += `${fraseElegidaBoda}`;

        return await sock.sendMessage(remitente, { text: mensajeBoda, mentions: [usuario1, usuario2] }, { quoted: msg });
      }
      // ==========================================
      // 💔 SECCIÓN: DIVORCIO OBLIGATORIO
      // ==========================================
      else {
        let usuarioEx1 = null;
        let usuarioEx2 = null;

        if (menciones.length >= 2) {
          usuarioEx1 = menciones[0];
          usuarioEx2 = menciones[1];
          
          if (db[remitente][usuarioEx1] !== usuarioEx2) {
            return await sock.sendMessage(remitente, { text: '👀 Esas dos personas no están casadas entre sí en este grupo.' }, { quoted: msg });
          }
        } else if (menciones.length === 1) {
          usuarioEx1 = quienEnvia;
          usuarioEx2 = menciones[0];

          if (db[remitente][usuarioEx1] !== usuarioEx2) {
            return await sock.sendMessage(remitente, { text: '👀 No puedes divorciarte de alguien con quien no estás casado.' }, { quoted: msg });
          }
        } else {
          return await sock.sendMessage(remitente, { 
            text: '⚠️ *Uso correcto del divorcio:*\n\n• `divorcio @pareja` (Divorciarte de tu pareja)\n• `divorcio @persona1 @persona2` (Separar a dos miembros)' 
          }, { quoted: msg });
        }

        delete db[remitente][usuarioEx1];
        delete db[remitente][usuarioEx2];
        fs.writeFileSync(rutaMatrimonios, JSON.stringify(db, null, 2));

        let numExLimpio1 = String(usuarioEx1).split('@');
        let numExLimpio2 = String(usuarioEx2).split('@');

        // CONSERVADO: Tus frases aleatorias originales de divorcio intactas
        const frasesDivorcio = [
          `🏝️ @${numExLimpio1}, por fin te deshiciste de esa sal. ¡Ambos vuelven a estar solteros! 👋 ✨`,
          `🏆 🚀 _¡Felicidades por sobrevivir a tu peor decisión y salir ganando!_ 🥳 ✨`,
          `🧹 🍃 _Qué alivio ver que por fin sacaste la basura de tu vida... ¡Aire limpio!_ 🕊️ 😎`,
          `🛑 💥 _Se acabó el simulacro de paciencia: oficialmente se fue tu mayor problema._ 🧠 💆`,
          `🍀 🪐 _¡Por fin te deshiciste de esa sal! Ahora sí se viene la buena suerte para tu vida._ 👑 🌈`
        ];

        const fraseElegidaDivorcio = frasesDivorcio[Math.floor(Math.random() * frasesDivorcio.length)];

        // MENSAJE ÚNICO DE DIVORCIO: Directo, sin barras largas duplicadas y con los emojis a la izquierda
        let mensajeDivorcio = `💔 ═══ *SE ACABÓ EL AMOR* ═══ 💔\n\n`;
        mensajeDivorcio += `⚖️ En el libro se firmaron... ¡Se acabó! Firmaron cada quien por su lado y rompieron el lazo.\n\n`;
        mensajeDivorcio += `${fraseElegidaDivorcio}\n\n`;
        mensajeDivorcio += `👉 Ambas personas (@${numExLimpio1} y @${numExLimpio2}) vuelven a estar solteras y disponibles en la comunidad. 💥`;

        return await sock.sendMessage(remitente, { text: mensajeDivorcio, mentions: [usuarioEx1, usuarioEx2] }, { quoted: msg });
      }

    } catch (error) {
      console.error('❌ Error crítico en el plugin de matrimonios.js:', error);
    }
  }
};
