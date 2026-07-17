const fs = require('fs');
const path = require('path');

const rutaDb = path.join(process.cwd(), 'actividad.json');

module.exports = {
  comando: ['topreacciones', 'menosreacciones'], 
  run: async (sock, remitente, msg) => {
    try {
      if (!remitente.endsWith('@g.us')) return;

      if (!fs.existsSync(rutaDb)) return await sock.sendMessage(remitente, { text: '❌ No hay registros de reacciones creados aún.' });
      let db = JSON.parse(fs.readFileSync(rutaDb, 'utf-8'));
      let actividadGrupo = db[remitente] || {};

      const infoGrupo = await sock.groupMetadata(remitente);
      const participantes = infoGrupo.participants;

      const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
      const partes = textoMensaje.toLowerCase().trim().split(/ +/);
      
      let pagina = 1;
      for (const parte of partes) {
        let posibleNumero = parseInt(parte.replace(/[^0-9]/g, ''));
        if (posibleNumero && posibleNumero > 0) {
          pagina = posibleNumero;
          break;
        }
      }

      let listaUsuarios = [];
      participantes.forEach(p => {
        let numeroPuro = p.id.replace(/[^0-9]/g, '');
        if (p.id.includes(sock.user.id.split(':')) || numeroPuro.length > 15 || p.id.startsWith('2036')) return;

        let datos = actividadGrupo[p.id] || { mensajes: 0, reacciones: 0 };
        listaUsuarios.push({ id: p.id, reacciones: parseInt(datos.reacciones) || 0 });
      });

      const textoLimpioComando = partes[0] || "";
      if (textoLimpioComando.includes('topreacciones')) {
        listaUsuarios.sort((a, b) => b.reacciones - a.reacciones);
      } else if (textoLimpioComando.includes('menosreacciones')) {
        listaUsuarios.sort((a, b) => a.reacciones - b.reacciones);
      }

      const miembrosPorPagina = 10;
      const totalPaginas = Math.ceil(listaUsuarios.length / miembrosPorPagina) || 1;

      if (pagina > totalPaginas) {
        return await sock.sendMessage(remitente, { text: "⚠️ *Aviso:* La página " + pagina + " no existe. Actualmente hay un máximo de *" + totalPaginas + "* páginas." });
      }

      const indiceInicio = (pagina - 1) * miembrosPorPagina;
      const indiceFin = indiceInicio + miembrosPorPagina;
      let fragmentoPaginado = listaUsuarios.slice(indiceInicio, indiceFin);

      let textoOutput = "";
      let menciones = [];

      if (textoLimpioComando.includes('topreacciones')) {
        textoOutput = "👑 *TOP 10 USUARIOS QUE MÁS REACCIONAN (Pág. " + pagina + "/" + totalPaginas + ")* 👑\n\n";
      } else {
        textoOutput = "❌ *TOP 10 USUARIOS QUE MENOS REACCIONAN (Pág. " + pagina + "/" + totalPaginas + ")* ❌\n\n";
      }

      fragmentoPaginado.forEach((u, i) => {
        const posicionReal = indiceInicio + i + 1;
        textoOutput += posicionReal + ". ❤️ @" + u.id.split('@')[0] + " — *" + u.reacciones + "* reacciones\n";
        menciones.push(u.id);
      });

      textoOutput += "\n✨━━━━━━━━━━━━━━━━━━━━✨\n";
      if (pagina < totalPaginas) {
        textoOutput += "💡 _Usa \`" + textoLimpioComando.replace('/', '') + " " + (pagina + 1) + "\` para ver la siguiente página._";
      } else {
        textoOutput += "🏁 _¡Fin del reporte de control de reacciones de la comunidad!_";
      }

      let lineas = textoOutput.split('\n');
      let lineasLimpias = lineas.filter(linea => !linea.includes('20363414992111332') && !linea.includes('20363408493336388'));
      let textoFinalEntregado = lineasLimpias.join('\n');

      await sock.sendMessage(remitente, { text: textoFinalEntregado, mentions: menciones });

    } catch (error) {
      console.error('❌ Error en el plugin de rankingReacciones:', error);
    }
  }
};
