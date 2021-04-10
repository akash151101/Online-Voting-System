const mongoose = require("mongoose");
const session = require("express-session");


const candidateSchema = new mongoose.Schema({
  name: String,
  leader: String,
  president: String,
  candidateId: {
    type: String,
    required: true
  },
  voteCount: {
    type: Number,
    default: 0
  },
  image: String
}, {
  versionKey: false
});


module.exports = new mongoose.model('Candidate', candidateSchema);
