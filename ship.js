module.exports = {
    comando: ['/ship'], 
    run: async (sock, remitente, msg, obtenerMencionado) => {
        try {
            const esGrupo = remitente.endsWith('@g.us');
            if (!esGrupo) return;

            const quienEnvia = msg.key.participant || msg.key.remoteJid;
            
            const context = msg.message?.extendedTextMessage?.contextInfo || null;
            const menciones = context?.mentionedJid || [];

            let usuario1 = null;
            let usuario2 = null;

            if (menciones.length >= 2) {
                usuario1 = menciones[0];
                usuario2 = menciones[1];
            } 
            else if (menciones.length === 1) {
                usuario1 = quienEnvia;
                usuario2 = menciones[0];
            } 
            else {
                return await sock.sendMessage(remitente, { 
                    text: '⚠️ *Uso correcto del comando /ship:*\n\n• `/ship @persona` (Contigo mismo)\n• `/ship @persona1 @persona2` (Entre dos personas)' 
                });
            }

            // Generamos el porcentaje de compatibilidad de forma aleatoria (0 a 100)
            const porcentajeAmor = Math.floor(Math.random() * 101);
            
            let emojiAmor = '';
            let comentario = '';

            // === NUEVA SECCIÓN: RANGOS DE DESAMOR Y AMOR CRUEL ===
            if (porcentajeAmor < 15) {
                emojiAmor = '☠️ 🤮 🚫';
                comentario = '¡ERROR 404! El amor aquí no existe. Ni volviendo a nacer tienen una oportunidad, se repelen como el agua y el aceite. ¡Aléjense! 🛑💥';
            } else if (porcentajeAmor >= 15 && porcentajeAmor < 30) {
                emojiAmor = '💔 🏚️';
                comentario = 'Uff... el ambiente está congelado. Aquí hay más desamor que en una canción triste. Mejor sigan buscando en otro grupo. 🥶🥀';
            } else if (porcentajeAmor >= 30 && porcentajeAmor < 60) {
                emojiAmor = '👀 ☕';
                comentario = 'Hay tensión en el aire... Podrían ser buenos amigos para tomar café, pero si intentan algo más, terminará en drama. 😏🍿';
            } else if (porcentajeAmor >= 60 && porcentajeAmor < 85) {
                emojiAmor = '💖 ✨';
                comentario = '¡Cuidado! Aquí hay chispas reales. Se nota que se llevan de maravilla y la química se siente en el chat. 🥰🌸';
            } else if (porcentajeAmor >= 85) {
                emojiAmor = '👑 🔥 💞';
                comentario = '¡ALERTA DE ALMA GEMELA! El destino los quiere juntos en este rol. El Alfa y el Omega perfectos. ¡Vivan los novios! 🪐 💒';
            }

            const num1 = usuario1.split('@')[0];
            const num2 = usuario2.split('@')[0];

            let textoShip = `💞 ═══ 𝐀LFA X OMEGAS 𝐒𝐇𝐈𝐏 ═══ 💞\n\n`;
            textoShip += `💘 *Pareja:* @${num1}  x  @${num2}\n`;
            textoShip += `📊 *Porcentaje de Amor:* ${porcentajeAmor}% ${emojiAmor}\n\n`;
            textoShip += `📝 *Predicción:* _${comentario}_`;

            await sock.sendMessage(remitente, { 
                text: textoShip, 
                mentions: [usuario1, usuario2] 
            });

        } catch (error) {
            console.error('Error en el comando ship.js con desamor:', error);
        }
    }
};
