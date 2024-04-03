// const moment = require('moment');
import moment from "moment";

const getFixedValue = (value) => {
  const regex = /[']/g;
  const valueType = typeof value;
  const returnValue =
    value !== null && value !== undefined && value !== "null"
      ? `'${(valueType === "object"
          ? moment(value).format("YYYY-MM-DD HH:mm:ss")
          : value.toString()
        ).replace(regex, "\\'")}'`
      : `null`;
  return returnValue;
};

const getFixedValueAndEqualSign = (value) => {
  const v = getFixedValue(value);
  return value || value === 0 ? `=${v}` : ` IS ${v}`;
};

export { getFixedValue, getFixedValueAndEqualSign };