module.exports = {
    comando: ['/menu', '/help', '/comandos', '/ayuda'],
    run: async (sock, remitente, msg, obtenerMencionado) => {
        try {
            const esGrupo = remitente.endsWith('@g.us');
            const quienEnvia = msg.key.participant || msg.key.remoteJid;
            const numEnvia = quienEnvia.split('@');

            let nombreGrupo = 'Chat Privado';
            if (esGrupo) {
                const metadatos = await sock.groupMetadata(remitente);
                nombreGrupo = metadatos.subject;
            }

            // === ENCABEZADO MULTI-GRUPO ===
            let textoMenu = `🪐  ═══  *𝐏𝐀𝐍𝐄𝐋 𝐃𝐄 𝐂𝐎𝐌𝐀𝐍𝐃𝐎𝐒*  ═══  🪐\n\n`;
            textoMenu += `👤  *Usuario:* @${numEnvia}\n`;
            textoMenu += `🏰  *Chat:* ${nombreGrupo}\n`;
            textoMenu += `📊  *Sistemas:* ${Object.keys(global.comandos).length} Funciones Cargadas\n`;
            textoMenu += `🤖  *Estado:* Conexión Estable 🟢\n\n`;
            textoMenu += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            // 👑 SECCIÓN 1: MODERACIÓN
            textoMenu += `🛡️  *⚙️ SECCIÓN DE ADMINISTRACIÓN ⚙️*\n`;
            textoMenu += `_Restringido exclusivamente para el cuerpo de admins._\n\n`;
            
            textoMenu += `•  */kick* , */sacar* , */largate* , */embestir*\n`;
            textoMenu += `   _↳ Expulsa temporalmente a un miembro del chat._\n\n`;
            
            textoMenu += `•  */ban*\n`;
            textoMenu += `   _↳ Remueve y bloquea definitivamente a un usuario._\n\n`;
            
            textoMenu += `•  */delete* , */del* , */dell* , */eliminar* , */borrar*\n`;
            textoMenu += `   _↳ Elimina el mensaje citado para todos en el grupo._\n\n`;
            
            textoMenu += `•  */promote* , */promover* , */daradmin*\n`;
            textoMenu += `   _↳ Concede rango y permisos de administrador._\n\n`;
            
            textoMenu += `•  */demote* , */despromover* , */quitaradmin*\n`;
            textoMenu += `   _↳ Retira el rango de administrador inmediatamente._\n\n`;
            
            textoMenu += `•  */agregar* , */add* , */agg*\n`;
            textoMenu += `   _↳ Añade un número telefónico directo sin agendar._\n\n`;
            
            textoMenu += `•  */cerrar* , */close*  |  */abrir* , */open*\n`;
            textoMenu += `   _↳ Modifica los permisos de envío de mensajes._\n\n`;
            
            textoMenu += `•  */aceptar* , */aprobar*  |  */rechazar* , */denegar*\n`;
            textoMenu += `   _↳ Gestiona las solicitudes de ingreso pendientes._\n\n`;
            
            textoMenu += `•  */modoadmin on*  |  */modoadmin off*\n`;
            textoMenu += `   _↳ Activa el filtro de pánico estricto en emergencias._\n\n`;

            textoMenu += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            // 🎭 SECCIÓN 2: ROL
            textoMenu += `🎭  *✨ ACCIONES & INTERACCIONES INTERACTIVAS ✨*\n`;
            textoMenu += `_Escribe el comando dejando un espacio y etiqueta con @._\n\n`;
            
            textoMenu += `•  */abrazo* , */abrazar*\n`;
            textoMenu += `   _↳ Envía un cálido y tierno abrazo protector._\n\n`;
            
            textoMenu += `•  */beso* , */besar*\n`;
            textoMenu += `   _↳ Entrega un dulce beso sumamente romántico._\n\n`;
            
            textoMenu += `•  */mordisco* , */morder*\n`;
            textoMenu += `   _↳ Marca territorio dándole un mordisco a alguien._\n\n`;
            
            textoMenu += `•  */coger*\n`;
            textoMenu += `   _↳ Acción interactiva explícita para adultos (+18)._\n\n`;
            
            textoMenu += `•  */patada* , */patear*\n`;
            textoMenu += `   _↳ Acomoda una contundente patada voladora._\n\n`;
            
            textoMenu += `•  */pegar* , */atacar*\n`;
            textoMenu += `   _↳ Inicia un combate físico directo contra un rival._\n\n`;
            
            textoMenu += `•  */proteger*\n`;
            textoMenu += `   _↳ Colócate al frente como escudo de tu compañero._\n\n`;

            textoMenu += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            // 🎰 SECCIÓN 3: JUEGOS
            textoMenu += `🎰  *🎲 SISTEMAS DE AZAR & JUEGOS 🎲*\n`;
            textoMenu += `_Sistemas de entretenimiento libres para todo el público._\n\n`;
            
            textoMenu += `•  */ship*\n`;
            textoMenu += `   _↳ Calcula de forma aleatoria la química amorosa._\n\n`;
            
            textoMenu += `•  */casar* , */marry*\n`;
            textoMenu += `   _↳ Firma tu contrato y establece una Unión Sagrada._\n\n`;
            
            textoMenu += `•  */divorcio* , */divorciar* , */divorcie*\n`;
            textoMenu += `   _↳ Disuelve la boda vigente y deshazte de la sal._\n\n`;
            
            textoMenu += `•  */dados* , */dado* , */rodar* , */suerte*\n`;
            textoMenu += `   _↳ Lanza 4 dados tradicionales con 7 veredictos._\n\n`;
            
            textoMenu += `•  */tragamonedas* , */slots* , */slot* , */casino*\n`;
            textoMenu += `   _↳ Jala la palanca en el tablero limpio enmarcado._\n\n`;
            
            textoMenu += `•  */ruletarusa* , */ruleta* , */disparar*\n`;
            textoMenu += `   _↳ Tenta al destino con 5 frases de supervivencia._\n\n`;

            textoMenu += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            // 📊 SECCIÓN 4: ESTADÍSTICAS
            textoMenu += `📊  *📈 ACTIVIDAD, RANKINGS & TEXTOS 📈*\n`;
            textoMenu += `_Herramientas de información general del servidor._\n\n`;
            
            textoMenu += `•  */miembros* , */lista* , */integrantes*\n`;
            textoMenu += `   _↳ Menciones colectivas ordenadas de 20 en 20._\n\n`;
            
            textoMenu += `•  */ping* , */status* , */botstatus* , */estatus*\n`;
            textoMenu += `   _↳ Verifica la latencia y velocidad del procesador._\n\n`;
            
            textoMenu += `•  */miestado*\n`;
            textoMenu += `   _↳ Desglosa tus estadísticas individuales acumuladas._\n\n`;
            
            textoMenu += `•  */topactivos*  |  */topinactivos*\n`;
            textoMenu += `   _↳ Ranking basado en el envío de mensajes de texto._\n\n`;
            
            textoMenu += `•  */topreacciones*  |  */menosreacciones*\n`;
            textoMenu += `   _↳ Monitorea el flujo de emojis dentro del chat._\n\n`;
            
            textoMenu += `•  */presentación* , */presentacion*\n`;
            textoMenu += `   _↳ Envía tu ficha oficial de datos al servidor._\n\n`;
            
            textoMenu += `•  */all* , */todos* , */tag* , */hideall* , */totaltag*\n`;
            textoMenu += `   _↳ Variantes de etiquetas masivas globales._\n\n`;

            textoMenu += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
            textoMenu += `🪐  _Recuerda anteponer la barra (/) para invocar una función._`;

            await sock.sendMessage(remitente, { 
                text: textoMenu, 
                mentions: [quienEnvia] 
            });

        } catch (error) {
            console.error('Error en el comando menu.js fino:', error);
        }
    }
};
