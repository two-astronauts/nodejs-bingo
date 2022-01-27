const { workerData, parentPort } = require('worker_threads')

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

setTimeout(() => {
    let b = generateArray(1, 15);
    let i = generateArray(16, 30);
    let n = generateArray(31, 45);
    let g = generateArray(46, 60);
    let o = generateArray(61, 75);

    parentPort.postMessage({ b, i, n, g, o })
}, workerData);
