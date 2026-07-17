const fs = require('fs');
const path = require('path');

module.exports = {
  // CONFIGURADO: Quitamos las barras diagonales para que tu index.js lo detecte al instante
  comando: ['agregar', 'add', 'agg'],
  run: async (sock, remitente, msg, obtenerMencionado) => {
    try {
      const esGrupo = remitente.endsWith('@g.us');
      if (!esGrupo) return; // Si no es un grupo, lo ignora en silencio

      // Extraemos el texto del mensaje original de forma limpia
      const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
      let textoString = String(textoMensaje).trim();

      // Limpieza maestra: Quitamos el comando escrito (sea cual sea de los 3) y nos quedamos solo con el número
      let partes = textoString.split(/ +/);
      partes.shift(); // Elimina la primera palabra (el comando) de forma segura
      let limpiarTexto = partes.join('');

      // Limpiamos el texto para quedarnos únicamente con los números puros
      const numeroLimpio = limpiarTexto.replace(/[^0-9]/g, '');

      // Validamos que el número tenga una longitud lógica (al menos 8 dígitos)
      if (!numeroLimpio || numeroLimpio.length < 8) {
        return await sock.sendMessage(remitente, { 
          text: '⚠️ *Uso correcto del comando:*\n\nEscribe el comando seguido del número con su código de país sin espacios ni signos.\n*Ejemplo:* `/add 18097490161` o `/agregar 5215512345678`' 
        }, { quoted: msg });
      }

      // Formateamos el ID oficial de WhatsApp para añadir usuarios
      const usuarioAgregar = `${numeroLimpio}@s.whatsapp.net`;

      // Enviamos un aviso rápido de que el bot está intentando añadirlo
      await sock.sendMessage(remitente, { text: `⏳ Intentando agregar al número +${numeroLimpio} al grupo...` }, { quoted: msg });
      // Función oficial de Baileys para agregar participantes directamente
      const respuesta = await sock.groupParticipantsUpdate(remitente, [usuarioAgregar], 'add');

      // Evaluamos la respuesta del servidor de WhatsApp según el estado devuelto:
      if (respuesta && (respuesta[0]?.status === '200' || respuesta[0]?.status === 200)) {
        await sock.sendMessage(remitente, { text: `✅ ¡El número +${numeroLimpio} ha sido agregado exitosamente al grupo!` }, { quoted: msg });
      } else if (respuesta && (respuesta[0]?.status === '403' || respuesta[0]?.status === 403)) {
        // Estado 403: El usuario tiene la privacidad activada para grupos
        await sock.sendMessage(remitente, { text: `📩 El usuario +${numeroLimpio} tiene la privacidad activada en su WhatsApp. Debes enviarle un enlace de invitación privado.` }, { quoted: msg });
      } else {
        await sock.sendMessage(remitente, { text: `❌ No se pudo agregar a +${numeroLimpio}.\n\nVerifica que el número sea correcto, que exista en WhatsApp o que el bot siga siendo administrador del grupo.` }, { quoted: msg });
      }

    } catch (error) {
      console.error('❌ Error crítico en el comando agregar.js:', error);
      await sock.sendMessage(remitente, { text: '❌ Ocurrió un error interno al intentar añadir al usuario de forma remota.' }, { quoted: msg });
    }
  }
};
