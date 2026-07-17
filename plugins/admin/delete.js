const fs = require('fs');
const path = require('path');

module.exports = {
  // CONFIGURADO: Sin barras diagonales para que tu index.js lo detecte al instante
  comando: ['delete', 'del', 'dell', 'eliminar', 'borrar'],
  run: async (sock, remitente, msg, obtenerMencionado) => {
    try {
      const esGrupo = remitente.endsWith('@g.us');
      if (!esGrupo) return;

      // Buscamos el contexto del mensaje citado (al que estás respondiendo)
      const context = msg.message?.extendedTextMessage?.contextInfo || null;
      
      // Si el administrador no está citando ningún mensaje, salimos en silencio absoluto
      if (!context || !context.stanzaId || !context.participant) return;

      // Detectamos de forma dinámica si el mensaje citado es tuyo, de otro o del bot
      const esMensajeMio = context.participant === sock.user.id.split(':')[0] + '@s.whatsapp.net';

      // Estructuramos la clave exacta del mensaje del usuario para hacer "Eliminar para todos"
      const claveMensajeCitado = {
        remoteJid: remitente,
        fromMe: esMensajeMio, // Dinámico: Evita que el servidor rechace la orden de borrado
        id: context.stanzaId,
        participant: context.participant
      };
      try {
        // 1. Borramos primero el mensaje del usuario (Eliminar para todos como admin)
        await sock.sendMessage(remitente, { delete: claveMensajeCitado });
        
        // 2. Si el anterior tuvo éxito, borramos de inmediato tu comando escrito para no dejar rastro
        await sock.sendMessage(remitente, { delete: msg.key });
      } catch (errorInterno) {
        // Si no se puede borrar (por ejemplo, si te quitaron el admin), el bot avisa
        console.error('❌ Error al intentar eliminar para todos:', errorInterno);
        await sock.sendMessage(remitente, { 
          text: '❌ No se pudo eliminar el mensaje para todos. Asegúrate de que el bot siga siendo administrador del grupo.' 
        });
      }

    } catch (error) {
      console.error('❌ Error general en delete.js:', error);
    }
  }
};
