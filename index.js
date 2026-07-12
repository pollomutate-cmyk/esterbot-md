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

function guardarActividad(grupo, usuario, tipo) {
    try {
        if (!grupo || !usuario) return;
        let apagados = JSON.parse(fs.readFileSync(rutaGruposApagados, 'utf8'));
        if (apagados.includes(grupo)) return;
        
        let db = JSON.parse(fs.readFileSync(rutaDb, 'utf8'));
        if (!db[grupo]) db[grupo] = {};
        if (!db[grupo][usuario]) db[grupo][usuario] = { mensajes: 0, reacciones: 0 };
        
        if (tipo === 'mensaje') db[grupo][usuario].mensajes = (parseInt(db[grupo][usuario].mensajes) || 0) + 1;
        if (tipo === 'reaccion') db[grupo][usuario].reacciones = (parseInt(db[grupo][usuario].reacciones) || 0) + 1;
        
        fs.writeFileSync(rutaDb, JSON.stringify(db, null, 2));
    } catch (e) { 
        console.error('Error guardando actividad:', e); 
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
                console.error(`\x1b[31m❌ ERROR GRAVE en comando [${elemento}]: El archivo está roto.\x1b[0m`);
                console.error(e.message); 
            }
        }
    }

    if (directorio === path.join(__dirname, 'plugins')) {
        console.log(`\x1b[32m✅ ¡Carga completa! ${Object.keys(global.comandos).length} comandos listos en memoria.\x1b[0m`);
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
        printQRInTerminal: false
    });

    if (!sock.authState.creds.registered) {
        await delay(3000);
        console.log('📱 CONFIGURACIÓN POR NÚMERO DE TELÉFONO');
        const numero = await question('Introduce tu número de WhatsApp con código de país: ');
        const codigo = await sock.requestPairingCode(numero.trim());
        console.log(`\n🔑 Tu código de vinculación es: ${codigo}\n`);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const deberiaReconectar = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexión cerrada. Reconectando...');
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
        
        if (esGrupo) guardarActividad(remitente, quienEnvia, 'mensaje');

        const textoMensaje = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.text || "";
        let textoLimpio = textoMensaje.toLowerCase().trim();
        let partes = textoLimpio.split(/ +/);
        let comandoEscrito = partes.length > 0 ? partes[0].trim() : "";

        let listaApagados = JSON.parse(fs.readFileSync(rutaGruposApagados, 'utf8'));
        const estaApagadoEnEsteGrupo = esGrupo && listaApagados.includes(remitente);
        if (estaApagadoEnEsteGrupo && comandoEscrito !== '/boton') return;

        if (comandoEscrito === '/modoadmin on') {
            global.modoAdminGlobal = true;
            return await sock.sendMessage(remitente, { text: '🔒 *Modo Admin Activado*' });
        }
        if (comandoEscrito === '/modoadmin off') {
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

                if (global.modoAdminGlobal && !esAdmin && esGrupo) return;

                const comandosRestringidos = [
                    '/lista', '/integrantes', '/miembros', '/delete', '/del', '/dell', '/eliminar', '/borrar',
                    '/demote', '/despromover', '/quitaradmin', '/statusbot', '/botstatus', '/ping', '/estatus',
                    '/status', '/miestado', '/cerrar', '/abrir', '/close', '/open', '/kick', '/sacar',
                    '/largate', '/lárgate', '/embestir', '/ban', '/presentación', '/presentacion',
                    '/promote', '/promover', '/daradmin', '/topactivos', '/topinactivos', '/topreacciones',
                    '/menosreacciones', '/totalall', '/hideall', '/totaltag', '/hidetag', '/aceptar',
                    '/aprobar', '/rechazar', '/denegar', '/all', '/todos', '/tag', '/agregar', '/add', '/agg'
                ];
                
                if (comandosRestringidos.includes(comandoEscrito) && !esAdmin && esGrupo) {
                    return await sock.sendMessage(remitente, { text: '❌ Solo los administradores pueden usar este comando.' });
                }

                await global.comandos[comandoEscrito].run(sock, remitente, msg, obtenerMencionado);
            } catch (error) { 
                console.error(`Error en ejecución del comando [${comandoEscrito}]:`, error); 
            }
        }
    });

    sock.ev.on('reactions.update', async (reactions) => {
        try {
            for (const r of reactions) {
                const remitente = r.key.remoteJid;
                if (!remitente || !remitente.endsWith('@g.us')) continue;
                
                let apagados = JSON.parse(fs.readFileSync(rutaGruposApagados, 'utf8'));
                if (apagados.includes(remitente)) continue;

                const quienReacciona = r.sender || r.reaction?.key?.participant;
                if (!quienReacciona) continue;

                guardarActividad(remitente, quienReacciona, 'reaccion');

                const emoji = r.text || r.reaction?.text || "";
                if (!emoji) continue;

                const infoGrupo = await sock.groupMetadata(remitente);
                const encontrarAdmin = infoGrupo.participants.find(p => p.id === quienReacciona);
                const esAdmin = encontrarAdmin && (encontrarAdmin.admin === 'admin' || encontrarAdmin.admin === 'superadmin');
                if (!esAdmin) continue;

                const usuarioObjetivo = r.key.participant;
                if (!usuarioObjetivo) continue;

                const botNumero = sock.user.id.split(':') + '@s.whatsapp.net';
                if (usuarioObjetivo === botNumero) continue;

                if (emoji === '🗑️' || emoji === '❌') {
                    try {
                        await sock.sendMessage(remitente, { delete: r.key });
                    } catch (errorBorrado) {
                        console.error('Error al borrar por reacción:', errorBorrado);
                        await sock.sendMessage(remitente, { text: '❌ No se pudo eliminar el mensaje para todos. Asegúrate de que el bot sea administrador.' });
                    }
                    continue;
                }

                const mensajeSimulado = { key: r.key, usuarioObjetivoReaccion: usuarioObjetivo };

                if (emoji === '👑' && global.comandos['/promote']) {
                    await global.comandos['/promote'].run(sock, remitente, mensajeSimulado, obtenerMencionado);
                }
                
                if (emoji === '🚫' && global.comandos['/demote']) {
                    await global.comandos['/demote'].run(sock, remitente, mensajeSimulado, obtenerMencionado);
                }
                
                if (emoji === '🔨' && global.comandos['/kick']) {
                    await global.comandos['/kick'].run(sock, remitente, mensajeSimulado, obtenerMencionado);
                }
            }
        } catch (error) { 
            console.error('Error procesando comando por reacción:', error); 
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
    if (fs.existsSync(rutaDb)) {
        fs.writeFileSync(rutaDb, JSON.stringify({}));
        console.log('🟢 [Limpieza Quincenal]: ¡Base de datos de rankings reiniciada a cero!');
    }
}, 1000 * 60 * 60 * 24 * 15);

iniciarBot();
