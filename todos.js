module.exports = {
    comando: ['/todos', '/all', '/tag'], 
    run: async (sock, remitente, msg) => {
        try {
            if (!remitente.endsWith('@g.us')) return;

            // 1. Obtener la lista de todos los miembros del grupo
            const infoGrupo = await sock.groupMetadata(remitente);
            const participantes = infoGrupo.participants;
            let listaJids = participantes.map(p => p.id);

            // 2. REVISAR SI EL COMANDO SE USÓ COMENTANDO/RESPONDIENDO A OTRO MENSAJE
            const mensajeCitado = msg.message?.extendedTextMessage?.contextInfo;
            let textoFinal = "";

            if (mensajeCitado && mensajeCitado.quotedMessage) {
                // Si respondiste a un mensaje, extraemos el contenido de ese mensaje citado
                const citado = mensajeCitado.quotedMessage;
                textoFinal = citado.conversation || 
                             citado.extendedTextMessage?.text || 
                             citado.imageMessage?.caption || 
                             citado.videoMessage?.caption || 
                             "📢 ¡Atención a este mensaje importante!";
            } else {
                // Si no respondiste a nadie, usamos el texto que escribiste al lado del comando
                const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
                const partes = textoMensaje.trim().split(/ +/);
                partes.shift(); 
                const mensajeAdicional = partes.join(" ");
                textoFinal = mensajeAdicional ? mensajeAdicional : "📢 ¡Atención a todos los miembros del grupo!";
            }

            // 3. Enviar el mensaje citado con la mención fantasma oculta
            await sock.sendMessage(remitente, { 
                text: textoFinal, 
                mentions: listaJids 
            });

        } catch (error) {
            console.error('Error en comando de mención con respuesta:', error);
            await sock.sendMessage(remitente, { text: '❌ Ocurrió un error al intentar mencionar al grupo.' });
        }
    }
};
