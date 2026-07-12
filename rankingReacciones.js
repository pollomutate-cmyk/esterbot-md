const fs = require('fs');
const path = require('path');
const rutaDb = path.join(__dirname, '../actividad.json');

module.exports = {
    comando: ['/topreacciones', '/menosreacciones'], 
    run: async (sock, remitente, msg) => {
        try {
            if (!remitente.endsWith('@g.us')) return;

            if (!fs.existsSync(rutaDb)) return await sock.sendMessage(remitente, { text: '❌ No hay registros de reacciones aún.' });
            let db = JSON.parse(fs.readFileSync(rutaDb, 'utf-8'));
            let actividadGrupo = db[remitente] || {};

            const infoGrupo = await sock.groupMetadata(remitente);
            const participantes = infoGrupo.participants;

            const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
            const partes = textoMensaje.toLowerCase().trim().split(/ +/);
            
            // Forzamos a que extraiga solo la primera palabra como texto puro
            const comandoUsado = String(partes[0]).trim(); 
            
            let pagina = parseInt(partes[1]) || 1;
            if (pagina < 1) pagina = 1;

            // Mapeamos los usuarios asegurando que los números de reacciones sean enteros reales
            let listaUsuarios = participantes.map(p => {
                let datos = actividadGrupo[p.id] || { mensajes: 0, reacciones: 0 };
                return { id: p.id, reacciones: parseInt(datos.reacciones) || 0 };
            });

            // ORDENAMIENTO ESTRICTO EN TIEMPO REAL
            if (comandoUsado.includes('topreacciones')) {
                // Ordena matemáticamente de mayor a menor número de reacciones puestas
                listaUsuarios.sort((a, b) => b.reacciones - a.reacciones);
            } else if (comandoUsado.includes('menosreacciones')) {
                // Ordena matemáticamente de menor a mayor número de reacciones puestas
                listaUsuarios.sort((a, b) => a.reacciones - b.reacciones);
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

            if (comandoUsado.includes('topreacciones')) {
                textoOutput = `❤️ *MIEMBROS QUE MÁS REACCIONAN (Pág. ${pagina}/${totalPaginas})* ❤️\n_(¡100% dinámico! Quien ponga más emojis sube en el top)_\n\n`;
                fragmentoPaginado.forEach((u, i) => {
                    const posicionReal = indiceInicio + i + 1;
                    textoOutput += `${posicionReal}. ✨ @${u.id.split('@')[0]} ➔ *${u.reacciones}* reacciones puestas\n`;
                    menciones.push(u.id);
                });
                if (pagina < totalPaginas) textoOutput += `\n💡 _Usa \`/topreacciones ${pagina + 1}\` para ver la siguiente página._`;
            } else if (comandoUsado.includes('menosreacciones')) {
                textoOutput = `❌ *MIEMBROS QUE MENOS REACCIONAN (Pág. ${pagina}/${totalPaginas})* ❌\n\n`;
                fragmentoPaginado.forEach((u, i) => {
                    const posicionReal = indiceInicio + i + 1;
                    textoOutput += `${posicionReal}. 📌 @${u.id.split('@')[0]} ➔ *${u.reacciones}* reacciones puestas\n`;
                    menciones.push(u.id);
                });
                if (pagina < totalPaginas) textoOutput += `\n💡 _Usa \`/menosreacciones ${pagina + 1}\` para ver la siguiente página._`;
            }

            await sock.sendMessage(remitente, { text: textoOutput, mentions: menciones });

        } catch (error) {
            console.error('Error en ranking de reacciones:', error);
        }
    }
};
