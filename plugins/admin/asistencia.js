const fs = require('fs');
const path = require('path');

module.exports = {
  comando: ['asistencia'],
  run: async (sock, remitente, msg) => {
    try {
      if (!remitente.endsWith('@g.us')) return;

      const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
      const partes = textoMensaje.toLowerCase().trim().split(/ +/);
      
      let pagina = parseInt(partes) || 1;
      if (pagina < 1) pagina = 1;

      const todosLosChats = await sock.groupFetchAllParticipating();
      const idsGrupos = Object.keys(todosLosChats);

      if (idsGrupos.length < 2) {
        return await sock.sendMessage(remitente, { text: '⚠️ *Aviso:* El bot debe estar en múltiples grupos para poder calcular la asistencia completa.' });
      }

      const idBase = remitente;
      const miembrosBase = todosLosChats[idBase]?.participants || [];
      const otrosGrupos = idsGrupos.filter(id => id !== idBase);
      const totalOtrosGrupos = otrosGrupos.length;

      const botNumero = sock.user.id.split(':') + '@s.whatsapp.net';
      const botLid = sock.user.lid || '';

      let mapaConteo = {};
      let listaEstrellas = [];

      miembrosBase.forEach(p => {
        if (p.id === botNumero || p.id === botLid || p.id.replace(/[^0-9]/g, '').length > 15 || p.id.startsWith('2036')) return;
        mapaConteo[p.id] = 0;
      });

      otrosGrupos.forEach(idG => {
        const participantesSub = todosLosChats[idG]?.participants || [];
        participantesSub.forEach(p => {
          let numeroPuro = p.id.replace(/[^0-9]/g, '');
          Object.keys(mapaConteo).forEach(idBaseUser => {
            if (idBaseUser.includes(numeroPuro)) {
              mapaConteo[idBaseUser]++;
            }
          });
        });
      });

      Object.keys(mapaConteo).forEach(id => {
        if (mapaConteo[id] >= totalOtrosGrupos) {
          listaEstrellas.push(id);
        }
      });

      const totalParaListar = listaEstrellas.length;
      const limitePorPagina = 15;
      const totalPaginas = Math.ceil(totalParaListar / limitePorPagina) || 1;

      if (pagina > totalPaginas) {
        return await sock.sendMessage(remitente, { text: `⚠️ *Aviso:* La página ${pagina} no existe. Actualmente hay un máximo de *${totalPaginas}* páginas.` });
      }

      let indiceInicio = (pagina - 1) * limitePorPagina;
      let indiceFin = indiceInicio + limitePorPagina;
      let fragmentoPaginado = listaEstrellas.slice(indiceInicio, indiceFin);

      let textoOutput = `🏆 *ASISTENCIA TOTAL (Pág. ${pagina}/${totalPaginas})* 🏆\n`;
      textoOutput += `🥇 _Lista exclusiva de miembros estrella presentes en TODOS los grupos de la comunidad:_ \n\n`;
      
      let mencionesBloque = [];
      let codigoRandom = Math.floor(1000 + Math.random() * 9000);

      fragmentoPaginado.forEach((id, indice) => {
        const posicionReal = indiceInicio + indice + 1;
        const numeroLimpio = id.split('@');
        textoOutput += `By: Esterbot ✨ *${posicionReal}.* @${numeroLimpio} ➔ Cumplido (Todas las salas)\n`;
        mencionesBloque.push(id);
      });

      textoOutput += `\n✨━━━━━━━━━━━━━━━━━━━━✨\n`;
      textoOutput += `⚙️ _Cierre seguro: *#${codigoRandom}*_\n`;
      
      if (pagina < totalPaginas) {
        textoOutput += `💡 _Usa \`/asistencia ${pagina + 1}\` para avanzar a la siguiente página._`;
      } else {
        textoOutput += `🏁 _¡Fin del reporte de asistencia de las estrellas de la comunidad!_`;
      }

      await sock.sendMessage(remitente, { text: textoOutput, mentions: mencionesBloque });

    } catch (error) {
      console.error('❌ Error en asistencia.js:', error);
    }
  }
};
