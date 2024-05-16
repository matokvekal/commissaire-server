export default function checkType(value, type) {
  switch (type) {
    case "TIME":
      if (/^[0-2]?[0-9]:[0-5][0-9]$/.test(value)) {
        const [hours, minutes] = value.split(":").map(Number);
        return hours < 24 && minutes < 60;
      }
      return false;
    case "PERCENT":
      return typeof value === "string" && value >= 0 && value <= 100;
    case "BOOLEAN":
      return typeof value === "boolean";
    default:
      return false;
  }
}
