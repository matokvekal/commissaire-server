// utils/locationValidator.js

/**
 * Validates latitude and longitude values.
 * @param {number} latitude - The latitude to validate.
 * @param {number} longitude - The longitude to validate.
 * @returns {boolean} - True if both latitude and longitude are valid, otherwise false.
 */
function isValidLocation(latitude, longitude) {
  const isLatitudeValid = latitude >= -90 && latitude <= 90;
  const isLongitudeValid = longitude >= -180 && longitude <= 180;

  // Ensure that the coordinates are not zero and are valid earth coordinates
  if (
    !isLatitudeValid ||
    !isLongitudeValid ||
    latitude === 0 ||
    longitude === 0
  ) {
    return false;
  }

  return true;
}

module.exports = {
  isValidLocation,
};
