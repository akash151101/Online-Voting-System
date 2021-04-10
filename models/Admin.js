const mongoose = require("mongoose");
const session = require("express-session");


const adminSchema = new mongoose.Schema({
  name: String,
  username: String,
  password: String,
  admin: Boolean
}, { versionKey: false });


module.exports = new mongoose.model("Admin", adminSchema);
