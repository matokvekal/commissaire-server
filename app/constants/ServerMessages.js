export const ServerErrors = {
	GENERAL_ERROR: `An unexpected error occurred.`,
	DB_FIND_ERROR: `Error while finding parent information in the database.`,
	OTP_WAIT_ERROR: `You must wait before trying again due to repeated attempts.`,
	SMS_SEND_FAIL: `Failed to send SMS verification.`,
	USER_INACTIVE: `User cannot register, contact support.`,
	OTP_INVALID: `Invalid OTP or user not found.`,
	OTP_EXPIRED: `OTP time expired, please register again.`,
	API_BASE_CREATE_INVALID: 'Required fields are missing or invalid.',
};

export const ServerMessages = {
	API_BASE_CREATE_SUCCESS: 'Item created successfully',
	API_BASE_UPDATE_SUCCESS: 'Item updated successfully',
	API_BASE_DELETE_SUCCESS: 'Item deleted successfully',
};

export const ServerLoginMessages = {
	TOKEN_REQUIRED: 'A token is required for authentication',
	USER_NOT_FOUND_OR_EXP_TOKEN: 'User not found or Token expired',
	INVALID_TOKEN: 'Invalid Token',
	CANT_FIND_USER: "Phone number doesn't exist, or user isn't active",
	WRONG_OTP: 'Wrong confirmation code',
	ERROR_PARSING_TOKEN: 'Error parsing token',
	FIELD_NOT_VALID: 'Field not valid',
	FAILED_TO_SEND_SMS: 'Failed to send SMS',
	NOT_ALLOWED: 'User not allowed to access this api',
	TO_MANY_SMS_TRYS: 'To many trys to login, call support',
	NO_USER_ROLE: 'You must have user role to access',
	FAILED_TO_SEND_SMS_AND_EMAIL: 'Failed to send SMS or Email',
	CANT_FIND_EMAIL: 'Could not find user with this email', // TODO: change this
	PASSWORD_IS_INCORRECT: 'Password is incorrect', // TODO: change this
	NO_DATA: 'No data was given', // TODO: change this
	USER_ALREADY_EXIST: 'User with this email already exist',
};
