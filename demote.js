module.exports = {
    comando: ['/demote', '/despromover', '/quitaradmin'],
    run: async (sock, remitente, msg, obtenerMencionado) => {
        try {
            const esGrupo = remitente.endsWith('@g.us');
            if (!esGrupo) return await sock.sendMessage(remitente, { text: '❌ Este comando solo puede ser usado en grupos.' });

            // Busca el usuario primero por reacción, si no por mención/etiqueta
            let usuarioDemote = msg.usuarioObjetivoReaccion || obtenerMencionado(msg);

            // Si es un arreglo (varias menciones), tomamos la primera
            if (Array.isArray(usuarioDemote)) {
                usuarioDemote = usuarioDemote[0];
            }

            if (!usuarioDemote || typeof usuarioDemote !== 'string') {
                return await sock.sendMessage(remitente, { text: '⚠️ Menciona a un administrador, responde a su mensaje o reacciona con 🚫 para quitarle el cargo.\n*Ejemplo:* /demote @usuario' });
            }

            // Quitar administrador en WhatsApp
            await sock.groupParticipantsUpdate(remitente, [usuarioDemote], 'demote');
            
            const numeroLimpio = usuarioDemote.split('@')[0];
            await sock.sendMessage(remitente, { text: `📉 @${numeroLimpio} ya no es administrador del grupo.`, mentions: [usuarioDemote] });

        } catch (error) {
            console.error('Error en comando /demote:', error);
            await sock.sendMessage(remitente, { text: '❌ Ocurrió un error. Asegúrate de que el bot sea administrador.' });
        }
    }
};
