const { Client, Location, Poll, List, Buttons, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fetch = require('fetch');
const cron = require("node-cron");

let userPhoneNumber = null;
let isSchedulerOn = false;
let currentScheduler = null;

const serverAPI = '' // endpoint del cual pedir datos de medición

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,
        args: ['--no-sandbox'],
        executablePath: "/usr/bin/google-chrome-stable",
    },
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', async () => {
    console.log('Bot iniciado!\n\n');
});

client.on('message', (message) => {
    console.log('Mensaje recibido de: ' + message.from);
    console.log(message.body)
    if (message.body.toLowerCase() == '.registrar'){
        if (userPhoneNumber == null) {
            userPhoneNumber = message.from;
            console.log('El número ' + userPhoneNumber + ' ha sido registrado.');
            client.sendMessage(message.from, 'Tu número fue registrado.');
        }
    }

    if (message.body.toLowerCase() == '.iniciartemporizador') {
        if (isSchedulerOn) {
            message.reply('El temporizador ya está activo.');
        }
        if (isSchedulerOn == false) {
            mensaje_periodico();
            message.reply('El temporizador ha sido iniciado. Recibirás un mensaje cada 30 minutos.');
        }
    }

    if (message.body.toLowerCase() == '.detenertemporizador') {
        if (isSchedulerOn) {
            const detener = detener_mensaje_periodico();
            if (detener) {
                message.reply('El temporizador se ha detenido con éxito.');
            } else if (!detener) {
                message.reply('El temporizador está activo pero por alguna razón no se detuvo'); // jamás debería pasar esto
            }
        } else if (!isSchedulerOn) {
            const detener = detener_mensaje_periodico()
            if (detener) {
                message.reply('El temporizador está detenido pero por alguna razón el sistema lo volvió a detener.'); // xd
            } else if (!detener) {
                message.reply('No hay ningún temporizador activo.');
            }
        }
    }
    if (message.body.toLowerCase() == '.ayuda') {
        client.sendMessage(userPhoneNumber, 'Los comandos disponibles son: \n\n*.iniciartemporizador* Cada 30 minutos recibirás las mediciones.\n*.detenertemporizador* Detendrá el temporizador.')
    }

});

function mensaje_periodico() {

    // en teoría esto no se necesita pero por las dudas lo dejo
    if (isSchedulerOn) return;

    isSchedulerOn = true;
    //

    currentScheduler = cron.schedule("1 * * * * *", () => {

        fetch(serverAPI, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);

            const co = data.CO ?? 'No disponible';
            const temperatura = data.Temperatura ?? 'No disponible';
            const humedad = data.Humedad ?? 'No disponible';
            let humo = data.Humo ?? 'No disponible';

            if (humo == true) { humo = 'Sí' } else if (humo == false) { humo = 'No' } else { humo = 'No disponible' };
            const message = 'Medición CO: ' + co + '\n\nMedición Temperatura: ' + temperatura + '\n\nMedición Humedad: ' + humedad + '\n\nHay humo: ' + humo;

        client.sendMessage(userPhoneNumber, message)
            .then(() => {
                console.log('Mensaje de medición por hora enviado a: ', userPhoneNumber);
            })
            .catch((err) => {
                console.log('El mensaje no se pudo enviar, el error es de whatsappweb-js: ', err);
            });
    })
        .catch(error => {
            console.error('Hubo un error al hacer la petición a la API: ', error)
            client.sendMessage(userPhoneNumber, 'Al pedirle los datos de medición al servidor hubo un error.');
        });
    });          

    console.log('El mensaje de medición periódico se inció.');
}

function detener_mensaje_periodico() {
    if (!isSchedulerOn || !currentScheduler) {
        console.log('Un temporizador intentó ser detenido pero no hay ninguno activo');
        return false;
    }

    currentScheduler.stop();
    isSchedulerOn = false;
    console.log('El temporizador activo se ha detenido por petición del usuario.');
    return true;
}








client.initialize();