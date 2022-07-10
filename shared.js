const { createLogger, format, transports } = require('winston');
const Keyv = require('keyv');
let { database } = require('./settings.json');
const DataHandler = require('./classes/DataHandler.js');

if (!database) database = 'sqlite://database.sqlite';

const guildDatabase = new Keyv(database, { namespace: 'guild' });

module.exports = {
	data: {
		guild: new DataHandler(guildDatabase),
	},
	// single logger instance
	logger: createLogger({
		level: 'info',
		format: format.combine(
			format.errors({ stack: true }),
			format.timestamp(),
			format.printf(info => `${info.timestamp} [${info.label}] ${info.level.toUpperCase()}: ${info.message}`),
		),
		transports: [
			new transports.Console({
				format: format.combine(
					format(info => {
						info.level = info.level.toUpperCase();
						return info;
					})(),
					format.errors({ stack: true }),
					format.timestamp(),
					format.colorize(),
					format.printf(info => `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`),
				),
			}),
			new transports.File({ filename: 'logs/error.log', level: 'error' }),
			new transports.File({ filename: 'logs/log.log' }),
		],
	}),
};
