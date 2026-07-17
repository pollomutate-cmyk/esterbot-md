const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
  // CONFIGURADO: Sincronizado exactamente con las restricciones de tu index.js
  comando: ['reenviar', 'hidetag', 'totaltag', 'hideall'],
  run: async (sock, remitente, msg, obtenerMencionado) => {
    try {
      const esGrupo = remitente.endsWith('@g.us');
      if (!esGrupo) return; // Si no es un grupo, sale en silencio absoluto

      // 1. Buscamos el contexto del mensaje citado (al que estás respondiendo)
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.contextInfo || null;
      
      if (!contextInfo || !contextInfo.quotedMessage) {
        return await sock.sendMessage(remitente, { 
          text: '⚠️ *Uso correcto del comando:*\n\nResponde a un mensaje, foto o video y escribe: `/reenviar` o `/hidetag`.' 
        }, { quoted: msg });
      }

      // 2. Descargamos de forma inmediata la lista real de miembros presentes para la mención masiva
      const infoGrupo = await sock.groupMetadata(remitente);
      
      const botNumero = sock.user.id.split(':') + '@s.whatsapp.net';
      const botLid = sock.user.lid || '';

      let listaMencionesFantasmas = [];
      infoGrupo.participants.forEach(p => {
        // Filtramos al bot y a cualquier ID técnico del sistema de más de 15 dígitos
        if (p.id === botNumero || p.id === botLid || p.id.replace(/[^0-9]/g, '').length > 15) return;
        listaMencionesFantasmas.push(p.id);
      });

      // CONFIGURACIÓN DIRECTA: Eliminamos la línea de borrado de comando para que se quede fijo en el chat

      // 3. Extraer el tipo de mensaje para reenviarlo de forma nativa e inyectar el sonido de las menciones
      const m = contextInfo.quotedMessage;
      const tipoMensaje = Object.keys(m);
      
      let opcionesMensaje = { contextInfo: { mentionedJid: listaMencionesFantasmas } };
      // === EXTRACTOR MAESTRO MULTIMEDIA PARA FORZAR NOTIFICACIONES ===
      if (tipoMensaje === 'conversation' || tipoMensaje === 'extendedTextMessage') {
        const textoClonado = m.conversation || m.extendedTextMessage?.text || "";
        await sock.sendMessage(remitente, { text: textoClonado, ...opcionesMensaje });
      } 
      else if (tipoMensaje === 'imageMessage') {
        const stream = await downloadContentFromMessage(m.imageMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }
        await sock.sendMessage(remitente, { image: buffer, caption: m.imageMessage.caption || "", ...opcionesMensaje });
      } 
      else if (tipoMensaje === 'videoMessage') {
        const stream = await downloadContentFromMessage(m.videoMessage, 'video');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }
        await sock.sendMessage(remitente, { video: buffer, caption: m.videoMessage.caption || "", gifPlayback: m.videoMessage.gifPlayback || false, ...opcionesMensaje });
      } 
      else if (tipoMensaje === 'audioMessage') {
        const stream = await downloadContentFromMessage(m.audioMessage, 'audio');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }
        await sock.sendMessage(remitente, { audio: buffer, ptt: m.audioMessage.ptt || false, ...opcionesMensaje });
      } 
      else if (tipoMensaje === 'documentMessage') {
        const stream = await downloadContentFromMessage(m.documentMessage, 'document');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }
        await sock.sendMessage(remitente, { document: buffer, mimetype: m.documentMessage.mimetype, fileName: m.documentMessage.fileName || "Archivo", ...opcionesMensaje });
      } 
      else {
        // Si es un tipo de mensaje extraño, lo enviamos como estructura clonada alternativa
        await sock.sendMessage(remitente, { forward: { key: msg.key, message: m }, ...opcionesMensaje });
      }

    } catch (error) {
      console.error('❌ Error crítico en el comando administrativo reenviar.js:', error);
      await sock.sendMessage(remitente, { text: '❌ Ocurrió un error interno al intentar propagar la notificación masiva.' }, { quoted: msg });
    }
  }
};
