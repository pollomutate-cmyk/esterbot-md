const fs = require('fs');
const path = require('path');

// Apunta con total precisión a la raíz donde tu nuevo index.js guarda el JSON
const rutaDb = path.join(process.cwd(), 'actividad.json');

module.exports = {
  // CONFIGURADO: Sincronizado con la lista de restricciones de tu index.js
  comando: ['miestado', 'actividad'], 
  run: async (sock, remitente, msg, obtenerMencionado) => {
    try {
      if (!remitente.endsWith('@g.us')) return;

      if (!fs.existsSync(rutaDb)) return await sock.sendMessage(remitente, { text: '❌ No hay registros de actividad creados aún.' }, { quoted: msg });
      let db = JSON.parse(fs.readFileSync(rutaDb, 'utf-8'));
      let actividadGrupo = db[remitente] || {};

      const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
      let textoString = String(textoMensaje).trim();

      let usuarioObjetivo = null;

      // === SISTEMA INTELIGENTE DE TRES VÍAS PARA GRUPOS CERRADOS ===
      
      // Vía 1: Buscar por etiquetas/menciones directas en el texto (ej: /miestado @usuario)
      let mencionadoContexto = obtenerMencionado(msg);
      if (mencionadoContexto) {
        usuarioObjetivo = Array.isArray(mencionadoContexto) ? mencionadoContexto[0] : mencionadoContexto;
      }

      // Vía 2: Si no hay etiqueta, busca si se usó respondiendo/citando un mensaje
      if (!usuarioObjetivo && msg.message?.extendedTextMessage?.contextInfo?.participant) {
        usuarioObjetivo = msg.message.extendedTextMessage.contextInfo.participant;
      }
      
      // Vía 3: Si no hay etiqueta ni citado, muestra el estado de la persona que mandó el comando
      if (!usuarioObjetivo) {
        usuarioObjetivo = msg.key.participant || msg.key.remoteJid;
      }

      // Extrae la firma del identificador híbrido sin alterar su tipo original
      let usuarioLimpio = String(usuarioObjetivo).trim();
      let numeroImprimir = usuarioLimpio.split('@')[0];
      // Extrae los datos reales guardados por el nuevo motor de tu index.js
      let datos = actividadGrupo[usuarioLimpio] || { mensajes: 0, reacciones: 0 };

      // Diseño visual hermoso, limpio y simétrico con la mención en azul brillante
      let textoEstatus = `📊 ━━━━━━━━━━━━━━━━━━━━ 📊\n`;
      textoEstatus += `📈    *ESTATUS DE ACTIVIDAD*    📈\n`;
      textoEstatus += `📊 ━━━━━━━━━━━━━━━━━━━━ 📊\n\n`;
      textoEstatus += `👤 *Usuario:* @${numeroImprimir}\n\n`;
      textoEstatus += `✨━━━━━━━━━━━━━━━━━━━━✨\n`;
      textoEstatus += `💬 *Mensajes enviados:*  *${datos.mensajes || 0}*\n`;
      textoEstatus += `❤️ *Reacciones puestas:*  *${datos.reacciones || 0}*\n`;
      textoEstatus += `✨━━━━━━━━━━━━━━━━━━━━✨\n\n`;
      textoEstatus += `⏳ _Nota: Los contadores se vacían automáticamente cada 15 días o a fin de mes._`;

      // Envía el panel respondiendo al comando y activando el enlace azul del usuario
      await sock.sendMessage(remitente, { 
        text: textoEstatus, 
        mentions: [usuarioLimpio] 
      }, { quoted: msg });

    } catch (error) {
      console.error('❌ Error crítico en el comando estatusUsuario.js:', error);
    }
  }
};
