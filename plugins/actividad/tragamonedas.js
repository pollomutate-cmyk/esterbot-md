const fs = require('fs');
const path = require('path');

module.exports = {
  // CONFIGURADO: Quitamos las barras diagonales para compatibilidad total con tu index.js
  comando: ['tragamonedas', 'slots', 'slot', 'casino'],
  run: async (sock, remitente, msg, obtenerMencionado) => {
    try {
      const esGrupo = remitente.endsWith('@g.us');
      if (!esGrupo) return; 

      const quienEnvia = msg.key.participant || msg.key.remoteJid;
      let numEnvia = String(quienEnvia).split('@');

      const emojisCasino = ['🍒', '💎', '7️⃣', '👑'];

      const casilla1 = emojisCasino[Math.floor(Math.random() * emojisCasino.length)];
      const casilla2 = emojisCasino[Math.floor(Math.random() * emojisCasino.length)];
      const casilla3 = emojisCasino[Math.floor(Math.random() * emojisCasino.length)];

      let resultadoVeredicto = '';

      if (casilla1 === casilla2 && casilla2 === casilla3) {
        if (casilla1 === '👑') {
          resultadoVeredicto = '👑 *¡PREMIO MAYOR SUPREMO!* 👑\n_Has sacado la triple corona del Alfa. ¡Dominas por completo el servidor hoy!_ 🔥✨';
        } else if (casilla1 === '7️⃣') {
          resultadoVeredicto = '🎰 *¡JACKPOT DE LA SUERTE!* 🎰\n_El triple 7 ha brillado para ti. ¡Tienes una fortuna increíble en este turno!_ 🍀💎';
        } else if (casilla1 === '💎') {
          resultadoVeredicto = '💎 *¡RIQUEZA ABSOLUTA!* 💎\n_Tres diamantes puros. Tu estatus en el rol acaba de subir a las nubes._ ✨👑';
        } else {
          resultadoVeredicto = '🍒 *¡TRIPLE CEREZA!* 🍒\n_¡Felicidades! Lograste la combinación perfecta del casino de rol._ 🎉🥳';
        }
      } else if (casilla1 === 'casilla2' || casilla2 === 'casilla3' || casilla1 === 'casilla3') {
        resultadoVeredicto = 'Anuncio: 👀 *¡CASI LO LOGRAS!* 👀\n_Estuviste a un solo emoji de ganar el Jackpot. ¡No te rindas y vuelve a girar!_ ✨⏳';
      } else {
        resultadoVeredicto = 'Anuncio: 💔 *¡SUERTE PARA LA PRÓXIMA!* 💔\n_Todo salió mezclado. La máquina se quedó con tus esperanzas, sigue intentando._ 🗑️💨';
      }
      // MENSAJE ÚNICO Y ESTÉTICO: Emojis alineados a la izquierda y sin títulos molestos de relleno
      let textoSlots = `🎰 ═══ 🎭 *CASINO ALFA X OMEGAS* 🎭 ═══ 🎰\n\n`;
      textoSlots += `👤 @${numEnvia} ha jalado la palanca de la máquina...\n\n`;
      textoSlots += `🎰 [ ⬛ ┃ ⬛ ┃ ⬛ ]\n`;
      textoSlots += `✨ [ ${casilla1} ┃ ${casilla2} ┃ ${casilla3} ]\n`;
      textoSlots += `🎰 [ ⬛ ┃ ⬛ ┃ ⬛ ]\n\n`;
      textoSlots += `${resultadoVeredicto}`;

      // Envío de un solo bloque limpio, controlado y respondiendo al usuario
      await sock.sendMessage(remitente, { 
        text: textoSlots, 
        mentions: [quienEnvia] 
      }, { quoted: msg });

    } catch (error) {
      console.error('❌ Error crítico en el comando tragamonedas.js:', error);
    }
  }
};
