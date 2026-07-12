module.exports = {
    comando: ['/abrazar', '/abrazo', '/morder', '/mordisco', '/besar', '/beso', '/atacar', '/pegar', '/proteger', '/coger', '/patada', '/patear'],
    run: async (sock, remitente, msg, obtenerMencionado) => {
        try {
            const esGrupo = remitente.endsWith('@g.us');
            if (!esGrupo) return;

            const quienEnvia = msg.key.participant || msg.key.remoteJid;
            let mencionado = obtenerMencionado(msg);

            // Si hay varias menciones, tomamos la primera de forma segura
            if (Array.isArray(mencionado)) {
                mencionado = mencionado[0];
            }

            if (!mencionado || mencionado === quienEnvia) {
                return await sock.sendMessage(remitente, { text: '⚠️ Debes etiquetar a otro miembro del grupo para realizar esta acción.\n*Ejemplo:* /beso @usuario' });
            }

            // CORRECCIÓN CLAVE: Ahora hacemos el split de forma segura sobre textos puros
            const numEnvia = quienEnvia.split('@')[0];
            const numMencionado = mencionado.split('@')[0];

            const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
            const comandoLimpio = textoMensaje.toLowerCase().trim().split(/ +/)[0];

            let mensajeRol = '';

            // === BANCO DE TEXTOS DE ROL ===
            if (comandoLimpio.includes('abraz')) {
                mensajeRol = `🤗 ✨ *@${numEnvia}* le ha dado un abrazo súper cálido y protector a *@${numMencionado}*. ¡Qué ternura! 💕`;
            } 
            else if (comandoLimpio.includes('bes')) {
                mensajeRol = `💋 ✨ *@${numEnvia}* se ha acercado lentamente y le dio un dulce beso a *@${numMencionado}*. ¡El ambiente se puso romántico! 🌸`;
            } 
            else if (comandoLimpio.includes('coger')) {
                mensajeRol = `🔞 🔥 ¡DIOS MÍO! *@${numEnvia}* se dejó llevar por el instinto y se ha puesto a coger salvajemente con *@${numMencionado}* en pleno chat... 🍆 🍑 💦 _¡La temperatura está al máximo en el rol!_ 🥵 💥`;
            } 
            else if (comandoLimpio.includes('patada') || comandoLimpio.includes('patear')) {
                mensajeRol = `🦶 💥 ¡TOMA! *@${numEnvia}* se dio una vuelta y le acomodó una tremenda patada voladora a *@${numMencionado}*, mandándolo a volar al otro lado del mapa. 🤼‍♂️ 💨`;
            } 
            else if (comandoLimpio.includes('mord')) {
                mensajeRol = `🦷 💥 ¡Ouch! *@${numEnvia}* ha marcado territorio dándole un buen mordisco a *@${numMencionado}*. 😳 🔥`;
            } 
            else if (comandoLimpio.includes('atacar') || comandoLimpio.includes('pegar')) {
                mensajeRol = `⚔️ 🛡️ ¡Se armó el combate! *@${numEnvia}* ha lanzado un ataque directo contra *@${numMencionado}*. ¿Habrá contraataque? 🤺`;
            } 
            else if (comandoLimpio.includes('proteger')) {
                mensajeRol = `🛡️ ✨ *@${numEnvia}* se ha puesto al frente como escudo para proteger a *@${numMencionado}* de cualquier peligro. 👑`;
            }

            // Envío instantáneo con las menciones
            await sock.sendMessage(remitente, { 
                text: mensajeRol, 
                mentions: [quienEnvia, mencionado] 
            });

        } catch (error) {
            console.error('Error en el sistema de interacciones de rol:', error);
        }
    }
};
