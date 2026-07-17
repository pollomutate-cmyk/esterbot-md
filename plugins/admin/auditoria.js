const fs = require('fs');
const path = require('path');

module.exports = {
  comando: ['auditoria', 'auditoría'],
  run: async (sock, remitente, msg) => {
    try {
      if (!remitente.endsWith('@g.us')) return;

      const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
      const partes = textoMensaje.trim().split(/ +/);
      
      partes.shift();
      
      let pagina = 1;
      if (partes.length > 1) {
        let posiblePagina = parseInt(partes[partes.length - 1].replace(/[^0-9]/g, ''));
        if (posiblePagina && posiblePagina > 0) {
          pagina = posiblePagina;
          partes.pop();
        }
      }

      const nombreGrupoOrigen = partes.join(" ").replace(/@/g, '').toLowerCase().trim();

      if (!nombreGrupoOrigen) {
        return await sock.sendMessage(remitente, { 
          text: '⚠️ *Uso correcto de la auditoría cruzada:*\n\nEscribe el comando seguido del nombre del grupo que deseas auditar.\n*Ejemplo:* `/auditoria patricia`.' 
        });
      }

      const todosLosChats = await sock.groupFetchAllParticipating();
      let jidGrupoOrigen = '';
      let nombreOficialOrigen = '';
      let listaNombresDisponibles = [];

      for (const jid in todosLosChats) {
        let nombreMeta = (todosLosChats[jid].subject || "").toLowerCase().trim();
        listaNombresDisponibles.push(todosLosChats[jid].subject);
        
        if (nombreMeta.includes(nombreGrupoOrigen) || nombreGrupoOrigen.includes(nombreMeta)) {
          jidGrupoOrigen = jid;
          nombreOficialOrigen = todosLosChats[jid].subject;
          break;
        }
      }

      if (!jidGrupoOrigen) {
        let textoSugerencia = `❌ *No encontré ningún grupo llamado "${nombreGrupoOrigen}"*\n\n`;
        textoSugerencia += `📝 *Grupos disponibles actuales:*\n`;
        listaNombresDisponibles.forEach((n, i) => {
          textoSugerencia += `🔹 *${i + 1}.* ${n}\n`;
        });
        return await sock.sendMessage(remitente, { text: textoSugerencia });
      }

      const metadatosOrigen = await sock.groupMetadata(jidGrupoOrigen);
      const participantesOrigen = metadatosOrigen.participants || [];

      // Filtramos las salas destino eliminando IDs técnicos largos de sistemas o canales (2036...)
      const subGruposDestino = Object.keys(todosLosChats).filter(id => {
        let numId = id.replace(/[^0-9]/g, '');
        return id !== jidGrupoOrigen && !id.startsWith('2036') && numId.length <= 15;
      });
      
      const totalSubgruposDestino = subGruposDestino.length;
      const botNumero = String(sock.user.id.split(':')).replace(/[^0-9]/g, '');

      // SOLUCIÓN DE LA DUPLICACIÓN: Usamos un objeto mapa para consolidar los números duplicados
      let mapaResultados = {};

      // Recorremos los miembros humanos del grupo base
      for (const p of participantesOrigen) {
        let numeroPuroOrigen = p.id.replace(/[^0-9]/g, '');
        if (!numeroPuroOrigen || numeroPuroOrigen === botNumero || numeroPuroOrigen.length > 15 || p.id.startsWith('2036')) continue;
        
        let conteoPresencia = 0;

        // Escaneamos las salas de juego filtradas de forma ultra segura
        for (const idGrupoDestino of subGruposDestino) {
          let metadatosDestino;
          try {
            metadatosDestino = await sock.groupMetadata(idGrupoDestino);
          } catch (e) {
            metadatosDestino = sock.chats?.[idGrupoDestino]?.metadata || null;
          }

          if (metadatosDestino && metadatosDestino.participants) {
            let numerosEnDestino = metadatosDestino.participants.map(m => m.id.replace(/[^0-9]/g, ''));
            if (numerosEnDestino.includes(numeroPuroOrigen)) {
              conteoPresencia++;
            }
          }
        }

        // Si le falta estar en al menos una de las salas válidas, lo guardamos fijamente por su número
        if (conteoPresencia === 0 || conteoPresencia < totalSubgruposDestino) {
          mapaResultados[numeroPuroOrigen] = {
            numero: numeroPuroOrigen,
            conteo: conteoPresencia,
            faltan: totalSubgruposDestino - conteoPresencia
          };
        }
      }

      // Convertimos el mapa purificado en una lista limpia ordenada libre de duplicados
      let listaIncompletos = Object.values(mapaResultados);
      // === PAGINADOR INTERACTIVO CONTROLADO DE 15 EN 15 ANTI-LAG ===
      const totalParaListar = listaIncompletos.length;
      const limitePorPagina = 15;
      const totalPaginas = Math.ceil(totalParaListar / limitePorPagina) || 1;

      if (pagina > totalPaginas) {
        return await sock.sendMessage(remitente, { text: `⚠️ *Aviso:* La página ${pagina} no existe. Actualmente hay un máximo de *${totalPaginas}* páginas.` });
      }

      let indiceInicio = (pagina - 1) * limitePorPagina;
      let indiceFin = indiceInicio + limitePorPagina;
      let fragmentoPaginado = listaIncompletos.slice(indiceInicio, indiceFin);

      let textoOutput = "⚠️ *Se encontraron " + totalParaListar + " usuarios ausentes o incompletos.* (Pág. " + pagina + "/" + totalPaginas + ")\n";
      textoOutput += "📍 _Auditoría sobre la base de: *" + nombreOficialOrigen.toUpperCase() + "*_\n\n";

      // === RENDERIZADO VISUAL EXCLUSIVO - UN SOLO RENGLÓN POR CADA NÚMERO DE TELÉFONO ===
      fragmentoPaginado.forEach((user, indice) => {
        const posicionReal = indiceInicio + indice + 1;
        
        if (user.conteo === 0) {
          textoOutput += posicionReal + ". https://wa.me" + user.numero + " ➔ 🚨 *SÓLO EN AVISOS* (Falta en todos los grupos)\n";
        } else {
          textoOutput += posicionReal + ". https://wa.me" + user.numero + " ➔ 📝 Le falta entrar a *" + user.faltan + "* grupo(s)\n";
        }
      });

      if (indiceFin < totalParaListar) {
        let restantes = totalParaListar - indiceFin;
        textoOutput += "...y " + restantes + " más\n";
      }

      textoOutput += "\n✨━━━━━━━━━━━━━━━━━━━━✨\n";
      if (pagina < totalPaginas) {
        textoOutput += "💡 _Usa \`/auditoria " + nombreGrupoOrigen + " " + (pagina + 1) + "\` para ver el resto de la lista._";
      } else {
        textoOutput += "🏁 _¡Fin del reporte de control de ausentes de la comunidad!_";
      }

      await sock.sendMessage(remitente, { text: textoOutput });

    } catch (error) {
      console.error('❌ Error crítico en el motor final de auditoria.js:', error);
    }
  }
};
