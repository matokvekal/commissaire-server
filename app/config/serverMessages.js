export const ServerErrors = {
	GENERAL_ERROR: `General Error from catch statment`,
	DB_FIND_ERROR: `Error  model`,
	API_BASE_CREATE_FAIL: 'Item creation failed,',
	API_BASE_CREATE_INVALID:
		'Could not create object, missing body data / wrong format',
	API_BASE_UPDATE_FAIL: 'Item update failed, check params match schema',
	API_BASE_UPDATE_INVALID:
		'Could not create object, missing body data / wrong format',
	API_BASE_DELETE_FAIL: 'Item delete failed, check params match schema',
	API_BASE_NO_IDENTIFIER:
		'Identifier value was not found in request / defined in controller',
};

export const ServerMessages = {
	API_BASE_CREATE_SUCCESS: 'Successfully created ',
	API_BASE_UPDATE_SUCCESS: 'Successfully updated ',
	API_BASE_DELETE_SUCCESS: 'Successfully deleted ',
};

export const ServerLoginMessages = {
	TOKEN_REQUIRED: 'A token is required',
	USER_NOT_FOUND_OR_EXP_TOKEN: 'Token expired',
	INVALID_TOKEN: 'Invalid Token',
	CANT_FIND_USER: 'Could not find user',
	WRONG_OTP: 'Error OTP',
	ERROR_PARSING_TOKEN: 'Invalid  token parsing',
	FIELD_NOT_VALID: 'Field not valid',
	FAILED_TO_SEND_SMS: 'Failed to send SMS',
	NOT_ALLOWED: 'No access',
	TO_MANY_SMS_TRYS: 'To many trys to login, call support',
	NO_USER_ROLE: 'No access',
	FAILED_TO_SEND_SMS_AND_EMAIL: 'Failed to send SMS or Email',
	CANT_FIND_EMAIL: 'Could not find user ',
	PASSWORD_IS_INCORRECT: 'Wrong password',
	NO_DATA: 'Missing Data',
	USER_ALREADY_EXIST: 'user already exist',
	EMAIL_NOT_VALID: 'This email is not valid',
	PASSWORD_NOT_VALID: 'This password is not valid',
	ERORR: 'ERROR',
	RACE_IS_NOT_PUBLIC: 'Cant find race / not public',
	USER_CANT_REGISTER: 'User cant register call support',
	TRY_LATER: 'Try again later',
	CONFITMATION_NOT_VALID: 'Confirmation not valid',
	USER_NOT_EXIST: 'User not exist',
	TO_MANY_SMS_TRYS: 'To many trys',
};
