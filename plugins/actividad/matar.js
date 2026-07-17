const fs = require('fs');
const path = require('path');

// Apunta de forma directa a tu video en assets/rol/matar.mp4
const rutaGifLocal = path.join(process.cwd(), 'assets', 'rol', 'matar.mp4');

module.exports = {
  // El bot responderá en tu grupo a cualquiera de estas dos palabras exactas
  comando: ['matar', 'asesinar'],
  run: async (sock, remitente, msg, obtenerMencionado) => {
    try {
      const esGrupo = remitente.endsWith('@g.us');
      if (!esGrupo) return;

      const quienEnvia = msg.key.participant || msg.key.remoteJid;
      
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.contextInfo || null;
      let mencionesEnMensaje = contextInfo?.mentionedJid || [];
      let mensajeCitated = contextInfo?.participant || null;

      let persona1 = quienEnvia; // El que manda el comando siempre toma la iniciativa 🔥
      let persona2 = '';
      let mentionsFinales = [persona1];

      // === LÓGICA EXCLUSIVA DE UNA SOLA MANERA: EL EMISOR MATA AL ETIQUETADO ===
      let objetivoMencion = Array.isArray(mencionesEnMensaje) ? mencionesEnMensaje[0] : mencionesEnMensaje;
      let quienRecibe = objetivoMencion || mensajeCitated;

      if (quienRecibe) {
        persona2 = quienRecibe;
        mentionsFinales.push(persona2);
      }
      // Si intentan usar el comando sin etiquetar o responder a nadie, les da el modo de uso correcto
      if (!persona2) {
        return await sock.sendMessage(remitente, { 
          text: '💀 *Modo de uso del Comando:*\n\nDesliza el mensaje de alguien o etiquétalo para eliminarlo: `/matar @usuario`.' 
        }, { quoted: msg });
      }

      const num1 = String(persona1).replace(/[^0-9]/g, '');
      const num2 = String(persona2).replace(/[^0-9]/g, '');

      // Texto de rol interactivo y directo 🪦⚰️
      const mensajeRol = `💀💥 *¡@${num1}* ha aniquilado por completo a *@${num2}* sin dejar rastro! 🪦⚰️`;

      if (fs.existsSync(rutaGifLocal)) {
        const streamMultimedia = fs.readFileSync(rutaGifLocal);
        
        await sock.sendMessage(remitente, { 
          video: streamMultimedia, 
          gifPlayback: true, // Lo reproduce automáticamente en bucle como un GIF real en WhatsApp
          caption: mensajeRol, 
          mentions: mentionsFinales 
        }, { quoted: msg });
      } else {
        await sock.sendMessage(remitente, { 
          text: `${mensajeRol}\n\n⚠️ _(Aviso: No se encuentra el archivo matar.mp4 dentro de assets/rol/)._`, 
          mentions: mentionsFinales 
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('❌ Error en el plugin de matar local:', error);
    }
  }
};
