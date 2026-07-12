module.exports = {
    comando: ['/ruletarusa', '/ruleta', '/disparar'],
    run: async (sock, remitente, msg, obtenerMencionado) => {
        try {
            const esGrupo = remitente.endsWith('@g.us');
            if (!esGrupo) return;

            const quienEnvia = msg.key.participant || msg.key.remoteJid;
            const numEnvia = quienEnvia.split('@');

            const botNumero = sock.user.id.split(':') + '@s.whatsapp.net';
            if (quienEnvia === botNumero) return;

            // Simulamos el tambor de 6 recámaras
            const suerte = Math.floor(Math.random() * 6) + 1;

            let textoRuleta = `🔫  ═══  ☠️  *RULETA RUSA DE ROL*  ☠️  ═══  🔫\n\n`;
            textoRuleta += `👤  @${numEnvia}  ha colocado el revólver en su cabeza y jala el gatillo... *¡CLICK!*  ⚙️\n\n`;
            textoRuleta += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            if (suerte === 3) {
                // === ¡PUM! LE TOCA LA BALA (AHORA ES UN CASTIGO DE ROL DIVERTIDO SIN SACAR A NADIE) ===
                textoRuleta += `💥  *¡💥 PUMMMM! 💥*\n\n`;
                textoRuleta += `💀  *¡HAS CAÍDO EN COMBATE!*  💀\n`;
                textoRuleta += `_La bala de la mala suerte te alcanzó. Tu personaje ha muerto dramáticamente en este turno de rol._\n\n`;
                textoRuleta += `🩹  _¡Alguien del grupo debe darte un /abrazo o un /beso rápido para revivirte!_  🌸✨`;

                await sock.sendMessage(remitente, { text: textoRuleta, mentions: [quienEnvia] });
            } else {
                // === BANCO DE 5 FRASES DE SUPERVIVENCIA ALEATORIAS ===
                const frasesSupervivencia = [
                    `🍀  *¡SANGRE FRÍA!*  👑\n_El tambor giró y la recámara estaba vacía. Has sobrevivido una ronda más en Alfa x Omegas. ¡Sigue jugando si te atreves!_  😎🛡️`,
                    `🌌  *¡EL DESTINO TE PROTEGE!*  🪐\n_Escuchaste el eco del vacío... Hoy los astros están de tu lado y la muerte decidió pasar de largo. ¡Respira hondo!_  🕊️✨`,
                    `🎭  *¡PURAZA ADRENALINA!*  ⚡\n_El sudor corre por tu frente, pero el arma no disparó. Te salvaste por un pelo de rana calva. ¡Vuelve a tentar a la suerte!_  🏃‍♂️🔥`,
                    `👑  *¡SUERTE DE REY!*  💍\n_La bala se quedó con las ganas. Pareces inmune al peligro en este chat de rol. El destino tiene grandes planes para ti._  🪐💒`,
                    `🎰  *¡ESQUIVASTE EL COLOCHÓN!*  💨\n_¡Click en falso! La recámara limpia te da otra oportunidad para seguir escribir tu historia en la comunidad._  📝🌾`
                ];

                // Selecciona una de las 5 opciones al azar
                const fraseElegida = frasesSupervivencia[Math.floor(Math.random() * frasesSupervivencia.length)];
                textoRuleta += `${fraseElegida}`;

                await sock.sendMessage(remitente, { text: textoRuleta, mentions: [quienEnvia] });
            }

        } catch (error) {
            console.error('Error en el comando ruletarusa.js seguro:', error);
        }
    }
};
