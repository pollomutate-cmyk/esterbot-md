module.exports = {
    comando: ['/promote', '/promover', '/daradmin'],
    run: async (sock, remitente, msg, obtenerMencionado) => {
        try {
            const esGrupo = remitente.endsWith('@g.us');
            if (!esGrupo) return await sock.sendMessage(remitente, { text: '❌ Este comando solo puede ser usado en grupos.' });

            // Busca el usuario primero por reacción, si no por mención/etiqueta
            let usuarioPromote = msg.usuarioObjetivoReaccion || obtenerMencionado(msg);

            // Si es un arreglo (varias menciones), tomamos la primera
            if (Array.isArray(usuarioPromote)) {
                usuarioPromote = usuarioPromote[0];
            }

            if (!usuarioPromote || typeof usuarioPromote !== 'string') {
                return await sock.sendMessage(remitente, { text: '⚠️ Menciona a un usuario, responde a su mensaje o reacciona con 👑 para promoverlo.\n*Ejemplo:* /promote @usuario' });
            }

            // Promover en WhatsApp
            await sock.groupParticipantsUpdate(remitente, [usuarioPromote], 'promote');
            
            const numeroLimpio = usuarioPromote.split('@')[0];
            await sock.sendMessage(remitente, { text: `👑 @${numeroLimpio} ahora es administrador del grupo.`, mentions: [usuarioPromote] });

        } catch (error) {
            console.error('Error en comando /promote:', error);
            await sock.sendMessage(remitente, { text: '❌ Ocurrió un error. Asegúrate de que el bot sea administrador.' });
        }
    }
};
