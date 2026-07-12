module.exports = {
    // Soportamos los alias oficiales que pusimos en tu lista de restricciones de index.js
    comando: ['/agregar', '/add', '/agg'],
    run: async (sock, remitente, msg, obtenerMencionado) => {
        try {
            const esGrupo = remitente.endsWith('@g.us');
            if (!esGrupo) return; // Si no es un grupo, lo ignora en silencio

            // Extraemos el texto del mensaje quitando el comando escrito
            const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
            const limpiarTexto = textoMensaje.replace(/\/agregar|\/add|\/agg/gi, '').trim();

            // Limpiamos el texto para quedarnos únicamente con los números puros
            const numeroLimpio = limpiarTexto.replace(/[^0-9]/g, '');

            // Validamos que el número tenga una longitud lógica (al menos 8 dígitos)
            if (!numeroLimpio || numeroLimpio.length < 8) {
                return await sock.sendMessage(remitente, { 
                    text: '⚠️ *Uso correcto del comando:*\n\nEscribe el comando seguido del número con su código de país.\n*Ejemplo:* /add 5491123456789 o /agregar 18091234567' 
                });
            }

            // Formateamos el ID oficial de WhatsApp para añadir usuarios
            const usuarioAgregar = numeroLimpio + '@s.whatsapp.net';

            // Enviamos un aviso rápido de que el bot está intentando invitarlo
            await sock.sendMessage(remitente, { text: `⏳ Intentando agregar al número +${numeroLimpio} al grupo...` });

            // Función oficial de Baileys para agregar participantes directamente
            const respuesta = await sock.groupParticipantsUpdate(remitente, [usuarioAgregar], 'add');

            // Baileys devuelve un código según lo que pase en WhatsApp. Evaluamos si entró directo o falló:
            if (respuesta && respuesta[0]?.status === '200') {
                await sock.sendMessage(remitente, { text: `✅ ¡+${numeroLimpio} ha sido agregado exitosamente al grupo de rol!` });
            } else if (respuesta && respuesta[0]?.status === '403') {
                // El estado 403 significa que el usuario tiene la privacidad configurada para no ser añadido a grupos directamente
                await sock.sendMessage(remitente, { text: `📩 El usuario +${numeroLimpio} tiene la privacidad activada. Se le debe enviar un enlace de invitación privado.` });
            } else {
                await sock.sendMessage(remitente, { text: `❌ No se pudo agregar a +${numeroLimpio}. Verifica que el número exista o que el bot siga siendo administrador.` });
            }

        } catch (error) {
            console.error('Error en el comando agregar.js:', error);
            await sock.sendMessage(remitente, { text: '❌ Ocurrió un error interno al intentar añadir al usuario.' });
        }
    }
};
