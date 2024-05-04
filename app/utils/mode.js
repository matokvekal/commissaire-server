const getModeFromEnv = () => {
  console.log("getModeFromEnv", process.env.MODE);

  return process.env.MODE || "staging";
};

export default getModeFromEnv;
