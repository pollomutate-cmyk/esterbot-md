const fs = require('fs');
const path = require('path');
const rutaDb = path.join(__dirname, '../actividad.json');

module.exports = {
    comando: ['/topactivos', '/topinactivos'], 
    run: async (sock, remitente, msg) => {
        try {
            if (!remitente.endsWith('@g.us')) return;

            if (!fs.existsSync(rutaDb)) return await sock.sendMessage(remitente, { text: '❌ No hay registros de actividad aún.' });
            let db = JSON.parse(fs.readFileSync(rutaDb, 'utf-8'));
            let actividadGrupo = db[remitente] || {};

            const infoGrupo = await sock.groupMetadata(remitente);
            const participantes = infoGrupo.participants;

            // Extraemos el texto del mensaje original de forma ultra limpia
            const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
            const partes = textoMensaje.toLowerCase().trim().split(/ +/);
            
            // Forzamos a que extraiga solo la primera palabra como texto puro
            const comandoUsado = String(partes[0]).trim(); 
            
            let pagina = parseInt(partes[1]) || 1;
            if (pagina < 1) pagina = 1;

            // Mapeamos los usuarios asegurando que los números sean enteros reales
            let listaUsuarios = participantes.map(p => {
                let datos = actividadGrupo[p.id] || { mensajes: 0, reacciones: 0 };
                return { id: p.id, mensajes: parseInt(datos.mensajes) || 0 };
            });

            // ORDENAMIENTO ESTRICTO EN TIEMPO REAL
            if (comandoUsado.includes('topactivos')) {
                // Ordena matemáticamente de mayor a menor número de mensajes
                listaUsuarios.sort((a, b) => b.mensajes - a.mensajes);
            } else if (comandoUsado.includes('topinactivos')) {
                // Ordena matemáticamente de menor a mayor número de mensajes
                listaUsuarios.sort((a, b) => a.mensajes - b.mensajes);
            }

            const miembrosPorPagina = 10;
            const indiceInicio = (pagina - 1) * miembrosPorPagina;
            const indiceFin = indiceInicio + miembrosPorPagina;
            const totalPaginas = Math.ceil(listaUsuarios.length / miembrosPorPagina);

            if (indiceInicio >= listaUsuarios.length) {
                return await sock.sendMessage(remitente, { text: `⚠️ *Página no encontrada.*\nEste grupo solo tiene datos para ${totalPaginas} página(s).` });
            }

            let textoOutput = "";
            let menciones = [];
            let fragmentoPaginado = listaUsuarios.slice(indiceInicio, indiceFin);

            if (comandoUsado.includes('topactivos')) {
                textoOutput = `🏆 *MIEMBROS MÁS ACTIVOS (Pág. ${pagina}/${totalPaginas})* 🏆\n_(¡Competencia en vivo! Quien envíe más mensajes sube al puesto 1)_\n\n`;
                fragmentoPaginado.forEach((u, i) => {
                    const posicionReal = indiceInicio + i + 1;
                    textoOutput += `${posicionReal}. 🔥 @${u.id.split('@')[0]} ➔ *${u.mensajes}* mensajes\n`;
                    menciones.push(u.id);
                });
                if (pagina < totalPaginas) textoOutput += `\n💡 _Usa \`/topactivos ${pagina + 1}\` para ver la siguiente página._`;
            } else if (comandoUsado.includes('topinactivos')) {
                textoOutput = `👻 *MIEMBROS INACTIVOS / FANTASMAS (Pág. ${pagina}/${totalPaginas})* 👻\n\n`;
                fragmentoPaginado.forEach((u, i) => {
                    const posicionReal = indiceInicio + i + 1;
                    textoOutput += `${posicionReal}. 💤 @${u.id.split('@')[0]} ➔ *${u.mensajes}* mensajes\n`;
                    menciones.push(u.id);
                });
                if (pagina < totalPaginas) textoOutput += `\n💡 _Usa \`/topinactivos ${pagina + 1}\` para ver la siguiente página._`;
            }

            await sock.sendMessage(remitente, { text: textoOutput, mentions: menciones });

        } catch (error) {
            console.error('Error en ranking de mensajes:', error);
        }
    }
};
