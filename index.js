const winston = require('winston');
require('winston-daily-rotate-file');
const addToZip = require('add2zip');
const ecsFormat = require('@elastic/ecs-winston-format')

const logger = (options) => {
    let logFileName = options.logFile;
    if (logFileName.trim().toLowerCase().endsWith(".log")) {
      logFileName = logFileName.slice(0, -4);
    }
    
    var transport = new winston.transports.DailyRotateFile({
      filename: logFileName + '-%DATE%.log',
      datePattern: 'DD.MM.YYYY',
      maxFiles: (options.days)? options.days + "d" : null,
    });
    
    if (options.zip) {
      transport.on('rotate', function(oldFileName, newFileName) {
        addToZip(logFileName + ".zip", oldFileName);
      });
    }
    
    let format = winston.format.printf((info) =>{
      let {timestamp, level, message, ...rest} = info;
      return JSON.stringify({
        timestamp,
        "log.level": level,
        message,
        ecs: {version:"1.6.0"},
        ...rest,
      });
    });

    let productionLogLever = (options.productionLogLevel)? options.productionLogLevel : "info";
    let developmentLogLevel = (options.developmentLogLevel)? options.developmentLogLevel : "debug";
    
    const winstonLogger = winston.createLogger({
      level: productionLogLever,
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'DD/MM/YYYY HH:mm:ss'
        }),
        winston.format.json({
          stable: true
        }),
        format
      ),
        transports: [
          transport
        ]
      });
    
    if (process.env.NODE_ENV !== 'production') {
      transport.level = developmentLogLevel;
      winstonLogger.add(new winston.transports.Console({
        level: developmentLogLevel,
        format: format,
      }));
    }

    return winstonLogger;
}



module.exports = logger