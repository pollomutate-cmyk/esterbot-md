const fs = require('fs');
const path = require('path');

// Ruta exacta y unificada apuntando a la raíz del proyecto Codespaces
const rutaDb = path.join(process.cwd(), 'actividad.json');

module.exports = {
  // CONFIGURADO: Sincronizado con la lista de restricciones de tu index.js
  comando: ['topactivos', 'topinactivos'],
  run: async (sock, remitente, msg, obtenerMencionado) => {
    try {
      if (!fs.existsSync(rutaDb)) {
        fs.writeFileSync(rutaDb, JSON.stringify({}));
        return await sock.sendMessage(remitente, { text: '❌ *Aún no hay registro de mensajes en este grupo.*' });
      }
      
      let db = JSON.parse(fs.readFileSync(rutaDb, 'utf8'));
      if (!db[remitente] || Object.keys(db[remitente]).length === 0) {
        return await sock.sendMessage(remitente, { text: '📉 *Aún no hay actividad registrada en este grupo.*' });
      }

      const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
      let textoLimpio = textoMensaje.toLowerCase().trim();
      
      let esTopActivos = textoLimpio.includes('topactivos');
      let esTopInactivos = textoLimpio.includes('topinactivos');
      
      let usuarios = db[remitente];
      let listaUsuarios = Object.keys(usuarios);
      let listaOrdenada = [];
      let texto = '';

      // === FILTRO ANTI-FANTASMAS SEGURO SOBRE LA BASE DE DATOS ===
      let usuariosFiltrados = [];
      listaUsuarios.forEach(id => {
        let numeroPuro = id.replace(/[^0-9]/g, '');
        
        // FULMINADOR: Si el ID pertenece al bot o es el ID técnico largo de la comunidad (2036...), se elimina aquí
        if (id.includes(sock.user.id.split(':')) || numeroPuro.length > 15 || id.startsWith('2036')) return;
        
        usuariosFiltrados.push(id);
      });

      if (esTopActivos) {
        listaOrdenada = usuariosFiltrados
          .map(id => ({ id, cantidad: parseInt(usuarios[id].mensajes) || 0 }))
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 10);
        texto = '🏆 *TOP 10 USUARIOS MÁS ACTIVOS (MENSAJES)* 🏆\n\n';
      } else if (esTopInactivos) {
        listaOrdenada = usuariosFiltrados
          .map(id => ({ id, cantidad: parseInt(usuarios[id].mensajes) || 0 }))
          .sort((a, b) => a.cantidad - b.cantidad)
          .slice(0, 10);
        texto = '💤 *TOP 10 USUARIOS MÁS INACTIVOS (MENSAJES)* 💤\n\n';
      } else {
        return;
      }

      if (listaOrdenada.length === 0) {
        return await sock.sendMessage(remitente, { text: '📉 *No hay datos de miembros reales para generar este top.*' });
      }
      // RENDERIZADO VISUAL LIMPIO SIN SIGNOS ROTOS NI TÍTULOS DE RELLENO
      listaOrdenada.forEach((user, index) => {
        let num = index + 1;
        let numeroTelefono = user.id.split('@'); 
        texto += `${num}. @${numeroTelefono} — 💬 *${user.cantidad}* mensajes\n`;
      });

      let menciones = listaOrdenada.map(u => u.id);
      
      // FILTRO EXTRA DE SEGURIDAD LÍNEA POR LÍNEA JUSTO ANTES DE ENVIAR A WHATSAPP
      let lineas = texto.split('\n');
      let lineasSinFantasmas = lineas.filter(l => !l.includes('20363414992111332') && !l.includes('20363408493336388'));
      let textoFinalEntregado = lineasSinFantasmas.join('\n');

      await sock.sendMessage(remitente, { text: textoFinalEntregado, mentions: menciones });

    } catch (error) {
      console.error('❌ Error en el plugin de rankingMensajes:', error);
    }
  }
};
