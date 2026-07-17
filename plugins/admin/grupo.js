const fs = require('fs');
const path = require('path');

module.exports = {
  // CONFIGURADO: Sin barras diagonales para que tu index.js lo detecte al instante
  comando: ['cerrar', 'abrir', 'close', 'open'], 
  run: async (sock, remitente, msg) => {
    try {
      const esGrupo = remitente.endsWith('@g.us');
      if (!esGrupo) return; 

      const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
      let textoLimpio = String(textoMensaje).toLowerCase().trim();
      
      let partes = textoLimpio.startsWith('/') ? textoLimpio.slice(1).split(/ +/) : textoLimpio.split(/ +/);
      let comandoUsado = partes[0];

      // 🔒 CASO 1: CERRAR EL GRUPO
      if (comandoUsado === 'cerrar' || comandoUsado === 'close') {
        await sock.groupSettingUpdate(remitente, 'announcement');
        
        // Mensaje 1: Corto y limpio, calcado de tu formato original
        await sock.sendMessage(remitente, { text: '🔒 Grupo cerrado.' });

        // Mensaje 2: DISEÑO 100% EXCLUSIVO - Formato de bloques angulares y diamantes
        let msgCierre = `◢◤━━━━━━━━ ✦ ━━━━━━━━◥◣\n`;
        msgCierre += `🔒   *CHAT BLOQUEADO*   🔒\n`;
        msgCierre += `◥◣━━━━━━━━ ✦ ━━━━━━━━◢◤\n\n`;
        msgCierre += `🚫 _A partir de este momento el chat ha sido bloqueado._\n\n`;
        msgCierre += `💎 _Solo los admins pueden escribir._`;
        
        await sock.sendMessage(remitente, { text: msgCierre });
      }
      // 🟢 CASO 2: ABRIR EL GRUPO
      if (comandoUsado === 'abrir' || comandoUsado === 'open') {
        await sock.groupSettingUpdate(remitente, 'not_announcement');
        
        // Mensaje 1: Con los dos signos de exclamación en recuadros rojos ‼️
        await sock.sendMessage(remitente, { text: '‼️ *Grupo Abierto.* ‼️' });

        // Mensaje 2: DISEÑO 100% EXCLUSIVO - Formato de bloques angulares y destellos
        let msgApertura = `◢◤━━━━━━━━ ✦ ━━━━━━━━◥◣\n`;
        msgApertura += `🔓   *CHAT DESBLOQUEADO*   🔓\n`;
        msgApertura += `◥◣━━━━━━━━ ✦ ━━━━━━━━◢◤\n\n`;
        msgApertura += `✨ _El chat ha sido desbloqueado._\n\n`;
        msgApertura += `⚡ _Todos los miembros pueden mandar mensajes._`;
        
        await sock.sendMessage(remitente, { text: msgApertura });
      }

    } catch (error) {
      console.error('❌ Error crítico en el comando de abrir/cerrar grupo:', error);
      await sock.sendMessage(remitente, { 
        text: '❌ No se pudo cambiar la configuración del chat. Verifica que el bot siga siendo Administrador.' 
      }, { quoted: msg });
    }
  }
};
