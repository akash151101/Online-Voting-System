const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const flash = require('connect-flash');
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');
const saltRounds = 10;
// const config = require(__dirname + "/config.js");

// const nodemailer = require('nodemailer');
// const nodemailerSendgrid = require('nodemailer-sendgrid');
// const {
//   isNotVerified
// } = require(__dirname + "/index.js");
require('dotenv').config();
// const client = require("twilio")(config.accountSID, config.authToken);

// const sgMail = require('@sendgrid/mail')
// sgMail.setApiKey(process.env.SENDGRID_API_KEY)
// const transport = nodemailer.createTransport(nodemailerSendgrid({
//
//   auth: {
//     api_key: process.env.SENDGRID_API_KEY
//   },
//
// }));
// const crypto = require('crypto');

const app = express();
// const adminApp = express();



app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// adminApp.set("view engine", "ejs");
// adminApp.use(bodyParser.urlencoded({
//   extended: true
// }));
// adminApp.use(express.static(path.join(__dirname, 'public')));

// let index = require('./routes/index');

// Specifying the routes
// app.use('/', index);


app.use(session({
  secret: 'Online voting system project',
  resave: false,
  saveUninitialized: false,
}));


app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/UserDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '_' + Date.now() + path.extname(file.originalname));
  }
});
//
const upload = multer({
  storage: storage
}).single('file');

const User = require(__dirname + '/models/User');
const Candidate = require(__dirname + '/models/Candidate');
// const Admin = require(__dirname + '/models/Admin');

// let index = require(__dirname + '/routes/index.js');



// const userSchema = new mongoose.Schema({
//   name: String,
//   username: String,
//   password: String,
//   googleId: String,
//   facebookId: String,
// });
// userSchema.plugin(passportLocalMongoose);
// userSchema.plugin(findOrCreate);
// const User = new mongoose.model("User", userSchema);


passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// passport.use(Admin.createStrategy());
//
// passport.serializeUser(function(admin, done) {
//   done(null, admin.id);
// });
//
// passport.deserializeUser(function(id, done) {
//   Admin.findById(id, function(err, admin) {
//     done(err, admin);
//   });
// });
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/voting",
    userProfile: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      googleId: profile.id,
      name: profile.name.givenName
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/voting",
    profileFields: ["id", "email"]
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      facebookId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));




// const phoneNumber;

app.get("/", function(req, res) {
  res.render("home");
  req.flash("Success", "Hello there");
});
app.get("/about", function(req, res) {
  res.render("about")
});
app.get("/contact", function(req, res) {
  res.render("contact")
});
// app.get("/otpVerification", function{req, res}{
//   res.render("otpVerification");
// });

// app.get("/smsVerification", function(req, res){
//   res.render("smsVerification");
// });

app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile"]
  }));

app.get("/auth/facebook",
  passport.authenticate("facebook", {
    authType: 'reauthenticate',
    scope: ["profile"]
  }));

app.get("/auth/google/voting",
  passport.authenticate("google", {
    failureRedirect: "/login"
  }),
  function(req, res) {
    // Successful authentication, redirect Voting Page.
    res.redirect("/voting");
  });

app.get('/auth/facebook/voting',
  passport.authenticate('facebook', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect Voting Page.
    res.redirect('/voting');
  });

app.get("/login", function(req, res) {
  res.render("login")
});

app.get("/register", function(req, res) {
  res.render("register")
});

app.get("/voting", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("voting");
  } else {
    res.redirect("/login");
  }
});
// app.get("/test", function(req, res){
//   app.use("/users/new", index);
// })

// app.get("/test", function(req, res) {
//   if (req.isAuthenticated()) {
//     // console.log(req.user._id);
//     res.render('otpVerification', {
//       id: req.user._id
//     });
//
//     // app.use("/users/${req.user._id}/new");
//     // app.use("/", index);
//   } else {
//     res.redirect("/login");
//   }
// });


// ----------------------------------------------OTP NUMBER STARTS-----------------------------------------------

app.get("/users/new", function(req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user._id, function(error, user) {
      if (error) {
        console.log(error);
      } else {
        if (user.voterID) {
          console.log("You have already given your voter ID");
          res.redirect("/voting");
        }
        res.redirect("/users/" + req.user._id + "/new");
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.get('/users/:Userid/new', function(req, res) {
  res.render('otpVerification', {
    Id: req.params.Userid
  });
});

app.post('/users', function(req, res) {
  const params = req.body;

  // Create a new user based on form parameters
  const phoneNumber = params.phoneNumber;
  const userID = params.userID;
  let user = {}

  User.findOneAndUpdate({
    _id: userID
  }, {
    phone: phoneNumber,
    countryCode: '91',
    verified: false
  }, function(err, doc) {

    if (err) {
      // req.flash('errors', 'There was a problem creating your account - note that all fields are required. Please double-check your input and try again.');
      res.redirect('/users/new');
      // res.redirect('/users/new/${userID}');
    } else {
      user = doc;
      // If the user is created successfully, send them an account verification token
      user.sendAuthyToken(function(err) {
        if (err) {
          console.log(err);
          // req.flash('errors', 'There was a problem sending your token - sorry :(');
        }
        // Send to token verification page
        res.redirect('/users/' + doc._id + '/verify');

      });
    }



  });
  // user.save(function(err, doc) {
  //     if (err) {
  //         // req.flash('errors', 'There was a problem creating your account - note that all fields are required. Please double-check your input and try again.');
  //         res.redirect('/users/new');
  //     } else {
  //         // If the user is created successfully, send them an account verification token
  //         user.sendAuthyToken(function(err) {
  //             if (err) {
  //                 // req.flash('errors', 'There was a problem sending your token - sorry :(');
  //             }
  //             // Send to token verification page
  //             res.redirect(`/users/${doc._id}/verify`);
  //         });
  //     }
  // });
});

app.get('/users/:id/verify', function(req, res) {
  res.render('verify.ejs', {
    title: 'Verify Phone Number',
    // errors: req.flash('errors'),
    // successes: req.flash('successes'),
    id: req.params.id
  });
});


// Resend a code if it was not received
app.post('/users/:id/resend', function(request, response) {

  User.findById(request.params.id, function(err, user) {
    if (err || !user) {
      //console.log('User not found for this ID.');
      return die('User not found for this ID.');
    }
    // If we find the user, let's send them a new code
    user.sendAuthyToken(postSend);
  });

  // Handle send code response
  function postSend(err) {
    if (err) {
      //console.log('There was a problem sending you the code');
      return die('There was a problem sending you the code - please ' +
        'retry.');
    }

    //request.flash('successes', 'Code re-sent!');
    response.redirect('/users/' + request.params.id + '/verify');
  }

  // respond with an error
  function die(message) {
    // request.flash('errors', message);
    response.redirect('/users/' + request.params.id + '/verify');
  }
});

app.post('/users/:id/verify', function(request, response) {
  let user = {};

  User.findById(request.params.id, function(err, doc) {
    if (err || !doc) {
      return die('User not found for this ID.');
    }

    // If we find the user, let's validate the token they entered
    user = doc;
    user.verifyAuthyToken(request.body.code, postVerify);
    // response.redirect("/good");
  });

  // Handle verification response
  function postVerify(err) {
    if (err) {
      return die('The token you entered was invalid - please retry.');
    }

    // If the token was valid, flip the bit to validate the user account
    user.verified = true;
    user.save(postSave);
  }

  // after we save the user, handle sending a confirmation
  function postSave(err) {
    if (err) {
      console.log(err);
      return die('There was a problem validating your account please enter your token again.');
    }

    // Send confirmation text message
    // const message = 'You did it! Signup complete :)';
    // user.sendMessage(message, function() {
    // request.flash('successes', message);
    response.redirect(`/users/${user._id}`);
    // }, function(err) {
    //     // request.flash('errors', 'You are signed up, but we could not send you a message. Our bad :(');
    // });
  }
  // respond with an error
  function die(message) {
    console.log(message);
    response.redirect('/users/new');
    // response.redirect('/users/'+request.params.id+'/verify');
  }
});

app.get('/users/:id', function(request, response, next) {
  User.findById(request.params.id, function(err, user) {
    if (err || !user) {
      return next();
    }
    response.render('main.ejs', {
      title: 'Hi there ' + user.name + '!',
      user: user
      // errors: request.flash('errors'),
      // successes: request.flash('successes')
    });
  });
});




// ----------------------------------------------OTP NUMBER ENDS-----------------------------------------------

// app.use("/user", index);

// ----------------------------------------------VOTER ID REGISTRATION STARTS-----------------------------------------------
// app.get("/alreadyRegisteredVoterID", function(req, res) {
//   if (req.isAuthenticated()) {
//     res.redirect("/votingPage");
//   } else {
//     res.redirect("/login");
//   }
// });

app.post("/voterIDRegistration", function(req, res) {
  const voterRegistraionID = req.body.voterId;
  const voterTableID = req.body.voter;

  User.find({}, function(error, users) {
    if (error) {
      console.log(error);
      res.redirect("/voting");
    }
    users.forEach(function(user) {
      if (user.voterID) {
        bcrypt.compare(voterRegistraionID, user.voterID, function(err, result) {
          if (!err) {
            if (result == true) {
              console.log("This Voter ID has already been taken, Try someother voter ID");
              res.redirect("/voting");
            }
            bcrypt.hash(voterRegistraionID, saltRounds, function(error1, hash) {
              if (error1) {
                console.log(error1);
              } else {
                User.findByIdAndUpdate(voterTableID, {
                  voterID: hash,
                  isVoted: false,
                }, function(err1, user) {
                  if (err1) {
                    console.log(err1);
                  } else {
                    res.redirect("/checksUser");
                  }
                });
              }
            });
          }
        });
      }
    });
  });
});

app.get("/checksUser", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("vote", {
      VoterID: req.user._id
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/checksUser", function(req, res) {
  const voter_ID = req.body.Voter;
  const userEmail = req.body.email;
  const userVoterID = req.body.voterID;

  User.findById(
    voter_ID,
    function(error, foundUser) {
      if (error) {
        console.log(error);
      } else {

        if (foundUser) {
          bcrypt.compare(userVoterID, foundUser.voterID, function(err, result) {
            console.log(result);
            // result == true
            if (!err) {
              if (result == true) {
                res.redirect("/votingPage");
              } else {
                res.send("Recheck Your Voter ID");
              }
            }
          });
        }
      }
    });

});

// ----------------------------------------------VOTER ID REGISTRATION ENDS-----------------------------------------------

// BREAK

// ----------------------------------------------VOTING PAGE STARTS-----------------------------------------------
const Candidate1 = new Candidate({
  name: "BJP",
  leader: "Narendra Singh Modi",
  president: "Jagat Prakash Nadda",
  candidateId: "BJP1001",
  image: "BJP.png"
});

const Candidate2 = new Candidate({
  name: "INC",
  leader: " Manmohan Singh",
  president: "Sonia Gandhi ",
  candidateId: "INC2001",
  image: "INC.png"
});

const Candidate3 = new Candidate({
  name: "AAP",
  leader: "Arvind Kejriwal",
  president: "Prashant Bhushan",
  candidateId: "AAP3001",
  image: "AAP.png"
});

const defaultItem = [Candidate1, Candidate2, Candidate3];


app.get("/votingPage", function(req, res) {
  if (req.isAuthenticated()) {
    Candidate.find({}, function(error, foundCandidates) {
      if (!error) {
        if (foundCandidates.length === 0) {
          Candidate.insertMany(defaultItem, function(err) {
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully inserted all the document");
            }
          });
          res.redirect("/votingPage");
        } else {
          if (req.user.isVoted === false) {
            res.render("votingPage", {
              listHeading: "Give Your Vote",
              listInput: foundCandidates,
              voterid: req.user._id
            });
          } else {
            res.send("<h1>You have already voted</h1>");
          }
        }
      }
    });
  } else {
    res.redirect("/login");
  }
});


app.post("/votingPage", function(req, res) {

  const voterRegistered = req.body.voter;
  const partyVoted = req.body.candidateName;

  Candidate.findOneAndUpdate({
    name: partyVoted
  }, {
    $inc: {
      voteCount: 1
    }
  }, function(error, candidate) {
    if (error) {
      console.log(error);
      res.redirect("/login");
    }
    console.log("Successfully updated the Candidate Database");
  });

  User.findByIdAndUpdate(voterRegistered, {
    isVoted: true
  }, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/faliurePage");
    } else {
      // CREATE A SUCCESS PAGE FOR REDIRECTING USER
      res.redirect("/successPage");
    }
  });

  // Candidate.findOneAndUpdate({name: partyVoted}, {count: }, function(error, candidates){
  //       if(error){
  //         console.log(error);
  //       }else{
  //         candidates.count = candidates.count+1;
  //         candidates.voteCount = candidates.count;
  //       }
  // });

});



// ----------------------------------------------VOTING PAGE ENDS-----------------------------------------------



// ----------------------------------------------SUCCESS AND FAILURE PAGE STARTS-----------------------------------------------

app.get("/successPage", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("successPage");
  } else {
    res.redirect("/login");
  }
});

app.get("/faliurePage", function(req, res) {
  res.render("failurePage");
});




// ----------------------------------------------SUCCESS AND FAILURE PAGE ENDS-----------------------------------------------


// ----------------------------------------------ADMIN PAGE STARTS-----------------------------------------------
// admin.save(function(err){
//   if(err){
//     console.log(err);
//   }else{
//     console.log("Successfully saved the admin details");
//   }
// });

User.findOne({
  username: "test@gmail.com"
}, function(error, foundAdmin) {

  admin = new User({
    name: "Akash",
    username: "test@gmail.com",
    voterID: "default",
    admin: true
  });

  if (!error) {
    if (!foundAdmin) {
      User.register(admin, "test", function(err, admin) {
        if (err) {
          console.log(err);
        } else {
          passport.authenticate("local")(req, res, function() {
            console.log("Successfully saved the admin details");
          });
        }
      });
    }
  }
});


// bcrypt.hash("test", saltRounds, function(err, hash) {
//   const Admin1 = new Admin({
//     name: "Akash",
//     username: "test@gmail.com",
//     password: hash,
//     admin: true
//   });
//
//   Admin.find({}, function(err, foundAdmin) {
//     if (!err) {
//       if (foundAdmin.length === 0) {
//         Admin1.save(function(error) {
//           if (error) {
//             console.log(error);
//           } else {
//             console.log("Successfully Inserted One Admin");
//           }
//         });
//       }
//     }
//   });
// });

app.get("/adminLogin", function(req, res) {
  res.render("adminLogin");
});

app.get("/adminPage", function(req, res) {
  if ((req.isAuthenticated() && req.user.admin)) {
    res.render("adminPage");
  } else {
    res.redirect("/adminLogin");
    console.log("you are not registered as a admin");
  }
});

app.post("/adminPage", function(req, res) {
  admin = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(admin, function(err) {
    if (err) {
      console.log(err);
      res.redirect("/adminLogin");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/adminPage");
      });
    }
  });
});


// app.post("/adminPage", function(req, res) {
//   const adminEmail = req.body.email;
//   const adminPassword = req.body.password;
//   Admin.findOne({
//     email: adminEmail
//   }, function(error, foundAdmin) {
//     if (error) {
//       console.log(error);
//     } else {
//       if (foundAdmin) {
//         bcrypt.compare(adminPassword, foundAdmin.password, function(err, result) {
//           if (result === true) {
//             res.redirect("/adminPage");
//           }
//         });
//       }
//     }
//   });
// });



// --------------------------------------ADMIN ANALYSIS PAGE STARTS------------------------------------------

app.get("/adminAnalysisPage", function(req, res){
  let votedUser = 0;
  let voterWithID = 0;
  let voterVerified = 0;
  if ((req.isAuthenticated() && req.user.admin)) {
      User.find({}, function(error, foundUser){
        if(error){
          res.redirect("/adminLogin");
          console.log("No User Found");
        }
        else{
          if(foundUser){
            foundUser.forEach(function(user){
              if(user.isVoted){
                votedUser++;
              }
              if(user.voterID){
                voterWithID++;
              }
              if(user.verified){
                voterVerified++;
              }

            });
            res.render("adminAnalysis",{
              userVoted: votedUser,
              userWithID: voterWithID,
              userVerified: voterVerified,
              listInput: foundUser
            });
          }
        }
      });

  }
  else{
    res.redirect("/adminLogin");
  }
});



app.get("/editCandidatePage", function(req, res) {
  if ((req.isAuthenticated() && req.user.admin)) {
    Candidate.find({}, function(error, foundCandidates) {
      if (!error) {
        if (foundCandidates.length === 0) {
          Candidate.insertMany(defaultItem, function(err) {
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully inserted all the document");
            }
          });
          res.redirect("/editCandidatePage");
        } else {
          res.render("editCandidatePage", {
            listHeading: "Edit The Voting Page",
            listInput: foundCandidates,
          });
        }
      }
    });
  } else {
    res.redirect("/adminLogin");
    console.log("you are not registered as a admin");
  }
});



app.get("/updateCandidate/:id", function(req, res) {
  if ((req.isAuthenticated() && req.user.admin)) {
    Candidate.findById(req.params.id, function(error, foundCandidate) {
      if (!error) {
        if (foundCandidate) {
          res.render("updateCandidate", {
            candidateInfo: foundCandidate
          });
        }
      }
    });
  } else {
    res.redirect("/adminLogin");
    console.log("you are not registered as a admin");
  }
});

// app.post("/updateCandidate", function(req, res) {
//   const candidateID = req.body.candidateId;
//   res.redirect("/updateCandidate/"+candidateID);
// });

app.post("/updatedCandidate", function(req, res) {
  const candidateUniqueID = req.body.candidateUniqueID;
  const candidateName = req.body.candidateName;
  const candidateLeader = req.body.candidateLeader;
  const candidatePresident = req.body.candidatePresident;
  const candidateID = req.body.candidateID;

  Candidate.findByIdAndUpdate(candidateUniqueID, {
    name: candidateName,
    leader: candidateLeader,
    president: candidatePresident,
    candidateId: candidateID
  }, function(error, updatedCandidate) {
    if (error) {
      console.log(error);
    } else {
      console.log("Successfully Update the candidate");
      res.redirect("/editCandidatePage");
    }
  });
});


app.get("/createNewCandidate", function(req, res) {
  if ((req.isAuthenticated() && req.user.admin)) {
    res.render("createNewCandidate");
  } else {
    res.redirect("/adminLogin");
    console.log("you are not registered as a admin");
  }
});

app.post("/createNewCandidate", upload, function(req, res) {
  const candidateName = req.body.candidateName;
  const candidateLeader = req.body.candidateLeader;
  const candidatePresident = req.body.candidatePresident;
  const candidateID = req.body.candidateID;
  const candidateProfile = req.file.filename;

  const CandidateNew = new Candidate({
    name: candidateName,
    leader: candidateLeader,
    president: candidatePresident,
    candidateId: candidateID,
    image: candidateProfile
    // img: {
    //         data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
    //         contentType: 'image/png'
    //     }
  });

  CandidateNew.save(function(error) {
    if (error) {
      console.log(error);
    } else {
      console.log("Successfully created one candidate");
      res.redirect("/editCandidatePage");
    }
  });
});

app.post("/deleteCandidate", function(req, res) {
  const candidateName = req.body.candidateName;

  Candidate.deleteOne({
    name: candidateName
  }, function(error) {
    if (error) {
      console.log(error);
    } else {
      console.log("Successfully Deleted One Candidate");
      res.redirect("/editCandidatePage");
    }
  });
});

app.get("/resultPage", function(req, res){
  Candidate.find({}, function(error, foundCandidates){
    if(error){
      console.log(error);
    }
    else{
      if(foundCandidates){
        res.render("result", {
          candidateList: foundCandidates
        });
      }
    }
  });
});


// ----------------------------------------------ADMIN PAGE ENDS-----------------------------------------------

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

// app.post("/otpVerification", function(req, res){
//   phoneNumber = req.body.otpNumber;
//      client
//           .verify
//           .service(config.serviceID)
//           .verifications
//           .create({
//             to: phoneNumber,
//             channel: sms
//           })
//           .then((data)=>{
//             res.status(200).send(data);
//           })
//
//     res.redirect("/smsVerification");
// });

// app.post("/smsVerification", function(req, res){
//
// })


app.post("/register", function(req, res) {
  if (req.body.password === req.body.re_password) {
    Users = new User({
      username: req.body.username,
      name: req.body.name,
      // emailToken: crypto.randomBytes(64).toString("hex"),
      // isVerified: false
    });
    User.register(Users, req.body.password, function(err, user) {
      if (err) {
          // console.log(err);
          res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/login");
        });
      }
      // const msg = {
      //   to: req.body.username,
      //   from: "akash.a2019a@vitstudent.ac.in",
      //   subject: 'Online Voting System, Verify your email',
      //   text: 'Hello, Thanks for registering on our site.\r\n Please copy and paste the address below to verify your account \r\n http://${req.headers.host}/verify-email?token=${user.emailToken}',
      //   html: '<h1>Hello, </h1> \r\n <p>Thanks for registering on our site</p> \r\n <p>Please, click the link below to verify your account</p> \r\n <a href="http://${req.headers.host}/verify-email?token=${user.emailToken}">Verify your account</a>',
      // }
      //
      // transport.sendMail(msg, function(err, info) {
      //   if (err) {
      //     console.log(err);
      //     req.flash("Error", "Something went wrong, Please contact us at noreply@gmail.com");
      //     res.redirect("/");
      //   } else {
      //     console.log('Message sent: ' + info.response);
      //     req.flash("Success", "Thanks for registering. Please check your email to verify your account");
      //     res.redirect("/");
      //   }
      // });


      // try {
      //   await transport.send
      //   req.flash("Success", "Thanks for registering. Please check your email to verify your account");
      //   res.redirect("/");
      // } catch (error) {
      //   console.log(error);
      //   req.flash("Error", "Something went wrong, Please contact us at noreply@gmail.com");
      //   res.redirect("/");
      // }

    });
  } else {
    console.log("Password is not matching");
    res.redirect("/");
  }
});

// Email verification route

// app.get("/verify-email", async function(req, res, next) {
//   try {
//     const user = await User.findOne({
//       emailToken: req.query.token
//     });
//     if (!user) {
//       req.flash("Error", "Token is invalid, Please contact us for assistance");
//       res.redirect("/");
//     }
//     user.emailToken = null;
//     user.isVerified = true;
//     await user.save();
//     await req.login(user, async function(err) {
//       if (err) {
//         return next(err);
//       }
//       req.flash("Success", "Welcome to Online voting system ${user.name}");
//       const redirectUrl = req.session.redirectTo || "/";
//       delete req.session.redirestTo;
//       res.redirect(redirectUrl);
//     });
//   } catch (error) {
//     console.log(error);
//     req.flash("Error", "Something went wrong, please contact us for assistance");
//     res.redirect("/");
//   }
// });


app.post("/login", function(req, res) {
  user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/voting");
      });
    }
  });
});



app.listen(3000, function() {
  console.log("Server running on port 3000");
});

// adminApp.listen(3001, function() {
//   console.log("Server running on port 3001");
// });
