module.exports = {
    comando: ['/totalall', '/hidetag', '/totaltag', '/hideall'], 
    run: async (sock, remitente, msg) => {
        try {
            if (!remitente.endsWith('@g.us')) return;

            // 1. Verificar si estás respondiendo/citando un mensaje decorado
            const mensajeCitado = msg.message?.extendedTextMessage?.contextInfo;
            
            if (!mensajeCitado || !mensajeCitado.stanzaId) {
                return await sock.sendMessage(remitente, { 
                    text: '⚠️ *Para reenviar y notificar al grupo:*\n➔ Responde directamente al mensaje decorado escribiendo: `/totalall`, `/hidetag`, `/totaltag` o `/hideall`.' 
                });
            }

            // 2. Obtener la lista de todos los miembros del grupo para la mención fantasma
            const infoGrupo = await sock.groupMetadata(remitente);
            const participantes = infoGrupo.participants;
            let listaJids = participantes.map(p => p.id);

            // 3. Extraer el contenido exacto del mensaje citado (para mantener su formato)
            const citado = mensajeCitado.quotedMessage;

            // 4. EL TRUCO MAESTRO: Enviamos el mensaje manteniendo su estructura visual original
            // pero le inyectamos la propiedad "mentions" por fuera para que notifique a todos en limpio.
            await sock.sendMessage(remitente, {
                forward: {
                    key: {
                        remoteJid: remitente,
                        fromMe: mensajeCitado.participant === sock.user.id.split(':') + '@s.whatsapp.net',
                        id: mensajeCitado.stanzaId,
                        participant: mensajeCitado.participant
                    },
                    message: citado
                },
                contextInfo: {
                    mentionedJid: listaJids // Esto hace sonar el celular de todos de forma invisible
                }
            });

        } catch (error) {
            console.error('Error en el comando de reenvío con mención:', error);
            await sock.sendMessage(remitente, { text: '❌ Ocurrió un error al intentar reenviar con mención.' });
        }
    }
};
