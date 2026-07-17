const fs = require('fs');
const path = require('path');

module.exports = {
  // CONFIGURADO: Sin barras diagonales para que tu index.js lo detecte al instante
  comando: ['aceptar', 'aprobar', 'rechazar', 'denegar'],
  run: async (sock, remitente, msg, obtenerMencionado) => {
    try {
      const esGrupo = remitente.endsWith('@g.us');
      if (!esGrupo) return; 

      const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
      let textoLimpio = String(textoMensaje).toLowerCase().trim();
      
      let comandoEscrito = textoLimpio.startsWith('/') ? textoLimpio.slice(1) : textoLimpio;
      const esAccionAceptar = comandoEscrito.startsWith('aceptar') || comandoEscrito.startsWith('aprobar');

      // Descarga automática de la lista de espera oficial del grupo
      const listaEspera = await sock.groupRequestParticipantsList(remitente);
      if (!listaEspera || listaEspera.length === 0) {
        return await sock.sendMessage(remitente, { text: '✨ *¡Lista limpia!* No hay solicitudes pendientes por aquí. 🏝️' }, { quoted: msg });
      }

      const usuariosProcesar = listaEspera.map(p => p.jid);
      const cantidad = usuariosProcesar.length;

      // ==========================================
      // 🔥 CASO A: ACEPTAR SOLICITUDES
      // ==========================================
      if (esAccionAceptar) {
        const metadatosGrupo = await sock.groupMetadata(remitente);
        const nombreGrupo = metadatosGrupo.subject;

        for (const usuario of usuariosProcesar) {
          await sock.groupRequestParticipantsUpdate(remitente, [usuario], 'approve');
        }

        // Generamos la lista de nuevos miembros de forma limpia sin signos rotos
        let listaNumerada = '';
        usuariosProcesar.forEach((u, indice) => {
          let numeroImprimir = u.split('@')[0];
          listaNumerada += `🔹 *${indice + 1}.* @${numeroImprimir}\n`;
        });

        // MENSAJE ÚNICO: Corregido quitando la palabra masivamente
        let mensajeAceptar = `👑  ✨  *BIENVENIDOS / A*  ✨  👑\n`;
        mensajeAceptar += `👉  *${nombreGrupo.toUpperCase()}*  👈\n\n`;
        mensajeAceptar += `👥 *Miembros que ingresaron:*\n${listaNumerada.trim()}\n\n`;
        mensajeAceptar += `📊 *Actividad:* +${cantidad} miembros nuevos aceptados.\n\n`;
        mensajeAceptar += `🎭 _¡Disfruten el grupo, recuerden mantenerse activos y leer las reglas obligatoriamente!_ 📜 🔥`;
        
        await sock.sendMessage(remitente, { 
          text: mensajeAceptar, 
          mentions: usuariosProcesar 
        });
      } 
      // ==========================================
      // 🚫 CASO B: RECHAZAR SOLICITUDES
      // ==========================================
      else {
        for (const usuario of usuariosProcesar) {
          await sock.groupRequestParticipantsUpdate(remitente, [usuario], 'reject');
        }
        
        // MENSAJE ÚNICO: Corregido quitando la palabra masivamente
        let mensajeRechazar = `🚨 *Sistema de Seguridad* 🚨\n\n`;
        mensajeRechazar += `🚫 Se rechazaron: *${cantidad}* solicitudes de ingreso al grupo.`;
                                        
        await sock.sendMessage(remitente, { text: mensajeRechazar });
      }

    } catch (error) {
      console.error('❌ Error crítico en el plugin de solicitudes.js:', error);
      await sock.sendMessage(remitente, { text: '❌ Ocurrió un error al procesar las solicitudes del grupo. Verifica los permisos del bot.' }, { quoted: msg });
    }
  }
};
