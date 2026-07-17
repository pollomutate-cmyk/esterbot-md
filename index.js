const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

global.comandos = {};
global.modoAdminGlobal = false; 

const rutaGruposApagados = path.join(__dirname, 'grupos_apagados.json');
if (!fs.existsSync(rutaGruposApagados)) fs.writeFileSync(rutaGruposApagados, JSON.stringify([]));

const rutaDb = path.join(__dirname, 'actividad.json');
if (!fs.existsSync(rutaDb)) fs.writeFileSync(rutaDb, JSON.stringify({}));

const rutaControlLimpieza = path.join(__dirname, 'ultimo_borrado.json');
if (!fs.existsSync(rutaControlLimpieza)) fs.writeFileSync(rutaControlLimpieza, JSON.stringify({ ultimaFecha: "" }));

const carpetaTmp = path.join(__dirname, 'tmp');
if (!fs.existsSync(carpetaTmp)) fs.mkdirSync(carpetaTmp);

// SISTEMA DE CAPTURA HÍBRIDO ADAPTADO A FORMATOS @LID Y @S.WHATSAPP.NET
function guardarActividad(grupo, usuario, tipo) {
  try {
    if (!grupo || !usuario) return;
    let apagados = JSON.parse(fs.readFileSync(rutaGruposApagados, 'utf8'));
    if (apagados.includes(grupo)) return;
    
    // BLOQUEO CRÍTICO DESDE LA BASE DE DATOS: Si el ID pertenece al sistema, se destruye
    let idFirma = String(usuario).toLowerCase();
    if (idFirma.startsWith('2036') || idFirma.includes('lid') && idFirma.replace(/[^0-9]/g, '').length > 15) return;

    let db = JSON.parse(fs.readFileSync(rutaDb, 'utf8'));
    if (!db[grupo]) db[grupo] = {};
    
    let usuarioFormateado = idFirma.trim();
    if (!usuarioFormateado.endsWith('@lid') && !usuarioFormateado.endsWith('@s.whatsapp.net')) {
      let numeroPuro = usuarioFormateado.replace(/[^0-9]/g, '');
      usuarioFormateado = `${numeroPuro}@s.whatsapp.net`;
    }
    
    if (!db[grupo][usuarioFormateado]) db[grupo][usuarioFormateado] = { mensajes: 0, reacciones: 0 };
    
    if (tipo === 'mensaje') db[grupo][usuarioFormateado].mensajes = (parseInt(db[grupo][usuarioFormateado].mensajes) || 0) + 1;
    if (tipo === 'reaccion') db[grupo][usuarioFormateado].reacciones = (parseInt(db[grupo][usuarioFormateado].reacciones) || 0) + 1;
    
    fs.writeFileSync(rutaDb, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('❌ Error guardando actividad en JSON:', e); 
  }
}

function cargarComandos(directorio = path.join(__dirname, 'plugins')) {
  if (directorio === path.join(__dirname, 'plugins')) {
    global.comandos = {};
    if (!fs.existsSync(directorio)) fs.mkdirSync(directorio);
    console.log('🔄 Iniciando carga masiva de comandos...');
  }
  const elementos = fs.readdirSync(directorio);
  for (const elemento of elementos) {
    const rutaAbsoluta = path.join(directorio, elemento);
    const estado = fs.statSync(rutaAbsoluta);
    if (estado.isDirectory()) {
      cargarComandos(rutaAbsoluta);
    } else if (elemento.endsWith('.js')) {
      try {
        delete require.cache[require.resolve(rutaAbsoluta)];
        const plugin = require(rutaAbsoluta);
        if (plugin && plugin.comando && plugin.run) {
          if (Array.isArray(plugin.comando)) {
            plugin.comando.forEach(cmd => { 
              global.comandos[cmd.toLowerCase().trim()] = plugin; 
            });
          } else {
            global.comandos[plugin.comando.toLowerCase().trim()] = plugin;
          }
        }
      } catch (e) { 
        console.error(`❌ ERROR GRAVE en comando [${elemento}]: El archivo está roto.`);
      }
    }
  }
}
const obtenerMencionado = (info) => {
  const msg = info.messages ? info.messages : info;
  if (!msg || !msg.message) return null;
  const context = msg.message?.extendedTextMessage?.contextInfo || msg.message?.contextInfo || null;
  if (context?.mentionedJid && context.mentionedJid.length > 0) return context.mentionedJid; 
  if (context?.participant) return context.participant;
  return null;
};

async function iniciarBot() {
  cargarComandos();
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    mobile: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  });

  const numeroTelefono = '18097490161'; 

  if (!sock.authState.creds.registered && numeroTelefono) {
    setTimeout(async () => {
      try {
        let codigo8Digitos = await sock.requestPairingCode(numeroTelefono);
        codigo8Digitos = codigo8Digitos?.match(/.{1,4}/g)?.join('-') || codigo8Digitos;
        console.log(`\n==============================================`);
        console.log(`📱 ENVIANDO NOTIFICACIÓN AL NÚMERO: ${numeroTelefono}`);
        console.log(`🔑 TU CÓDIGO DE VERIFICACIÓN ES: \x1b[36m${codigo8Digitos}\x1b[0m`);
        console.log(`==============================================\n`);
      } catch (err) {
        console.error('❌ Error generando el código de emparejamiento:', err);
      }
    }, 3000);
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const deberiaReconectar = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('🔄 Conexión cerrada. Reconectando...');
      if (deberiaReconectar) iniciarBot();
    } else if (connection === 'open') {
      console.log('✅ ¡ESTERBOT-MD conectado con éxito y totalmente estable!');
    }
  });

  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('messages.upsert', async m => {
    if (!m.messages || m.messages.length === 0) return;
    const msg = m.messages[0];
    if (!msg || !msg.message) return;

    const remitente = msg.key.remoteJid;
    const esGrupo = remitente.endsWith('@g.us');
    const quienEnvia = msg.key.participant || msg.key.remoteJid;

    // CAPTURA INMEDIATA DE REACCIONES DESDE EL FLUJO GENERAL
    if (msg.message.reactionMessage) {
      if (esGrupo) guardarActividad(remitente, quienEnvia, 'reaccion');
      return; 
    }
    
    if (msg.message.protocolMessage) return;

    if (esGrupo) guardarActividad(remitente, quienEnvia, 'mensaje');

    const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
    let textoLimpio = String(textoMensaje).toLowerCase().trim();
    
    let comandoLinter = textoLimpio.startsWith('/') ? textoLimpio.slice(1) : textoLimpio;
    let partes = comandoLinter.split(/ +/);
    let comandoEscrito = partes.length > 0 ? partes[0].trim() : "";

    let listaApagados = JSON.parse(fs.readFileSync(rutaGruposApagados, 'utf8'));
    const estaApagadoEnEsteGrupo = esGrupo && listaApagados.includes(remitente);
    if (estaApagadoEnEsteGrupo) return;

    if (comandoEscrito === 'modoadmin' && partes[1] === 'on') {
      global.modoAdminGlobal = true;
      return await sock.sendMessage(remitente, { text: '🔒 *Modo Admin Activado*' });
    }
    if (comandoEscrito === 'modoadmin' && partes[1] === 'off') {
      global.modoAdminGlobal = false;
      return await sock.sendMessage(remitente, { text: '🟢 *Modo Admin Desactivado*' });
    }
    if (global.comandos[comandoEscrito]) {
      try {
        let esAdmin = false;
        if (esGrupo) {
          const infoGrupo = await sock.groupMetadata(remitente);
          const encontrarAdmin = infoGrupo.participants.find(p => p.id === quienEnvia);
          if (encontrarAdmin && (encontrarAdmin.admin === 'admin' || encontrarAdmin.admin === 'superadmin')) esAdmin = true;
        }
        if (global.modoAdminGlobal && !esAdmin && esGrupo && !msg.key.fromMe) return;

        const comandosRestringidos = [
          'lista', 'integrantes', 'miembros', 'delete', 'del', 'dell', 'eliminar', 'borrar',
          'demote', 'despromover', 'quitaradmin', 'statusbot', 'botstatus', 'ping', 'estatus',
          'status', 'miestado', 'actividad', 'cerrar', 'abrir', 'close', 'open', 'kick', 'sacar',
          'largate', 'lárgate', 'embestir', 'ban', 'presentación', 'presentacion',
          'promote', 'promover', 'daradmin', 'topreacciones', 'menosreacciones', 'totalall', 
          'hideall', 'totaltag', 'hidetag', 'aceptar', 'aprobar', 'rechazar', 'denegar', 
          'all', 'todos', 'tag', 'agregar', 'add', 'agg'
        ];

        if (comandosRestringidos.includes(comandoEscrito) && !esAdmin && esGrupo && !msg.key.fromMe) {
          return await sock.sendMessage(remitente, { text: '❌ Solo los administradores pueden usar este comando.' });
        }

        await global.comandos[comandoEscrito].run(sock, remitente, msg, obtenerMencionado);
      } catch (error) { 
        console.error(`Error en ejecución del comando [${comandoEscrito}]:`, error); 
      }
    }
  });

  // RECEPTOR DE REACCIONES MAESTRO CON COMPROBACIÓN FÍSICA ANTI-SISTEMA
  sock.ev.on('reactions.update', async (rawReactions) => {
    try {
      if (!rawReactions) return;
      const actualizaciones = Array.isArray(rawReactions) ? rawReactions : [rawReactions];
      
      for (const r of actualizaciones) {
        if (!r || !r.key) continue;
        
        const remitente = r.key.remoteJid || r.remoteJid;
        if (!remitente || !remitente.endsWith('@g.us')) continue;
        
        const quienReacciona = r.sender || r.reaction?.key?.participant || r.key.participant;
        if (!quienReacciona) continue;

        // FILTRO DEFINITIVO DEL INDEX: Si el ID de la reacción pertenece a la comunidad, se destruye en silencio
        let idFirmaReaccion = String(quienReacciona).toLowerCase();
        if (idFirmaReaccion.startsWith('2036') || idFirmaReaccion.includes('lid') && idFirmaReaccion.replace(/[^0-9]/g, '').length > 15) continue;
        
        guardarActividad(remitente, quienReacciona, 'reaccion');

        const emoji = r.text || r.reaction?.text || "";
        if (!emoji) continue;

        const infoGrupo = await sock.groupMetadata(remitente);
        const encontrarAdmin = infoGrupo.participants.find(p => p.id === quienReacciona);
        const esAdmin = encontrarAdmin && (encontrarAdmin.admin === 'admin' || encontrarAdmin.admin === 'superadmin');
        if (!esAdmin) continue;

        const usuarioObjetivo = r.key.participant;
        if (!usuarioObjetivo) continue;

        if (emoji === '🗑️' || emoji === '❌') {
          try { await sock.sendMessage(remitente, { delete: r.key }); } catch (e) {}
          continue;
        }
      }
    } catch (error) { 
      console.error('❌ Error en el motor de reacciones general:', error); 
    }
  });
}

setInterval(() => {
  const carpetaTmp = path.join(__dirname, 'tmp');
  if (fs.existsSync(carpetaTmp)) {
    const archivos = fs.readdirSync(carpetaTmp);
    for (const archivo of archivos) {
      try { fs.unlinkSync(path.join(carpetaTmp, archivo)); } catch (e) {}
    }
  }
}, 1000 * 60 * 30);

iniciarBot();
