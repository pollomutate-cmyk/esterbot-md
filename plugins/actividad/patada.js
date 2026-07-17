const fs = require('fs');
const path = require('path');

// Apunta de forma directa a tu nuevo archivo assets/rol/patada.mp4
const rutaGifLocal = path.join(process.cwd(), 'assets', 'rol', 'patada.mp4');

module.exports = {
  // El bot responderá en tu grupo a cualquiera de estas dos palabras exactas
  comando: ['patada', 'patear'],
  run: async (sock, remitente, msg, obtenerMencionado) => {
    try {
      const esGrupo = remitente.endsWith('@g.us');
      if (!esGrupo) return;

      const quienEnvia = msg.key.participant || msg.key.remoteJid;
      
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.contextInfo || null;
      let mencionesEnMensaje = contextInfo?.mentionedJid || [];
      let mensajeCitado = contextInfo?.participant || null;

      const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
      let textoString = String(textoMensaje);

      let persona1 = '';
      let persona2 = '';
      let mentionsFinales = [];

      // === SISTEMA DE ETIQUETAS CRONOLÓGICAS (IZQUIERDA A DERECHA) ===
      if (mencionesEnMensaje.length >= 2) {
        let coincidencias = textoString.match(/@[0-9]+/g);
        
        if (coincidencias && coincidencias.length >= 2) {
          // Corrección crítica: Extraemos el string del array de coincidencias de forma segura
          let num1Texto = String(coincidencias[0]).replace('@', '');
          let num2Texto = String(coincidencias[1]).replace('@', '');

          let encontrarP1 = mencionesEnMensaje.find(jid => jid.includes(num1Texto));
          let encontrarP2 = mencionesEnMensaje.find(jid => jid.includes(num2Texto));

          persona1 = encontrarP1 || mencionesEnMensaje[0];
          persona2 = encontrarP2 || mencionesEnMensaje[1];
        } else {
          persona1 = mencionesEnMensaje[0];
          persona2 = mencionesEnMensaje[1];
        }
        mentionsFinales = [persona1, persona2];
      } else {
        persona1 = quienEnvia; 
        let objetivoMencion = Array.isArray(mencionesEnMensaje) ? mencionesEnMensaje[0] : mencionesEnMensaje;
        persona2 = objetivoMencion || mensajeCitado; 
        mentionsFinales = [persona1, persona2];
      }
      if (!persona2 || persona1 === persona2) {
        return await sock.sendMessage(remitente, { 
          text: '🌸 *Modo de uso de la Patada:*\n\n1. Desliza el mensaje de alguien o etiquétalo: `/patada @usuario`.\n2. Etiqueta a dos personas distintas: `/patada @usuario1 @usuario2`.' 
        }, { quoted: msg });
      }

      const num1 = String(persona1).replace(/[^0-9]/g, '');
      const num2 = String(persona2).replace(/[^0-9]/g, '');

      // Texto cortito, dinámico y muy divertido 🦶💥
      const mensajeRol = `💥🦶 *¡@${num1}* le mete una patada voladora a *@${num2}*! 💢😂`;

      if (fs.existsSync(rutaGifLocal)) {
        const streamMultimedia = fs.readFileSync(rutaGifLocal);
        
        await sock.sendMessage(remitente, { 
          video: streamMultimedia, 
          gifPlayback: true, // Reproducción automática interactiva en bucle (simula un GIF real)
          caption: mensajeRol, 
          mentions: mentionsFinales 
        }, { quoted: msg });
      } else {
        await sock.sendMessage(remitente, { 
          text: `${mensajeRol}\n\n⚠️ _(Aviso: No se encuentra el archivo patada.mp4 dentro de assets/rol/)._`, 
          mentions: mentionsFinales 
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('❌ Error en el plugin de patada local:', error);
    }
  }
};
