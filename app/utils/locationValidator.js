// utils/locationValidator.js

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

export default isValidLocation;
