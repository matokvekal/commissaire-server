import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  timestamp: Date,
  method: String,
  path: String,
  ip: String,
  visitorCount: Number,
});

export default logSchema;
