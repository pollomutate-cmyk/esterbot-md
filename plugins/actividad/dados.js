const fs = require('fs');
const path = require('path');

module.exports = {
  // CONFIGURADO: Quitamos las barras diagonales para que tu index.js lo detecte al instante
  comando: ['dados', 'dado', 'rodar', 'suerte'],
  run: async (sock, remitente, msg, obtenerMencionado) => {
    try {
      const esGrupo = remitente.endsWith('@g.us');
      if (!esGrupo) return;

      const quienEnvia = msg.key.participant || msg.key.remoteJid;
      const numEnvia = String(quienEnvia).replace(/[^0-9]/g, '');

      // Lanzamos 4 dados tradicionales de 6 caras en paralelo para máxima diversidad
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const d3 = Math.floor(Math.random() * 6) + 1;
      const d4 = Math.floor(Math.random() * 6) + 1;
      const total = d1 + d2 + d3 + d4;

      let reaccionRol = '';
      
      // === 7 RANGOS BASADOS EN LA SUMA DE LOS 4 DADOS CORRIENTES ===
      if (total >= 4 && total <= 7) {
        reaccionRol = '☠️ *FRACASO ROTUNDO:*\nLa peor suerte posible. Tu movimiento falla de la peor forma y terminas lastimándote tú mismo. 🩹💥';
      } else if (total >= 8 && total <= 11) {
        reaccionRol = '💨 *FALLO POR POCO:*\nTu oponente leyó tu intención a tiempo y esquivó tu ataque con un salto rápido. ¡Inténtalo de nuevo! 🍃';
      } else if (total >= 12 && total <= 14) {
        reaccionRol = '🛡️ *DEFENSA EN SECO:*\nLogras conectar el golpe, pero tu rival frena tu impacto usando sus brazos o su fuerza. ⚔️👀';
      } else if (total >= 15 && total <= 17) {
        reaccionRol = '💥 *DAÑO LEVE:*\nConsigues vulnerar su defensa. No fue un golpe fulminante, pero le causas un buen raspón a tu oponente. 🩹✨';
      } else if (total >= 18 && total <= 20) {
        reaccionRol = '🔥 *IMPACTO SÓLIDO:*\n¡Buenísimo! Le acomodas un golpe certero que hace tambalear a tu rival y lo hace retroceder. 🎯🥊';
      } else if (total >= 21 && total <= 23) {
        reaccionRol = '⚡ *VENTAJA TOTAL:*\nUna maniobra magistral. Dominas el terreno, dejas fuera de balance a tu enemigo y controlas el combate. 🦅👑';
      } else if (total === 24) {
        reaccionRol = '👑 *PERFECCIÓN ABSOLUTA:*\n¡LOS CUATRO SEISES! Un lanzamiento legendario que destruye cualquier defensa y define el rol a tu favor. 🪐💒🔥';
      }
      // Diseño visual altamente decorado, limpio y ordenado para WhatsApp
      let textoDado = `🎲 ━━━━━━━━━━━━━━━━━━━━ 🎲\n`;
      textoDado += `🎭    *DADOS DE LA FORTUNA*    🎭\n`;
      textoDado += `🎲 ━━━━━━━━━━━━━━━━━━━━ 🎲\n\n`;
      textoDado += `👤 *Lanzador:* @${numEnvia}\n`;
      textoDado += `✨ _Ha lanzado 4 dados tradicionales al aire..._\n\n`;
      textoDado += `✨━━━━━━━━━━━━━━━━━━━━✨\n\n`;
      textoDado += `🎲 *Resultados:*  [ ${d1} ]  [ ${d2} ]  [ ${d3} ]  [ ${d4} ]\n`;
      textoDado += `📊 *Suma Total:*  *${total}* de 24 puntos.\n\n`;
      textoDado += `✨━━━━━━━━━━━━━━━━━━━━✨\n\n`;
      textoDado += `📝 *Suceso en el Rol:*\n${reaccionRol}`;

      // Envío del mensaje con la mención azul correcta y el quoted integrado
      await sock.sendMessage(remitente, { 
        text: textoDado, 
        mentions: [quienEnvia] 
      }, { quoted: msg });

    } catch (error) {
      console.error('❌ Error crítico en el comando dados.js:', error);
    }
  }
};
