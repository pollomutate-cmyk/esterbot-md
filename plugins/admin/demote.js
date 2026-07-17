const fs = require('fs');
const path = require('path');

module.exports = {
  // CONFIGURADO: Sin barras diagonales para que tu index.js lo detecte al instante
  comando: ['demote', 'despromover', 'quitaradmin'],
  run: async (sock, remitente, msg, obtenerMencionado) => {
    try {
      const esGrupo = remitente.endsWith('@g.us');
      if (!esGrupo) return await sock.sendMessage(remitente, { text: '❌ Este comando solo puede ser usado en grupos.' });

      // Busca el usuario primero por reacción, si no por mención/etiqueta
      let usuarioDemote = msg.usuarioObjetivoReaccion || obtenerMencionado(msg);

      // Si es un arreglo (varias menciones), tomamos la primera de forma segura
      if (Array.isArray(usuarioDemote)) {
        usuarioDemote = usuarioDemote[0];
      }

      if (!usuarioDemote || typeof usuarioDemote !== 'string') {
        return await sock.sendMessage(remitente, { 
          text: '⚠️ *Modo de uso del Comando:*\n\nMenciona a un administrador, responde a su mensaje o reacciona con el emoji 🚫 para quitarle el cargo.\n\n*Ejemplo:* `/demote @usuario`' 
        }, { quoted: msg });
      }

      // Quitar administrador de forma oficial en los servidores de WhatsApp
      await sock.groupParticipantsUpdate(remitente, [usuarioDemote], 'demote');
      // Limpiamos el número telefónico para armar la etiqueta final
      const numeroLimpio = String(usuarioDemote).replace(/[^0-9]/g, '');
      
      // Mensaje de confirmación con la frase exacta y emojis más estéticos
      await sock.sendMessage(remitente, { 
        text: `📉💥 *¡@${numeroLimpio}* ya no es administrador del grupo! 💢☠️`, 
        mentions: [usuarioDemote] 
      }, { quoted: msg });

    } catch (error) {
      console.error('❌ Error crítico en el comando demote.js:', error);
      await sock.sendMessage(remitente, { 
        text: '❌ Ocurrió un error interno. Asegúrate de que el bot siga siendo administrador del grupo.' 
      }, { quoted: msg });
    }
  }
};
