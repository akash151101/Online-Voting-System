const mongoose = require('mongoose');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');
const mongooseHidden = require('mongoose-hidden')()


const authy = require('authy')('yB66tIIaJyxcHQP0ceGwbDHq2a6W95KS');
const twilioClient = require('twilio')('AC0723970c377a27a9c6440fd0e293fcb8', 'ac983fb0731b17e90baf3d65a2612542');


const UserSchema = new mongoose.Schema({
  name: String,
  username: String,
  countryCode: {
      type: String,
      default: "91"
  },
  phone: {
      type: String,
  },
  verified: {
      type: Boolean,
      default: false
  },
  authyId: String,
  password: String,
  googleId: String,
  facebookId: String,
  voterID: {
    type: String,
  },
  isVoted: {
    type: Boolean,
    default: false,
  },
  admin: {
    type: Boolean,
    default: false,
  }
}, { versionKey: false });
UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate);
UserSchema.plugin(mongooseHidden);


// Test candidate password
UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    const self = this;
    bcrypt.compare(candidatePassword, self.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

// Send a verification token to this user
UserSchema.methods.sendAuthyToken = function(cb) {
    let self = this;

    if (!self.authyId) {
        // Register this user if it's a new user
        authy.register_user(self.username, self.phone, '91',
            function(err, response) {
                if (err || !response.user) return cb.call(self, err);
                self.authyId = response.user.id;
                self.save(function(err, doc) {
                    if (err || !doc) return cb.call(self, err);
                    self = doc;
                    sendToken();
                });
            });
    } else {
        // Otherwise send token to a known user
        sendToken();
    }

    // With a valid Authy ID, send the 2FA token for this user
    function sendToken() {
        authy.request_sms(self.authyId, true, function(err, response) {
            cb.call(self, err);
        });
    }
};

// Test a 2FA token
UserSchema.methods.verifyAuthyToken = function(otp, cb) {
    const self = this;
    authy.verify(self.authyId, otp, function(err, response) {
        cb.call(self, err, response);
    });
};

// Send a text message via twilio to this user
UserSchema.methods.sendMessage = function(message, successCallback, errorCallback) {
        const self = this;
        const toNumber = '+'+self.countryCode+self.phone+'';
        // const toNumber = `+${self.countryCode}${self.phone}`;

        twilioClient.messages.create({
            to: toNumber,
            from: '8925476718',
            body: message,
        }).then(function() {
            successCallback();
        }).catch(function(err) {
            errorCallback(err);
        });
    };


// Export user model
module.exports = new mongoose.model('User', UserSchema);
