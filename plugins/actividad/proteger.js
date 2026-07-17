const fs = require('fs');
const path = require('path');

module.exports = {
  // El bot responderá en tu grupo a cualquiera de estas dos palabras exactas
  comando: ['proteger', 'protejo'],
  run: async (sock, remitente, msg, obtenerMencionado) => {
    try {
      const esGrupo = remitente.endsWith('@g.us');
      if (!esGrupo) return;

      const quienEnvia = msg.key.participant || msg.key.remoteJid;
      
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.contextInfo || null;
      let mencionesEnMensaje = contextInfo?.mentionedJid || [];
      let mensajeCitated = contextInfo?.participant || null;

      const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
      let textoString = String(textoMensaje);

      let persona1 = '';
      let persona2 = '';
      let mentionsFinales = [];
      let modoTres = false; // Nos ayuda a saber si son dos etiquetas completas

      // === SISTEMA DINÁMICO DE TRES VÍAS (SITUACIÓN 1, 2 Y 3) ===
      if (mencionesEnMensaje.length >= 2) {
        // SITUACIÓN 3: Dos personas etiquetadas (Persona 1 protege a Persona 2)
        let coincidencias = textoString.match(/@[0-9]+/g);
        
        if (coincidencias && coincidencias.length >= 2) {
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
        modoTres = true;
      } else {
        let objetivoMencion = Array.isArray(mencionesEnMensaje) ? mencionesEnMensaje[0] : mencionesEnMensaje;
        let quienRecibe = objetivoMencion || mensajeCitated;

        if (!quienRecibe) {
          // SITUACIÓN 1: No etiquetan a nadie (La persona que lo manda se protege a sí misma)
          persona1 = quienEnvia;
          mentionsFinales = [persona1];
        } else {
          // SITUACIÓN 2: Una etiqueta o citado (La persona que lo manda protege a quien etiqueta)
          persona1 = quienEnvia;
          persona2 = quienRecibe;
          mentionsFinales = [persona1, persona2];
        }
      }
      const num1 = String(persona1).replace(/[^0-9]/g, '');
      let mensajeRol = '';

      // Construcción del texto de rol estético con emojis lindos según las 3 situaciones exactas que pediste
      if (!persona2) {
        // Situación 1: Autoprotección
        mensajeRol = `✨━━━━━━━━━━━━━━━━━✨\n🛡️🌟 *¡@${num1}* activa su aura mágica y se protege a sí mismo con un hermoso escudo de estrellitas! 💫🧸\n✨━━━━━━━━━━━━━━━━━✨`;
      } else if (persona2 && !modoTres) {
        // Situación 2: El emisor protege al etiquetado
        const num2 = String(persona2).replace(/[^0-9]/g, '');
        mensajeRol = `🌸━━━━━━━━━━━━━━━━━🌸\n🛡️💞 *¡@${num1}* corre a abrazar y proteger de todo mal a *@${num2}* con todas sus fuerzas! ✨👼🎀\n🌸━━━━━━━━━━━━━━━━━🌸`;
      } else {
        // Situación 3: El primer etiquetado protege al segundo
        const num2 = String(persona2).replace(/[^0-9]/g, '');
        mensajeRol = `🍃━━━━━━━━━━━━━━━━━🍃\n🛡️🔮 *¡@${num1}* despliega sus alitas de luz para cuidar y proteger con mucho amor a *@${num2}*... 🧸💫🎀\n🍃━━━━━━━━━━━━━━━━━🍃`;
      }

      // Envío directo en formato de texto hermosamente decorado
      await sock.sendMessage(remitente, { 
        text: mensajeRol, 
        mentions: mentionsFinales 
      }, { quoted: msg });

    } catch (error) {
      console.error('❌ Error en el plugin de proteger local:', error);
    }
  }
};
