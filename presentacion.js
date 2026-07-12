module.exports = {
    // Soportamos con y sin acento para ganarle al autocorrector
    comando: ['/presentacion', '/presentación'],
    run: async (sock, remitente, msg, obtenerMencionado) => {
        try {
            const esGrupo = remitente.endsWith('@g.us');
            if (!esGrupo) return; // Solo funciona en grupos

            // 1. OBTENEMOS TODOS LOS MIEMBROS DEL GRUPO PARA LA MENCIÓN FANTASMA
            const metadatosGrupo = await sock.groupMetadata(remitente);
            const todosLosMiembros = metadatosGrupo.participants.map(p => p.id);

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
            await sock.sendMessage(remitente, { 
                text: textoFicha, 
                mentions: todosLosMiembros // Aquí ocurre la magia fantasma
            });

        } catch (error) {
            console.error('Error en el comando presentacion.js fantasma:', error);
        }
    }
};
