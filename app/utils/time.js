

// Convert HH:MM:SS format to total seconds
export const timeStringToSeconds = (timeStr) => {
   const [hours, minutes, seconds] = timeStr.split(':').map(Number);
   return hours * 3600 + minutes * 60 + seconds;
 };
 
 // Convert total seconds back to HH:MM:SS format
 export const secondsToTimeString = (totalSeconds) => {
   const hours = Math.floor(totalSeconds / 3600);
   const minutes = Math.floor((totalSeconds % 3600) / 60);
   const seconds = totalSeconds % 60;
   
   return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
 };
 
 // Calculate available time to add based on daily limit and used time
 export const calculateAvailableTime = (dailyLimitStr, dailyUsedStr) => {
   const dailyLimitSeconds = timeStringToSeconds(dailyLimitStr);
   const dailyUsedSeconds = timeStringToSeconds(dailyUsedStr);
   return dailyLimitSeconds - dailyUsedSeconds;
 };
 