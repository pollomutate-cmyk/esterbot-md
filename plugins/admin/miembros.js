const fs = require('fs');
const path = require('path');

module.exports = {
  // CONFIGURADO: Sin barras diagonales para compatibilidad total con tu index.js
  comando: ['miembros', 'lista', 'integrantes'],
  run: async (sock, remitente, msg, obtenerMencionado) => {
    try {
      const esGrupo = remitente.endsWith('@g.us');
      if (!esGrupo) return; 

      // 1. Descargamos los participantes oficiales en vivo desde los servidores
      const metadatosGrupo = await sock.groupMetadata(remitente);
      const participantes = metadatosGrupo.participants;

      if (!participantes || participantes.length === 0) return;

      // Identificamos las firmas del bot para sacarlo de la lista
      const botNumero = sock.user.id.split(':') + '@s.whatsapp.net';
      const botLid = sock.user.lid || '';

      // === FILTRO ESTRICTO ANTI-BOT Y ANTI-FANTASMAS DEL SISTEMA ===
      let listaHumanaReal = [];
      participantes.forEach(p => {
        if (p.id === botNumero || p.id === botLid || p.id.includes(sock.user.id.split(':'))) return;
        
        let numeroPuro = p.id.replace(/[^0-9]/g, '');
        // Si el ID pertenece al canal de avisos técnico del grupo (mide más de 15 dígitos), lo fulminamos
        if (!numeroPuro || numeroPuro.length > 15 || p.id.startsWith('2036')) return;

        listaHumanaReal.push(p.id);
      });

      const totalMiembrosReales = listaHumanaReal.length;

      // 2. Extraer de forma limpia el número de página solicitado (ej: /miembros 2)
      const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
      const partes = textoMensaje.toLowerCase().trim().split(/ +/);
      
      let paginaSolicitada = parseInt(partes[1]) || 1;
      if (paginaSolicitada < 1) paginaSolicitada = 1;

      // === CONFIGURACIÓN DE PÁGINAS CONTROLADAS DE 15 EN 15 ANTI-LAG ===
      const limitePorPagina = 15;
      const totalPaginas = Math.ceil(totalMiembrosReales / limitePorPagina) || 1;

      if (paginaSolicitada > totalPaginas) {
        return await sock.sendMessage(remitente, { text: `⚠️ *Aviso:* La página ${paginaSolicitada} no existe. Actualmente hay un máximo de *${totalPaginas}* páginas.` }, { quoted: msg });
      }

      let indiceInicio = (paginaSolicitada - 1) * limitePorPagina;
      let indiceFin = indiceInicio + limitePorPagina;
      let fragmentoPaginado = listaHumanaReal.slice(indiceInicio, indiceFin);

      let textoOutput = `👥 *LISTA DE INTEGRANTES (Pág. ${paginaSolicitada}/${totalPaginas})*\n`;
      textoOutput += `✨ _Total miembros reales en el chat: *${totalMiembrosReales}*_\n\n`;
      
      let mencionesBloque = [];
      // === RENDERIZADO VISUAL EXCLUSIVO CON EMOJIS ANTES DEL NOMBRE ===
      fragmentoPaginado.forEach((id, indice) => {
        const posicionReal = indiceInicio + indice + 1;
        const numeroLimpio = id.split('@')[0]; // Extrae el número para la etiqueta
        
        textoOutput += `📌 *${posicionReal}.* @${numeroLimpio}\n`;
        mencionesBloque.push(id);
      });

      textoOutput += `\n✨━━━━━━━━━━━━━━━━━━━━✨\n`;
      if (paginaSolicitada < totalPaginas) {
        textoOutput += `💡 _Usa \`/miembros ${paginaSolicitada + 1}\` para ver la siguiente página._`;
      } else {
        textoOutput += `🏁 _¡Fin de la lista de miembros de la comunidad!_`;
      }

      // Envío de un solo bloque limpio, controlado y sin títulos molestos
      await sock.sendMessage(remitente, { 
        text: textoOutput, 
        mentions: mencionesBloque 
      }, { quoted: msg });

    } catch (error) {
      console.error('❌ Error crítico en el plugin de miembros.js:', error);
    }
  }
};
