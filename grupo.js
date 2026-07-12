module.exports = {
    // Definimos las palabras clave para abrir y cerrar el grupo
    comando: ['/cerrar', '/abrir', '/close', '/open'], 
    run: async (sock, remitente, msg) => {
        try {
            if (!remitente.endsWith('@g.us')) return;

            // 1. Extraer el texto completo para saber qué palabra exacta se usó
            const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
            const comandoUsado = textoMensaje.toLowerCase().trim().split(/ +/)[0];

            // 🔒 CASO 1: CERRAR EL GRUPO
            if (comandoUsado === '/cerrar' || comandoUsado === '/close') {
                // Ejecuta el cierre en la API de WhatsApp (solo admins envían mensajes)
                await sock.groupSettingUpdate(remitente, 'announcement');
                
                // Envía el primer mensaje solicitado
                await sock.sendMessage(remitente, { text: '🔒 *Grupo Cerrado.*' });
                // Envía el segundo mensaje solicitado
                await sock.sendMessage(remitente, { text: '⚠️ Solo los administradores pueden mandar mensajes cuando esté cerrado.' });
            }

            // 🟢 CASO 2: ABRIR EL GRUPO
            if (comandoUsado === '/abrir' || comandoUsado === '/open') {
                // Ejecuta la apertura en la API de WhatsApp (todos envían mensajes)
                await sock.groupSettingUpdate(remitente, 'not_announcement');
                
                // Envía el primer mensaje solicitado
                await sock.sendMessage(remitente, { text: '🟢 *Grupo Abierto.*' });
                // Envía el segundo mensaje solicitado
                await sock.sendMessage(remitente, { text: '✅ Todos los miembros pueden enviar mensajes.' });
            }

        } catch (error) {
            console.error('Error en el comando de abrir/cerrar grupo:', error);
            await sock.sendMessage(remitente, { text: '❌ No se pudo cambiar la configuración del grupo. Revisa que el bot mantenga el rango de Admin.' });
        }
    }
};
