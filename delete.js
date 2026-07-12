module.exports = {
    comando: ['/delete', '/dell', '/eliminar', '/borrar'],
    run: async (sock, remitente, msg, obtenerMencionado) => {
        try {
            const esGrupo = remitente.endsWith('@g.us');
            if (!esGrupo) return;

            // Buscamos el contexto del mensaje citado
            const context = msg.message?.extendedTextMessage?.contextInfo || null;
            
            // Si el administrador no está citando ningún mensaje, salimos en silencio absoluto
            if (!context || !context.quotedMessage) return;

            // Estructuramos la clave exacta del mensaje del usuario para hacer "Eliminar para todos"
            const claveMensajeCitado = {
                remoteJid: remitente,
                fromMe: false, // Forzamos a que reconozca que es un mensaje de otra persona para borrarlo como admin
                id: context.stanzaId,
                participant: context.participant
            };

            try {
                // Intentamos borrar primero el mensaje del usuario (Eliminar para todos)
                await sock.sendMessage(remitente, { delete: claveMensajeCitado });
                // Si el anterior tuvo éxito, borramos de inmediato tu comando escrito
                await sock.sendMessage(remitente, { delete: msg.key });
            } catch (errorInterno) {
                // SI NO SE PUEDE BORRAR (Falta de admin o error de WhatsApp), el bot rompe el silencio y te avisa
                console.error('Error al intentar eliminar para todos:', errorInterno);
                await sock.sendMessage(remitente, { text: '❌ No se pudo eliminar el mensaje para todos. Asegúrate de que el bot sea administrador del grupo.' });
            }

        } catch (error) {
            console.error('Error general en delete.js:', error);
        }
    }
};
