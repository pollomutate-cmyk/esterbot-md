module.exports = {
    comando: ['/miembros', '/lista', '/integrantes'],
    run: async (sock, remitente, msg, obtenerMencionado) => {
        try {
            const esGrupo = remitente.endsWith('@g.us');
            if (!esGrupo) return; 

            // 1. Descargamos la lista de todos los participantes del grupo
            const metadatosGrupo = await sock.groupMetadata(remitente);
            const participantes = metadatosGrupo.participants;

            if (!participantes || participantes.length === 0) return;

            // 2. Dividimos a los miembros en bloques de 20 para asegurar las etiquetas
            const tamanoBloque = 20;
            const totalPaginas = Math.ceil(participantes.length / tamanoBloque);

            for (let i = 0; i < participantes.length; i += tamanoBloque) {
                const bloqueActual = participantes.slice(i, i + tamanoBloque);
                const paginaActual = Math.floor(i / tamanoBloque) + 1;
                
                let textoBloque = `👥 *Lista de Integrantes:*\n\n`;
                let mencionesBloque = [];

                bloqueActual.forEach((p, indice) => {
                    const numeroLimpio = p.id.split('@')[0];
                    textoBloque += `${i + indice + 1}. @${numeroLimpio}\n`;
                    mencionesBloque.push(p.id);
                });

                // Agregamos la paginación abajo en formato cursiva de WhatsApp (_texto_)
                textoBloque += `\n_Página ${paginaActual} de ${totalPaginas}_`;

                // Enviamos el bloque directo al chat
                await sock.sendMessage(remitente, { 
                    text: textoBloque, 
                    mentions: mencionesBloque 
                });

                // Pequeña pausa de 1 segundo entre envíos para estabilidad
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

        } catch (error) {
            console.error('Error en el comando miembros.js limpio:', error);
        }
    }
};
