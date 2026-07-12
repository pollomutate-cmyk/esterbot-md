module.exports = {
    comando: ['/aceptar', '/aprobar', '/rechazar', '/denegar'],
    run: async (sock, remitente, msg, obtenerMencionado) => {
        try {
            const esGrupo = remitente.endsWith('@g.us');
            if (!esGrupo) return; 

            const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
            const textoLimpio = textoMensaje.toLowerCase().trim();
            const esAccionAceptar = textoLimpio.startsWith('/aceptar') || textoLimpio.startsWith('/aprobar');

            // Descarga automática de la lista de espera
            const listaEspera = await sock.groupRequestParticipantsList(remitente);
            if (!listaEspera || listaEspera.length === 0) {
                await sock.sendMessage(remitente, { text: '✨ *¡Lista limpia!* No hay solicitudes pendientes por aquí. 🏝️' });
                return;
            }

            const usuariosProcesar = listaEspera.map(p => p.jid);
            const cantidad = usuariosProcesar.length;

            // ==========================================
            // 🔥 ACCIÓN: ACEPTAR SOLICITUDES
            // ==========================================
            if (esAccionAceptar) {
                const metadatosGrupo = await sock.groupMetadata(remitente);
                const nombreGrupo = metadatosGrupo.subject;

                for (const usuario of usuariosProcesar) {
                    await sock.groupRequestParticipantsUpdate(remitente, [usuario], 'approve');
                }

                // Generamos la lista numerada con un formato genial
                let listaNumerada = '';
                usuariosProcesar.forEach((u, indice) => {
                    const numero = u.split('@');
                    listaNumerada += `🔹 *${indice + 1}.* @${numero}\n`;
                });

                // Armado estético en una sola variable blindada
                const mensajeAceptar = `👑  ✨  *BIENVENIDOS / A*  ✨  👑\n` +
                                       `👉  *${nombreGrupo.toUpperCase()}*  👈\n\n` +
                                       `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                                       `👥  *MIEMBROS QUE INGRESARON:*\n` +
                                       `${listaNumerada.trim()}\n\n` +
                                       `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                                       `📊  *ACTIVIDADES DE SOLICITUDES:*\n` +
                                       `✅  *+${cantidad}* miembros nuevos aceptados.\n\n` +
                                       `🎭  _¡Disfruten el grupo, recuerden mantenerse activos y leer las reglas obligatoriamente!_  📜  🔥`;
                
                await sock.sendMessage(remitente, { 
                    text: mensajeAceptar, 
                    mentions: usuariosProcesar 
                });

            // ==========================================
            // 🚫 ACCIÓN: RECHAZAR SOLICITUDES
            // ==========================================
            } else {
                for (const usuario of usuariosProcesar) {
                    await sock.groupRequestParticipantsUpdate(remitente, [usuario], 'reject');
                }
                
                const mensajeRechazar = `🚨  *SISTEMA DE SEGURIDAD*  🚨\n\n` +
                                        `🚫  *Se rechazaron de forma masiva:* ${cantidad} solicitudes de ingreso al grupo.`;
                                        
                await sock.sendMessage(remitente, { text: mensajeRechazar });
            }

        } catch (error) {
            console.error('Error estético en solicitudes.js:', error);
        }
    }
};
