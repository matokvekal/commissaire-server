export const ServerNumbers = {
  max_devices_amount: 300,
  maxLogsBeforeWrite: 10,
  maxSocketLogsBeforeWrite: 10,
  maxDiamonds: 100,
};
export const serverFlags = {
  LOG_API: true,
};

export const allowedFields = {
  ratio: "NUMBER", // jow many minutes kid can get from using banifician app
  daily_hours: "TIME",
  sun_start: "TIME",
  sun_end: "TIME",
  mon_start: "TIME",
  mon_end: "TIME",
  tue_start: "TIME",
  tue_end: "TIME",
  wed_start: "TIME",
  wed_end: "TIME",
  thu_start: "TIME",
  thu_end: "TIME",
  fri_start: "TIME",
  fri_end: "TIME",
  sat_start: "TIME",
  sat_end: "TIME",
  screen_time_control: "BOOLEAN",
  daily_schedule: "BOOLEAN",
  quality_control: "BOOLEAN",
};

//app status : (>blocked, >always_on, leisure, beneficial, neutral)
export const appStatus = {
  blocked: "blocked",
  alwaysOn: "always_on",
  leisure: "leisure",
  beneficial: "beneficial",
  neutral: "neutral",
  unknown: "unknown",
};
export const deviceCategories = {
  SYSTEM_APPS: {
    name: "System Apps",
    underscore_name: "system_apps",
    description: "Pre-installed by the device manufacturer or OS, with elevated privileges.",
  },
  NON_SYSTEM_APPS: {
    name: "Non-System Apps",
    underscore_name: "non_system_apps",
    description: "Installed by the user, limited to user-granted permissions.",
  },
  SYSTEM_UPDATE_APPS: {
    name: "System Update Apps",
    underscore_name: "system_update_apps",
    description: "Specialized apps for OTA updates, often part of Google Play Services.",
  },
  PRE_INSTALLED_APPS: {
    name: "Pre-Installed Apps",
    underscore_name: "pre_installed_apps",
    description: "Bloatware or carrier/OEM apps that are not critical to the OS.",
  },
  GOOGLE_PLAY_SYSTEM_UPDATES: {
    name: "Google Play System Updates",
    underscore_name: "google_play_system_updates",
    description: "Project Mainline updates, installed via Play Store for core Android modules.",
  },
  PRIVILEGED_APPS: {
    name: "Privileged Apps",
    underscore_name: "privileged_apps",
    description: "Apps in the privileged system folder with high-level access permissions.",
  },
};
