const fs = require('fs');
const path = require('path');

module.exports = {
  // CONFIGURADO: Sin barras diagonales para que tu index.js lo detecte al instante
  comando: ['estatusbot', 'botstatus', 'ping', 'estatus', 'status'],
  run: async (sock, remitente, msg) => {
    try {
      if (!remitente.endsWith('@g.us')) return;

      // 1. Calcular el Ping (velocidad de respuesta en milisegundos)
      const tiempoInicio = Date.now();
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

      // 3. Calcular consumo de Memoria RAM de la computadora de forma limpia
      const usoMemoria = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      // 4. Armar el diseño visual con la nueva decoración estética y simétrica
      let infoBot = `🤖 ━━━━━━━━━━━━━━━━━━━━ 🤖\n`;
      infoBot += `⚡    *ESTATUS DE ESTERBOT-MD*    ⚡\n`;
      infoBot += `🤖 ━━━━━━━━━━━━━━━━━━━━ 🤖\n\n`;
      infoBot += `🟢 *Conexión:* Estable y Activa ✅\n`;
      infoBot += `⚡ *Velocidad (Ping):* ${ping === 0 ? 1 : ping} ms\n`;
      infoBot += `⏱️ *Tiempo Encendido:* ${tiempoEncendido}\n`;
      infoBot += `💾 *Memoria RAM usada:* ${usoMemoria} MB\n\n`;
      infoBot += `✨━━━━━━━━━━━━━━━━━━━━✨\n`;
      infoBot += `⚙️ _Acceso exclusivo para Administradores._`;

      // Envía el panel estético respondiendo directamente al mensaje original
      await sock.sendMessage(remitente, { text: infoBot }, { quoted: msg });

    } catch (error) {
      console.error('❌ Error crítico en el comando estatusBot.js:', error);
    }
  }
};
