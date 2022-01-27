const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: ['http://localhost:4200', 'https://angular-bingo.herokuapp.com'],
        methods: ['GET', 'POST']
    }
});

const { Worker } = require('worker_threads');

var names = [];
var isGameStarted = false;
var numbers = [];
let test = false;

function runService(workerData) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./service.js', { workerData });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        })
    })
}

async function run(socket) {
    let time = 100;
    if (!test) {
        time = 5000;
        test = true;
    }
    const result = await runService(time);
    io.to(socket.id).emit('table', result);
    console.log(result);
}

const newGame = () => {
    test = false;
    isGameStarted = true;
    numbers = Array.from({ length: 75 }, (_, i) => i + 1);
    sendNumber();
};

const sendNumber = () => {
    if (isGameStarted) {
        if (names.length < 2) {
            endGame();
            io.emit('message', { message: 'Se finaliza la partida por falta de jugadores', type: 'warning' });
        } else {
            if (numbers.length > 0) {
                io.emit('number', getRandomNumber());
                setTimeout(() => {
                    sendNumber();
                }, 3000);
            } else {
                if (isGameStarted) {
                    io.emit('message', { message: 'No hay un ganador en este juego', type: 'warning' });
                }
                endGame();
            }
        }
    }
};

const getWord = (number) => {
    switch (true) {
        case (number <= 15):
            return 'B';
        case (number <= 30):
            return 'I';
        case (number <= 45):
            return 'N';
        case (number <= 60):
            return 'G';
        case (number <= 75):
            return 'O';
        default:
            console.log(`Sorry, we are out of ${number}.`);
            return '';
    }
};

const getRandomNumber = () => {
    const selectedNumber = numbers[Math.floor(Math.random() * numbers.length)];
    numbers = numbers.filter(number => number !== selectedNumber);
    return getWord(selectedNumber) + ' ' + selectedNumber;
};

const endGame = () => {
    isGameStarted = false;
};

app.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>');
});

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('message', (message) => {
        console.log(message);
    });

    socket.on('name', (message) => {
        socket.data.user = { name: message };
        names.push(socket.data.user.name);
        io.emit('name', names);
        io.emit('message', { message: `Bienvenido ${message}`, type: 'info' });
        run(socket).catch(err => console.error(err));
        if (names.length >= 2 && !isGameStarted) {
            newGame();
        }
    });

    socket.on('win', (message) => {
        if (isGameStarted) {
            io.emit('message', { message: `BINGO! El ganador es ${socket.data.user.name}`, type: 'win' });
            endGame();
        }
    });

    socket.on('disconnect', () => {
        names = names.filter(name => name !== socket.data.user.name);
        io.emit('name', names);
        console.log('a user disconnected!');
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
