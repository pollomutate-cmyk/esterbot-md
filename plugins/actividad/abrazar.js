const fs = require('fs');
const path = require('path');

// Ruta exacta al archivo de video en formato MP4 local
const rutaGifLocal = path.join(process.cwd(), 'assets', 'rol', 'abrazo.mp4');

module.exports = {
  comando: ['abrazar', 'abrazo'],
  run: async (sock, remitente, msg, obtenerMencionado) => {
    try {
      const esGrupo = remitente.endsWith('@g.us');
      if (!esGrupo) return;

      const quienEnvia = msg.key.participant || msg.key.remoteJid;
      
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.contextInfo || null;
      let mencionesEnMensaje = contextInfo?.mentionedJid || [];
      let mensajeCitado = contextInfo?.participant || null;

      // Convertimos el texto del mensaje a un String manipulable
      const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
      let textoString = String(textoMensaje);

      let persona1 = '';
      let persona2 = '';
      let mentionsFinales = [];

      // === SISTEMA DE ETICUETAS AZULES SIN CARACTERES ROTOS ===
      if (mencionesEnMensaje.length >= 2) {
        // Escaneamos las menciones del texto original de izquierda a derecha
        let coincidencias = textoString.match(/@[0-9]+/g);
        
        if (coincidencias && coincidencias.length >= 2) {
          let num1Texto = coincidencias[0].replace('@', '');
          let num2Texto = coincidencias[1].replace('@', '');

          // Buscamos las IDs nativas reales del grupo que coincidan con esos números para que salgan en azul
          let encontrarP1 = mencionesEnMensaje.find(jid => jid.includes(num1Texto));
          let encontrarP2 = mencionesEnMensaje.find(jid => jid.includes(num2Texto));

          persona1 = encontrarP1 || mencionesEnMensaje[0];
          persona2 = encontrarP2 || mencionesEnMensaje[1];
        } else {
          persona1 = mencionesEnMensaje[0];
          persona2 = mencionesEnMensaje[1];
        }
        mentionsFinales = [persona1, persona2];
      } 
      // Forma 1: Si solo etiqueta a uno o si deslizó la burbuja para responderle
      else {
        persona1 = quienEnvia; 
        let objetivoMencion = Array.isArray(mencionesEnMensaje) ? mencionesEnMensaje[0] : mencionesEnMensaje;
        persona2 = objetivoMencion || mensajeCitado; 
        mentionsFinales = [persona1, persona2];
      }

      if (!persona2 || persona1 === persona2) {
        return await sock.sendMessage(remitente, { 
          text: '🌸 *Modo de uso del Abrazo Manhwa:*\n\n1. Desliza el mensaje de alguien o etiquétalo: `/abrazo @usuario`.\n2. Etiqueta a dos personas distintas: `/abrazar @usuario1 @usuario2`.' 
        }, { quoted: msg });
      }

      // Extraemos solo los números telefónicos limpios únicamente para pintar el texto estético
      const num1 = String(persona1).split('@')[0].split(':')[0];
      const num2 = String(persona2).split('@')[0].split(':')[0];

      // Mensaje hermoso y limpio con el orden exacto de tu pantalla
      const mensajeRol = `✨🌸 *¡Momento de un Abrazo!* 🌸✨\n\n💬 *@${num1}* le da un abrazo súper cálido y protector a *@${num2}*. 💕🍃`;

      if (fs.existsSync(rutaGifLocal)) {
        const streamMultimedia = fs.readFileSync(rutaGifLocal);
        
        await sock.sendMessage(remitente, { 
          video: streamMultimedia, 
          gifPlayback: true, 
          caption: mensajeRol, 
          mentions: mentionsFinales // Inyectamos las IDs nativas reales para forzar las menciones azules sin errores
        }, { quoted: msg });
      } else {
        await sock.sendMessage(remitente, { 
          text: `${mensajeRol}\n\n⚠️ _(Aviso: No se encuentra el archivo abrazo.mp4 dentro de assets/rol/)._`, 
          mentions: mentionsFinales 
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('❌ Error en el plugin de abrazar con etiquetas reales:', error);
    }
  }
};
