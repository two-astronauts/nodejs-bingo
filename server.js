const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: 'http://localhost:4200',
        methods: ['GET', 'POST']
    }
});

var names = [];
var isGameStarted = false;
var numbers = [];

const generateArray = (min, max) => {
    let arrayContainer = [];
    const genNum = Math.floor(Math.random() * (max - min + 1) + min);
    arrayContainer.push(genNum);
    console.time();
    for (let counter = 0; counter < 4; counter++) {
        let newGen = Math.floor(Math.random() * (max - min + 1) + min);
        while (arrayContainer.lastIndexOf(newGen) !== -1) {
            newGen = Math.floor(Math.random() * (max - min + 1) + min);
        }
        arrayContainer.push(newGen);
    }
    console.timeEnd();
    return arrayContainer;
};

const newGame = () => {
    isGameStarted = true;
    numbers = Array.from({length: 75}, (_, i) => i + 1);
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
                    io.emit('message', { message: 'No hay un ganador en este juego', type: 'warning'});
                }
                endGame();
            }
        }
    }
};

const getWord = (number) => {
    switch (true) {
        case (number <= 15) :
            return 'B';
        case (number <= 30) :
            return 'I';
        case (number <= 45) :
            return 'N';
        case (number <= 60) :
            return 'G';
        case (number <= 75) :
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

    let b = generateArray(1, 15);
    let i = generateArray(16, 30);
    let n = generateArray(31, 45);
    let g = generateArray(46, 60);
    let o = generateArray(61, 75);

    io.to(socket.id).emit('table', { b, i, n, g, o });

    socket.on('message', (message) => {
        console.log(message);
    });

    socket.on('name', (message) => {
        socket.data.user = { name: message };
        names.push(socket.data.user.name);
        io.emit('name', names);
        io.emit('message', { message: `Bienvenido ${message}`, type: 'info' });
        if (names.length >= 2 && !isGameStarted) {
            newGame();
        }
    });

    socket.on('win', (message) => {
        if (isGameStarted) {
            io.emit('message', { message: `El ganador es ${socket.data.user.name}`, type: 'win'});
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
