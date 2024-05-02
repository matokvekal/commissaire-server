export const ServerErrors = {
  GENERAL_ERROR: `An unexpected error occurred.`,
  DB_FIND_ERROR: `Error while finding parent information in the database.`,
  INVALID_GOOGLE_TOKEN: "The provided Google token is invalid.",
  MISSING_DETAILS: "Some details are missing.",
  NOT_REGISTERED: "You are not registered.",
  FAMILY_NOT_EXIST: "Family not exist.",
  CONTACT_ADMIN: "Contact admin to activate your account.",
  KID_ALREADY_REGISTERED: "Kid already registered.",
  TOO_MANY_TRIES: "Too many tries, please wait before trying again.",
  INVALID_OTP: "Invalid OTP or OTP expired.",
  SMS_FAILED: "Failed to send SMS.",
  USER_DELETED_SUCCESSFULLY: "User deleted successfully",
  REGISTRATION_LOGIN_SUCCESSFUL: "Registration successful, we sent you an OTP.",
  REGISTRATION_FAILED: "An error occurred during registration.",
  SOME_ERROR_OCCURRED: "Some error occurred.",
  OTP_EXPIRED: "OTP expired",
};

export const ServerMessages = {
  API_BASE_CREATE_SUCCESS: "Item created successfully",
  OTP_SENT_SUCCESS: "OTP sent successfully to parent",
  REGISTRATION_SUCCESS: "Registration successful",
  LOGIN_SUCCESS: "Login successful",
  AUTHORIZATION_SUCCESS: "Authorization successful",
};

export const ServerLoginMessages = {
  TOKEN_REQUIRED: "A token is required for authentication",
  LOGIN_REQUIRED: "You must be logged in to access this",
  AUTH_FAILED: "Authentication failed",
};

