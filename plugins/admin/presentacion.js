const fs = require('fs');
const path = require('path');

module.exports = {
  // CONFIGURADO: Quitamos las barras diagonales para que tu index.js lo detecte al instante
  comando: ['presentacion', 'presentación'],
  run: async (sock, remitente, msg, obtenerMencionado) => {
    try {
      const esGrupo = remitente.endsWith('@g.us');
      if (!esGrupo) return; // Solo funciona en grupos

      // 1. OBTENEMOS LOS PARTICIPANTES REALES FILTRANDO IDENTIDADES TÉCNICAS
      const metadatosGrupo = await sock.groupMetadata(remitente);
      
      const botNumero = sock.user.id.split(':') + '@s.whatsapp.net';
      const botLid = sock.user.lid || '';

      let listaMencionesFantasmas = [];
      metadatosGrupo.participants.forEach(p => {
        // Filtramos al bot y a cualquier ID técnico del sistema de más de 15 dígitos para evitar lag
        if (p.id === botNumero || p.id === botLid || p.id.replace(/[^0-9]/g, '').length > 15 || p.id.startsWith('2036')) return;
        listaMencionesFantasmas.push(p.id);
      });

      // 2. CONSTRUIMOS TU FICHA EXACTA SIN MENCIONES VISIBLES
      let textoFicha = `꧁⚡︎°𝐀LFA X OMEGAS°⚡︎꧂\n`;
      textoFicha += `¡Bienvenido/a!\n\n`;
      textoFicha += `-Llena la siguiente ficha para poder conocerte mejor.\n`;
      textoFicha += `> Ojo: Esta información no saldrá de este grupo.\n\n`;
      
      textoFicha += `* Nombre:\n`;
      textoFicha += `* Edad:\n`;
      textoFicha += `* País:\n`;
      textoFicha += `* Manhwa favorito :\n`;
      textoFicha += `* Personaje favorito :\n`;
      textoFicha += `* Que te gusta :\n`;
      textoFicha += `* Que te disgusta:\n`;
      textoFicha += `* Que tan activo/a eres:\n\n`;
      textoFicha += `⚠️ *Importante*\n\n`;
      textoFicha += `-Tienes 24 horas maximo para responder la ficha \n`;
      textoFicha += `-Lee cada regla del grupo para evitar tener inconvenientes \n`;
      textoFicha += `-Si te desagrada algo de la comunidad puedes escribir en privado a las admins e indicarlo .\n`;
      textoFicha += `> Ojo : Se te dará una bienvenida con stickers si no te agrada debes de indicarlo antes para avisar .\n\n`;
      
      textoFicha += `Gracias por unirte a nuestra comunidad espero puedas adaptarte rápidamente y disfrutar \n`;
      textoFicha += `Att: Admins`;

      // 3. ENVIAMOS EL MENSAJE CON LA LISTA DE MIEMBROS OCULTA EN "MENTIONS"
      // Se inyecta la lista purificada para que a los 130 miembros reales les suene el celular obligatoriamente
      await sock.sendMessage(remitente, { 
        text: textoFicha, 
        mentions: listaMencionesFantasmas 
      }, { quoted: msg });

    } catch (error) {
      console.error('❌ Error crítico en el comando de presentacion.js fantasma:', error);
    }
  }
};
