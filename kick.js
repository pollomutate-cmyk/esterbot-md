module.exports = {
    // Mantenemos tus variantes oficiales de expulsión en este único archivo
    comando: ['/kick', '/sacar', '/largate', '/lárgate', '/embestir', '/ban'],
    run: async (sock, remitente, msg, obtenerMencionado) => {
        try {
            const esGrupo = remitente.endsWith('@g.us');
            if (!esGrupo) return;

            const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
            const textoLimpio = textoMensaje.toLowerCase().trim();
            
            // Detectamos si la intención exacta es un baneo definitivo
            const esAccionBan = textoLimpio.startsWith('/ban');

            // 1. Buscamos el usuario por la función central de menciones
            let mencionado = obtenerMencionado(msg);
            let usuarioProcesar = null;

            if (mencionado) {
                usuarioProcesar = Array.isArray(mencionado) ? mencionado[0] : mencionado;
            } else {
                // 2. Si falla, buscamos un número telefónico escrito al lado del comando
                const limpiarTexto = textoMensaje.replace(/\/kick|\/sacar|\/largate|\/lárgate|\/embestir|\/ban/gi, '').trim();
                const partes = limpiarTexto.split(/ +/)[0];
                if (partes && partes.replace(/[^0-9]/g, '').length >= 8) {
                    usuarioProcesar = partes.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                }
            }

            // Si no detectó a nadie, damos la alerta de uso correcto
            if (!usuarioProcesar || typeof usuarioProcesar !== 'string') {
                if (esAccionBan) {
                    return await sock.sendMessage(remitente, { text: '⚠️ *Uso correcto:* Escribe `/ban @usuario` para removerlo y bloquearlo permanentemente.' });
                } else {
                    return await sock.sendMessage(remitente, { text: '⚠️ *Uso correcto:* Escribe `/kick @usuario` o `/sacar @usuario` para expulsarlo.' });
                }
            }

            // Evitamos que el bot intente auto-expulsarse
            const botNumero = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            if (usuarioProcesar === botNumero) {
                return await sock.sendMessage(remitente, { text: '❌ No puedo aplicar esa acción sobre mí mismo.' });
            }

            const numeroLimpio = usuarioProcesar.split('@')[0];

            // ==========================================
            // 🔥 CASO A: BANEO DEFINITIVO Y BLOQUEO CRUCIAL
            // ==========================================
            if (esAccionBan) {
                // 1. Sacamos al usuario infractor del grupo
                await sock.groupParticipantsUpdate(remitente, [usuarioProcesar], 'remove');
                
                // Un pequeño retraso de 1 segundo para estabilidad entre peticiones de WhatsApp
                await new Promise(resolve => setTimeout(resolve, 1000));

                // 2. LA MAGIA: Bloqueamos permanentemente al usuario de este grupo específico
                // (Usa la función interna de Baileys para mandar al usuario a la lista negra del JID del grupo)
                await sock.groupParticipantsUpdate(remitente, [usuarioProcesar], 'block');

                await sock.sendMessage(remitente, { 
                    text: `🔨 *¡BANEO PERMANENTE!* 🔨\n\n👤 @${numeroLimpio} ha sido expulsado y agregado a la lista de bloqueados del servidor de forma definitiva. ¡Aquí no se admiten salvedades ni reingresos! 🚫💥`, 
                    mentions: [usuarioProcesar] 
                });
            } 
            // ==========================================
            // 🚪 CASO B: EXPULSIÓN COMÚN Y CORRIENTE
            // ==========================================
            else {
                await sock.groupParticipantsUpdate(remitente, [usuarioProcesar], 'remove');
                
                await sock.sendMessage(remitente, { 
                    text: `🚪 @${numeroLimpio} ha sido removido del grupo exitosamente.`, 
                    mentions: [usuarioProcesar] 
                });
            }

        } catch (error) {
            console.error('Error en el comando unificado kick.js con autoban:', error);
            await sock.sendMessage(remitente, { text: '❌ Ocurrió un fallo al intentar procesar la expulsión. Asegúrate de que el bot mantenga los permisos de administrador.' });
        }
    }
};
