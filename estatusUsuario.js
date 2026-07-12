const fs = require('fs');
const path = require('path');
const rutaDb = path.join(__dirname, '../actividad.json');

module.exports = {
    comando: ['/estatus', '/status', '/miestado'], 
    run: async (sock, remitente, msg, obtenerMencionado) => {
        try {
            if (!remitente.endsWith('@g.us')) return;

            // 1. Leer la base de datos de actividad
            if (!fs.existsSync(rutaDb)) return await sock.sendMessage(remitente, { text: '❌ No hay registros de actividad aún.' });
            let db = JSON.parse(fs.readFileSync(rutaDb, 'utf-8'));
            let actividadGrupo = db[remitente] || {};

            // 2. Identificar de quién queremos ver el estatus (Mencionado, Respondido o Yo mismo)
            let usuarioObjetivo = obtenerMencionado(msg);
            
            if (!usuarioObjetivo && msg.message?.extendedTextMessage?.contextInfo?.participant) {
                usuarioObjetivo = msg.message.extendedTextMessage.contextInfo.participant;
            }
            
            if (!usuarioObjetivo) {
                usuarioObjetivo = msg.key.participant || msg.key.remoteJid; // Si no menciona a nadie, es él mismo
            }

            // 3. Extraer sus datos
            let datos = actividadGrupo[usuarioObjetivo] || { mensajes: 0, reacciones: 0 };
            const numeroLimpio = usuarioObjetivo.split('@')[0];

            // 4. Armar el diseño del mensaje
            let textoEstatus = `📊 *ESTATUS DE ACTIVIDAD* 📊\n\n`;
            textoEstatus += `👤 *Usuario:* @${numeroLimpio}\n`;
            textoEstatus += `💬 *Mensajes enviados:* ${datos.mensajes || 0}\n`;
            textoEstatus += `❤️ *Reacciones puestas:* ${datos.reacciones || 0}\n\n`;
            textoEstatus += `⏳ _Nota: Tus datos se reiniciarán automáticamente al cumplir el ciclo de 15 días._`;

            await sock.sendMessage(remitente, { 
                text: textoEstatus, 
                mentions: [usuarioObjetivo] 
            });

        } catch (error) {
            console.error('Error en comando estatusUsuario:', error);
        }
    }
};
