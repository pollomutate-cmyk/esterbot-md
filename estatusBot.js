module.exports = {
    comando: ['/estatusbot', '/botstatus', '/ping'], 
    run: async (sock, remitente, msg) => {
        try {
            if (!remitente.endsWith('@g.us')) return;

            // 1. Calcular el Ping (velocidad de respuesta en milisegundos)
            const tiempoInicio = Date.now();
            await sock.sendMessage(remitente, { text: '⚡ _Calculando estatus..._' });
            const tiempoFin = Date.now();
            const ping = tiempoFin - tiempoInicio;

            // 2. Calcular el Uptime (tiempo encendido)
            const totalSegundos = process.uptime();
            const dias = Math.floor(totalSegundos / (3600 * 24));
            const horas = Math.floor((totalSegundos % (3600 * 24)) / 3600);
            const minutos = Math.floor((totalSegundos % 3600) / 60);

            let tiempoEncendido = "";
            if (dias > 0) tiempoEncendido += `${dias}d `;
            if (horas > 0) tiempoEncendido += `${horas}h `;
            tiempoEncendido += `${minutos}m`;

            // 3. Calcular consumo de Memoria RAM de la computadora
            const usoMemoria = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

            // 4. Armar el diseño visual
            let infoBot = `🤖 *ESTATUS DE ESTERBOT-MD* 🤖\n\n`;
            infoBot += `🟢 *Conexión:* Estable y Activa\n`;
            infoBot += `⚡ *Velocidad (Ping):* ${ping} ms\n`;
            infoBot += `⏱️ *Tiempo Encendido:* ${tiempoEncendido}\n`;
            infoBot += `💾 *Memoria RAM usada:* ${usoMemoria} MB\n\n`;
            infoBot += `⚙️ _Desarrollado desde cero con éxito._`;

            await sock.sendMessage(remitente, { text: infoBot });

        } catch (error) {
            console.error('Error en comando estatusBot:', error);
        }
    }
};
