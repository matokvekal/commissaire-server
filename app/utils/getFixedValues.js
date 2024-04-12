// const moment = require('moment');
import moment from "moment";

const getFixedValue = (value) => {
  const regex = /[']/g;
  const valueType = typeof value;
  let returnValue;
  if (value !== null && value !== undefined && value !== "null") {
    if (valueType === "object") {
      returnValue = `'${moment(value)
        .format("YYYY-MM-DD HH:mm:ss")
        .replace(regex, "\\'")}'`;
    } else if (valueType === "string") {
      returnValue = `${value.toString().replace(regex, "\\'")}`;
    } else returnValue = `'${value.toString().replace(regex, "\\'")}'`;
  } else {
    returnValue = "null";
  }
  return returnValue;
};

const getFixedValueAndEqualSign = (value) => {
  const v = getFixedValue(value);
  return value || value === 0 ? `=${v}` : ` IS ${v}`;
};

export { getFixedValue, getFixedValueAndEqualSign };
