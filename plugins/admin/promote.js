const fs = require('fs');
const path = require('path');

module.exports = {
  // CONFIGURADO: Sincronizado con la lista de restricciones de tu index.js
  comando: ['promote', 'promover', 'daradmin'],
  run: async (sock, remitente, msg, obtenerMencionado) => {
    try {
      const esGrupo = remitente.endsWith('@g.us');
      if (!esGrupo) return;

      let usuarioPromote = null;
      
      // Capturamos el contexto por si estás respondiendo a un mensaje o punto
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.contextInfo || null;

      // === SISTEMA DE EXTRACCIÓN DE ALTA PRIORIDAD POR RESPUESTA O REACCIÓN ===
      if (msg.usuarioObjetivoReaccion) {
        // Vía 1: Si se activó de forma nativa por reaccionar con el emoji de corona 👑
        usuarioPromote = msg.usuarioObjetivoReaccion;
      } 
      else if (contextInfo && contextInfo.participant) {
        // Vía 2: Si estás respondiendo/deslizando el mensaje de alguien en el chat
        usuarioPromote = contextInfo.participant;
      } 
      else {
        // Vía 3: Si no hay respuesta ni emoji, busca por etiqueta tradicional con @
        let mencionado = obtenerMencionado(msg);
        if (mencionado) {
          usuarioPromote = Array.isArray(mencionado) ? mencionado[0] : mencionado;
        }
      }

      // Alerta de uso correcto corta si no detecta a ningún usuario por ninguna vía
      if (!usuarioPromote || typeof usuarioPromote !== 'string') {
        return await sock.sendMessage(remitente, { 
          text: '⚠️ *Uso correcto:* Responde al mensaje de alguien, etiqueta con @usuario o reacciona con 👑 para promoverlo.' 
        }, { quoted: msg });
      }

      // Promoción física en los servidores oficiales de WhatsApp
      await sock.groupParticipantsUpdate(remitente, [usuarioPromote], 'promote');
      
      let numeroImprimir = String(usuarioPromote).split('@')[0];
      // === RESPUESTA DEFINITIVA EN UN SOLO MENSAJE CORTO Y SIN ADORNOS ===
      await sock.sendMessage(remitente, { 
        text: `👑 @${numeroImprimir} ahora es administrador del grupo.`, 
        mentions: [usuarioPromote] 
      });

    } catch (error) {
      console.error('❌ Error crítico en el comando promote.js:', error);
      await sock.sendMessage(remitente, { text: '❌ Ocurrió un fallo al intentar promover al usuario. Asegúrate de que el bot sea administrador.' }, { quoted: msg });
    }
  }
};
