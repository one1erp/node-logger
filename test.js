const nodeLogger = require('./index.js');

const logger = nodeLogger({
    logFile: "logs\\test.log",
    maxFiles: 3,
    zip: true,
    maxSize: "1k"
});

setInterval(() => {
    logger.info("Testing logger");
}, 1000*5)

