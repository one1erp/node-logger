const nodeLogger = require('./index.js');

const logger = nodeLogger({
    logFile: "logs\\test.log",
    days: 1,
    zip: true
});

logger.info("Testing logger");
