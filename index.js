const winston = require('winston');
require('winston-daily-rotate-file');
const ecsFormat = require('@elastic/ecs-winston-format')
const date = require('date-and-time');

const logger = (options) => {
    let logFileName = options.logFile;
    if (logFileName.trim().toLowerCase().endsWith(".log")) {
      logFileName = logFileName.slice(0, -4);
    }
    
    var transport = new winston.transports.DailyRotateFile({
      filename: logFileName + '-%DATE%.log',
      datePattern: 'DD.MM.YYYY',
      maxFiles: (options.days)? options.days + "d" : (options.maxFiles)? options.maxFiles : null,
      zippedArchive: options.zip,
      maxSize: (options.maxSize)? options.maxSize : null
    });
    
    
    let format = winston.format.printf((info) =>{
      let {timestamp, level, message, ...rest} = info;
      return JSON.stringify({
        timestamp,
        "log.level": level,
        message,
        ecs: {version:"1.6.0"},
        ...rest,
      }, circularReplacer());
    });

    let productionLogLever = (options.productionLogLevel)? options.productionLogLevel : "info";
    let developmentLogLevel = (options.developmentLogLevel)? options.developmentLogLevel : "debug";
    
    const winstonLogger = winston.createLogger({
      level: productionLogLever,
      format: winston.format.combine(
        winston.format.timestamp({
          format: localDateTimeFormat
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

/**
 * Set date time format to local
 * @returns String
 */
const localDateTimeFormat = () => {
  let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let now = new Date()
  return date.format(now, 'DD/MM/YYYY HH:mm:ss');  
}

/**
 * Check for circular reference and replace it with static error string
 * @returns any
 */
const circularReplacer = () => {
  
  // Creating new WeakSet to keep 
  // track of previously seen objects
  const seen = new WeakSet();
    
  return (key, value) => {

      // If type of value is an 
      // object or value is null
      if (typeof(value) === "object" 
                 && value !== null) {
        
      // If it has been seen before
      if (seen.has(value)) {
               return "ERROR_CIRCULAR_REFERENCE";
           }
             
           // Add current value to the set
           seen.add(value);
     }
       
     // return the value
     return value;
 };
};

module.exports = logger