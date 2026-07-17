const fs = require('fs');
const path = require('path');

module.exports = {
  // CONFIGURADO: Sincronizado con la lista de restricciones de tu index.js
  comando: ['kick', 'sacar', 'largate', 'lárgate', 'embestir', 'ban'],
  run: async (sock, remitente, msg, obtenerMencionado) => {
    try {
      const esGrupo = remitente.endsWith('@g.us');
      if (!esGrupo) return;

      let usuarioProcesar = null;
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.contextInfo || null;
      
      // Vía 1: Prioridad de respuesta directa al deslizar un mensaje o punto
      if (contextInfo && contextInfo.participant) {
        usuarioProcesar = contextInfo.participant;
      } 
      // Vía 2: Si no hay respuesta, busca por etiqueta tradicional con @
      else {
        let mencionado = obtenerMencionado(msg);
        if (mencionado) {
          usuarioProcesar = Array.isArray(mencionado) ? mencionado[0] : mencionado;
        } else {
          // Vía 3: Si no hay respuesta ni @, busca un número escrito al lado
          const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
          const limpiarTexto = textoMensaje.replace(/\/kick|\/sacar|\/largate|\/lárgate|\/embestir|\/ban/gi, '').trim();
          const partes = limpiarTexto.split(/ +/);
          if (partes && partes[0].replace(/[^0-9]/g, '').length >= 8) {
            usuarioProcesar = partes[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
          }
        }
      }

      // Alerta de uso correcto corta si no detecta a ningún usuario
      if (!usuarioProcesar || typeof usuarioProcesar !== 'string') {
        return await sock.sendMessage(remitente, { text: '⚠️ *Uso correcto:* Responde al mensaje de alguien o etiqueta con @usuario para expulsarlo.' }, { quoted: msg });
      }

      // Evitamos que el bot intente auto-expulsarse
      const botNumero = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const botLid = sock.user.lid || '';
      if (usuarioProcesar === botNumero || usuarioProcesar === botLid || usuarioProcesar.includes(sock.user.id.split(':')[0])) {
        return await sock.sendMessage(remitente, { text: '❌ No puedo aplicar esa acción sobre mí mismo.' }, { quoted: msg });
      }

      let numeroImprimir = String(usuarioProcesar).split('@')[0];
      // === ACCIÓN FÍSICA ÚNICA: Expulsa de verdad sin bloquear la cuenta en el servidor ===
      await sock.groupParticipantsUpdate(remitente, [usuarioProcesar], 'remove');

      // === RESPUESTA DEFINITIVA EN UN SOLO MENSAJE CORTO Y SIN ADORNOS ===
      await sock.sendMessage(remitente, { 
        text: `👤 @${numeroImprimir} fue expulsado del grupo.`, 
        mentions: [usuarioProcesar] 
      });

    } catch (error) {
      console.error('❌ Error crítico en el comando unificado kick.js:', error);
      await sock.sendMessage(remitente, { text: '❌ Ocurrió un fallo al intentar procesar la expulsión. Asegúrate de que el bot mantenga los permisos de administrador.' }, { quoted: msg });
    }
  }
};
