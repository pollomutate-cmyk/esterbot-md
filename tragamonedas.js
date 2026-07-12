module.exports = {
    comando: ['/tragamonedas', '/slots', '/slot', '/casino'],
    run: async (sock, remitente, msg, obtenerMencionado) => {
        try {
            const esGrupo = remitente.endsWith('@g.us');
            if (!esGrupo) return; 

            const quienEnvia = msg.key.participant || msg.key.remoteJid;
            const numEnvia = quienEnvia.split('@')[0];

            const emojisCasino = ['🍒', '💎', '7️⃣', '👑'];

            const casilla1 = emojisCasino[Math.floor(Math.random() * emojisCasino.length)];
            const casilla2 = emojisCasino[Math.floor(Math.random() * emojisCasino.length)];
            const casilla3 = emojisCasino[Math.floor(Math.random() * emojisCasino.length)];

            let resultadoVeredicto = '';

            if (casilla1 === casilla2 && casilla2 === casilla3) {
                if (casilla1 === '👑') {
                    resultadoVeredicto = '👑  *¡PREMIO MAYOR SUPREMO!*  👑\n_Has sacado la triple corona del Alfa. ¡Dominas por completo el servidor hoy!_  🔥✨';
                } else if (casilla1 === '7️⃣') {
                    resultadoVeredicto = '🎰  *¡JACKPOT DE LA SUERTE!*  🎰\n_El triple 7 ha brillado para ti. ¡Tienes una fortuna increíble en este turno!_  🍀💎';
                } else if (casilla1 === '💎') {
                    resultadoVeredicto = '💎  *¡RIQUEZA ABSOLUTA!*  💎\n_Tres diamantes puros. Tu estatus en el rol acaba de subir a las nubes._  ✨👑';
                } else {
                    resultadoVeredicto = '🍒  *¡TRIPLE CEREZA!*  🍒\n_¡Felicidades! Lograste la combinación perfecta del casino de rol._  🎉🥳';
                }
            } else if (casilla1 === casilla2 || casilla2 === casilla3 || casilla1 === casilla3) {
                resultadoVeredicto = '👀  *¡CASI LO LOGRAS!*  👀\n_Estuviste a un solo emoji de ganar el Jackpot. ¡No te rindas y vuelve a girar!_  ✨⏳';
            } else {
                resultadoVeredicto = '💔  *¡SUERTE PARA LA PRÓXIMA!*  💔\n_Todo salió mezclado. La máquina se quedó con tus esperanzas, sigue intentando._  🗑️💨';
            }

            // NUEVO DISEÑO: Usamos bloques negros para enmarcar la línea ganadora de forma perfecta
            let textoSlots = `🎰  ═══  🎭  *CASINO ALFA X OMEGAS*  🎭  ═══  🎰\n\n`;
            textoSlots += `👤  @${numEnvia}  ha jalado la palanca de la máquina...\n\n`;
            textoSlots += `🎰  [ ⬛  ┃  ⬛  ┃  ⬛ ]\n`;
            textoSlots += `✨  [  ${casilla1}  ┃  ${casilla2}  ┃  ${casilla3}  ]\n`;
            textoSlots += `🎰  [ ⬛  ┃  ⬛  ┃  ⬛ ]\n\n`;
            textoSlots += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
            textoSlots += `${resultadoVeredicto}`;

            await sock.sendMessage(remitente, { 
                text: textoSlots, 
                mentions: [quienEnvia] 
            });

        } catch (error) {
            console.error('Error en el comando tragamonedas.js corregido:', error);
        }
    }
};
