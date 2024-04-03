import { ServerErrors } from '../constants/ServerMessages.js';
import {
	createDebouncerForLogAction,
	createErrorLog,
	createLogs,
} from '../utils/apiLoggerUtils.js';

export const loggerMiddleware = (db) => async (req, _res, next) => {
	try {
		createDebouncerForLogAction(createLogs)(req, db);
		return next();
	} catch (err) {
		console.error(`LOGGER FAILED - ${err}`);
		return next();
	}
};

export const errorLoggerMiddleware = (db) => async (req, res, next) => {
	try {
		res.createErrorLogAndSend = async (
			{ err = { message: ServerErrors.GENERAL_ERROR },
				message = ServerErrors.GENERAL_ERROR,
				status = 500 }) => {
			const error = `${err.message || err} - ${message}`;
			await createErrorLog(db, req, error);
			return res.status(status).send({
				message,
			});
		};
		return next();
	} catch (innerError) {
		console.error(
			`ERROR LOGGER FAILED - ${innerError}`
		);
	}
};

export const systemLoggerMiddleware = (db) => async (req, _res, next) => {
	try {
		// TODO: system logger for micro services
		// createDebouncerForLogAction(createLogs)(req, db);
		return next();
	} catch (err) {
		console.error(`SYSTEM LOGGER FAILED - ${err}`);
		return next();
	}
};
