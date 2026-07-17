const fs = require('fs');
const path = require('path');

module.exports = {
  // CONFIGURADO: Sincronizado con la lista de restricciones de tu index.js
  comando: ['todos', 'all', 'tag'], 
  run: async (sock, remitente, msg) => {
    try {
      if (!remitente.endsWith('@g.us')) return;

      // 1. OBTENEMOS LOS PARTICIPANTES REALES FILTRANDO IDENTIDADES TÉCNICAS
      const infoGrupo = await sock.groupMetadata(remitente);
      
      const botNumero = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const botLid = sock.user.lid || '';

      let listaJidsFiltrados = [];
      infoGrupo.participants.forEach(p => {
        // Filtramos al bot y a cualquier ID técnico de comunidad de más de 15 dígitos para evitar lag y bloqueos
        if (p.id === botNumero || p.id === botLid || p.id.replace(/[^0-9]/g, '').length > 15 || p.id.startsWith('2036')) return;
        listaJidsFiltrados.push(p.id);
      });

      // 2. REVISAR SI EL COMANDO SE USÓ COMENTANDO/RESPONDIENDO A OTRO MENSAJE
      const mensajeCitado = msg.message?.extendedTextMessage?.contextInfo;
      let textoFinal = "";

      if (mensajeCitado && mensajeCitado.quotedMessage) {
        // Si respondiste a un mensaje, extraemos el contenido de ese mensaje citado de forma limpia
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
      // 3. Enviar el texto con la mención fantasma oculta y purificada
      // CORRECCIÓN SOLICITADA: Eliminamos la propiedad de respuesta quoted para que el mensaje salga 100% limpio y suelto
      await sock.sendMessage(remitente, { 
        text: textoFinal, 
        mentions: listaJidsFiltrados 
      });

    } catch (error) {
      console.error('❌ Error crítico en el comando de mención masiva tagall.js:', error);
    }
  }
};
