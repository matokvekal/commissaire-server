const validatePackageNames = (packageNames, maxLength = 200) => {
  const validPattern = /^[a-zA-Z0-9@.-]+$/; // Allowed characters: letters, digits, @, ., -
  const errorList = [];

  packageNames.forEach((packageName) => {
    if (packageName.length > maxLength || !validPattern.test(packageName)) {
      errorList.push(packageName); // Add invalid package to the error list
    }
  });

  return errorList;
};

export default validatePackageNames;
