const fs = require('fs');
const path = require('path');

module.exports = {
  // CONFIGURADO: Ahora el bot solo responde a esta palabra exacta
  comando: ['coger'],
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

      let persona1 = quienEnvia; 
      let persona2 = '';
      let persona3 = '';
      let mentionsFinales = [persona1];
      let modoTres = false;

      if (mencionesEnMensaje.length >= 2) {
        let coincidencias = textoString.match(/@[0-9]+/g);
        
        if (coincidencias && coincidencias.length >= 2) {
          let num1Texto = String(coincidencias[0]).replace('@', '');
          let num2Texto = String(coincidencias[1]).replace('@', '');

          persona2 = mencionesEnMensaje.find(jid => jid.includes(num1Texto)) || mencionesEnMensaje[0];
          persona3 = mencionesEnMensaje.find(jid => jid.includes(num2Texto)) || mencionesEnMensaje[1];
        } else {
          persona2 = mencionesEnMensaje[0];
          persona3 = mencionesEnMensaje[1];
        }
        
        if (persona2 && persona3) {
          mentionsFinales.push(persona2, persona3);
          modoTres = true;
        }
      } else {
        let objetivoMencion = Array.isArray(mencionesEnMensaje) ? mencionesEnMensaje[0] : mencionesEnMensaje;
        let quienRecibe = objetivoMencion || mensajeCitated;

        if (quienRecibe) {
          persona2 = quienRecibe;
          mentionsFinales.push(persona2);
        }
      }
      if (!persona2) {
        return await sock.sendMessage(remitente, { 
          text: '😈 *Modo de uso del Comando:*\n\n1. Etiqueta o responde a alguien: `/coger @usuario`.\n2. Etiqueta a dos personas a la vez: `/coger @usuario1 @usuario2`.' 
        }, { quoted: msg });
      }

      const num1 = String(persona1).replace(/[^0-9]/g, '');
      const num2 = String(persona2).replace(/[^0-9]/g, '');
      let mensajeRol = '';

      // Lista exclusiva de rimas picantes aleatorias
      const rimasUnUsuario = [
        `le da duro contra el muro, macizo contra el piso 💥🥵`,
        `le da lento en el pavimento y contento contra el cemento 🛣️🔥`,
        `le da sin consuelo en el suelo y despacio hasta el espacio 🌌🚀`,
        `le da violento contra el asiento y sin consuelo en la arena 🏖️😈`,
        `le da rudo en el oscuro y fluido contra el fluido 😶‍🌫️🫣`,
        `le da de frente en la corriente y de bajada en la velada 🎢💦`
      ];

      const rimasDosUsuarios = [
        `les da duro contra el muro y macizo contra el piso a ambos 💥🥵`,
        `les da lento en el pavimento y contentos contra el cemento en combo 🛣️🔥`,
        `les da sin consuelo en el suelo y despacio hasta el espacio en un viaje salvaje 🌌🚀`,
        `les da violento contra el asiento y sin consuelo en la arena a las dos 🏖️😈`,
        `les da rudo en el oscuro y sin frenos en pleno terreno a los dos a la vez 🏎️💨`
      ];

      // Selección aleatoria
      const rimaElegidaUno = rimasUnUsuario[Math.floor(Math.random() * rimasUnUsuario.length)];
      const rimaElegidaDos = rimasDosUsuarios[Math.floor(Math.random() * rimasDosUsuarios.length)];

      if (!modoTres) {
        // Un solo usuario etiquetado
        mensajeRol = `🔥━━━━━━━━━━━━━━━━━🔥\n😈💦 *¡@${num1}* agarra a *@${num2}* y ${rimaElegidaUno} 👉👈\n🔥━━━━━━━━━━━━━━━━━🔥`;
      } else {
        // Dos usuarios etiquetados a la vez
        const num3 = String(persona3).replace(/[^0-9]/g, '');
        mensajeRol = `😈━━━━━━━━━━━━━━━━━😈\n👑🔥 *¡@${num1}* anda con todo el antojo y ${rimaElegidaDos} a *@${num2}* y a *@${num3}* 🥵💦👀\n😈━━━━━━━━━━━━━━━━━😈`;
      }

      await sock.sendMessage(remitente, { 
        text: mensajeRol, 
        mentions: mentionsFinales 
      }, { quoted: msg });

    } catch (error) {
      console.error('❌ Error en el plugin de coger local:', error);
    }
  }
};
