const fs = require('fs');
const path = require('path');

// Apunta directo a la carpeta assets/rol/beso.mp4 de forma suelta al lado del abrazo
const rutaGifLocal = path.join(process.cwd(), 'assets', 'rol', 'beso.mp4');

module.exports = {
  comando: ['besar', 'beso'],
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
          let num1Texto = coincidencias[0].replace('@', '');
          let num2Texto = coincidencias[1].replace('@', '');

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
          text: '🌸 *Modo de uso del Beso Manhwa:*\n\n1. Desliza el mensaje de alguien o etiquétalo: `/beso @usuario`.\n2. Etiqueta a dos personas distintas: `/besar @usuario1 @usuario2`.' 
        }, { quoted: msg });
      }

      const num1 = String(persona1).replace(/[^0-9]/g, '');
      const num2 = String(persona2).replace(/[^0-9]/g, '');

      // TEXTO REFORMADO: Cortito, con lengua y emojis súper hot para el grupo 🥵🔥
      const mensajeRol = `🥵🔥 *¡@${num1}* le da un beso con lengua bien apasionado a *@${num2}*! 💋💦`;

      if (fs.existsSync(rutaGifLocal)) {
        const streamMultimedia = fs.readFileSync(rutaGifLocal);
        
        await sock.sendMessage(remitente, { 
          video: streamMultimedia, 
          gifPlayback: true, // Animación automática en bucle infinito
          caption: mensajeRol, 
          mentions: mentionsFinales 
        }, { quoted: msg });
      } else {
        await sock.sendMessage(remitente, { 
          text: `${mensajeRol}\n\n⚠️ _(Aviso: No se encuentra el archivo beso.mp4 dentro de assets/rol/)._`, 
          mentions: mentionsFinales 
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('❌ Error en el plugin de beso local:', error);
    }
  }
};
