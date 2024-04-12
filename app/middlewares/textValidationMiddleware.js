import { ServerLoginMessages } from '../constants/ServerMessages.js';

const shouldCleanValues = true;
// format: sign | sign, double back slash means the sign to right to it
const signsRegexString =
	'\\[|\\]|`|!|@|#|$|%|\\^|&|*|+|\\_|\\-|\\/|(|)|=|{|}|:|;|<|>';
const strongerSignsRegexString = `${signsRegexString}|'|,|\\.`;

const regexLevel2 = new RegExp(`[${signsRegexString}]`, 'gi');
const regexLevel3 = new RegExp(`[${strongerSignsRegexString}]`, 'gi');
// TODO: Gilad: there are some tricks to bypass this
const regexSqlInjection = new RegExp(
	'\\band|exec|insert|select|delete|update|count|LIMIT|and|chr|mid|master|truncate|UNION|char|declare|or\\b',
	'gi',
);

// REGEX LEVELS
const fieldsToCheckLevel1 = [
	'date',
	'from',
	'to',
	'fire_base_token_recived',
	'cars',
	'drivers',
	'text',
	'filters',
	'data',
	'0',
	'new_start_time',
	'startDate',
	'new_end_time',
	'time_to_arrive',
	'planning_ids',
	'start_date',
	'end_date',
	'start_time',
	'end_time',
	'now',
	'amount',
	'start',
	'end',
	'birth_date',
	'date_of_sale',
	'date_of_purchase',
	'event_date',
	'default_route_ids',
	'not_default_route_ids',
	'all_routes_ids',
	'reported_time',
	'planning_id',
	'timeToArrive',
	'image',
	'customer_icon',
	'upload_at',
	'entity_name',
	'order_start',
	'order_end',
	'review_date',
	'arrived_at',
	'arrivedAt',
	'trip_name', //trips name in create order can by with signs
	'customer_name',
	'email',
	'password',
	'validation',
	'full_utc_start_date',
	'full_utc_end_date',
	'fire_base_token',
	'customers_ids',
	'customers_name',
	'calendar_type',
	'document',
	'order_container_name',
	'description',
	'driver_email',
]; // array of fields that are allowed all signs
const fieldsToCheckLevel2 = ['lat', 'long', 'errorRadius', 'zones']; // array of fields that are allowed only some signs - regexLevel2
// level 3 - fields that are in the arrays are not allowed all the signs in 'strongerSignsRegexString'

// LENGTH LEVELS

const lengthLevel1 = 200000;
const lengthLevel2 = 75;
const lengthLevel3 = 70;
const lengthLevel1Array = [
	'fire_base_token',
	'customer_icon',
	'image',
	'document',
]; // allowed 200 characters
const lengthLevel2Array = []; // allowed 75 characters
// level 3 - allowed 50 characters

const isValueLengthOk = (key, value) => {
	if (value) {
		const stringValue = value.toString();
		if (lengthLevel1Array.includes(key)) {
			return stringValue.length <= lengthLevel1;
			// return true;
		}
		if (lengthLevel2Array.includes(key)) {
			return stringValue.length <= lengthLevel2;
		}
		return stringValue.length <= lengthLevel3;
	}
	return true;
};

const cleanValueFromSqlInjection = (value) => {
	if (value) {
		const stringValue = value.toString();
		const cleanValue = stringValue.replace(regexSqlInjection, '');
		return cleanValue.toString();
	}
	return value;
};

const cleanValueFromSigns = (key, value) => {
	if (value) {
		const stringValue = value.toString();
		if (fieldsToCheckLevel1.includes(key)) {
			return stringValue;
		}
		if (fieldsToCheckLevel2.includes(key)) {
			const cleanValue = stringValue.replace(regexLevel2, '');
			return cleanValue.toString();
		}
		const cleanValue = stringValue.replace(regexLevel3, '');
		return cleanValue.toString();
	}
	return value;
};

const cleanAllValuesFromObject = (object) => {
	if (object) {
		const cleanObject = Array.isArray(object) ? [] : {};
		const keysToCheck = Object.keys(object);
		if (shouldCleanValues && keysToCheck && keysToCheck.length) {
			for (const key of keysToCheck) {
				if (typeof object[key] === 'object') {
					cleanObject[key] = cleanAllValuesFromObject(object[key]);
				} else {
					const cleanValue = cleanValueFromSigns(
						key,
						cleanValueFromSqlInjection(object[key]),
					);
					if (isValueLengthOk(key, cleanValue)) {
						cleanObject[key] = cleanValue;
					} else {
						throw `LENGTH OF ${key} IS TOO LONG.`;
					}
				}
			}
		}
		return cleanObject;
	}
	return object;
};

const textValidationMiddleware = (req, res, next) => {
	try {
		req.body = req.body ? { ...cleanAllValuesFromObject(req.body) } : req.body;
		// req.query = req.query // blocks filter response with a lot of previous searches TODO: this is quick fix
		// ? { ...cleanAllValuesFromObject(req.query) }
		// : req.query;
		return next();
	} catch (err) {
		res.createErrorLogAndSend(this.sequelize, {
			message: `${ServerLoginMessages.FIELD_NOT_VALID} => ${
				err.message || err
			}`,
			status: 406,
		});
	}
};

export default textValidationMiddleware;
