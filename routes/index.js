let express = require('express');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');
let router = express.Router();
const User = require('../models/User');

const app = express();

app.use(session({
  secret: 'Online voting system project',
  resave: true,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());


passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/voting",
    userProfile: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      googleId: profile.id
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

router.get("/", function(req, res) {
  res.render("home");
  req.flash("Success", "Hello there");
});
router.get("/about", function(req, res) {
  res.render("about")
});
router.get("/contact", function(req, res) {
  res.render("contact")
});
// router.get("/otpVerification", function{req, res}{
//   res.render("otpVerification");
// });

// router.get("/smsVerification", function(req, res){
//   res.render("smsVerification");
// });

router.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile"]
  }));

router.get("/auth/facebook",
  passport.authenticate("facebook", {
    authType: 'reauthenticate',
    scope: ["profile"]
  }));

router.get("/auth/google/voting",
  passport.authenticate("google", {
    failureRedirect: "/login"
  }),
  function(req, res) {
    // Successful authentication, redirect Voting Page.
    res.redirect("/voting");
  });

router.get('/auth/facebook/voting',
  passport.authenticate('facebook', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect Voting Page.
    res.redirect('/voting');
  });

router.get("/login", function(req, res) {
  res.render("login")
});

router.get("/register", function(req, res) {
  res.render("register")
});

router.get("/voting", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("voting");
  } else {
    res.redirect("/login");
  }
});
// router.get("/test", function(req, res){
//   router.use("/users/new", index);
// })

// router.get("/test", function(req, res) {
//   if (req.isAuthenticated()) {
//     // console.log(req.user._id);
//     res.render('otpVerification', {
//       id: req.user._id
//     });
//
//     // router.use("/users/${req.user._id}/new");
//     // router.use("/", index);
//   } else {
//     res.redirect("/login");
//   }
// });


// ----------------------------------------------OTP NUMBER-----------------------------------------------

router.get("/user/new", function(req, res){
  if(req.isAuthenticated()){
    res.redirect("/users/${req.user._id}/new");
  }
  else{
    res.redirect("/login");
  }
});

router.get('/users/:Userid/new', function(req, res) {
  console.log("Hello");
  res.render('otpVerification', {
    Id: req.params.Userid
  });
});

router.post('/users', function(req, res) {
  console.log("Hello world");
  const params = req.body;

  // Create a new user based on form parameters
  const phoneNumber = params.phoneNumber;
  const userID = params.userID;


  User.findOneAndUpdate({
    _id: userID
  }, {
    phone: phoneNumber,
    
  }, function(err, doc) {

    if (err) {
      // req.flash('errors', 'There was a problem creating your account - note that all fields are required. Please double-check your input and try again.');
      res.redirect('/users/new/${userID}');
    } else {
      // If the user is created successfully, send them an account verification token
      doc.sendAuthyToken(function(err) {
        if (err) {
          // req.flash('errors', 'There was a problem sending your token - sorry :(');
        }
        // Send to token verification page
        res.redirect(`/users/${doc._id}/verify`);

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

router.get('/users/:id/verify', function(req, res) {
  res.render('verify.ejs', {
    title: 'Verify Phone Number',
    // errors: req.flash('errors'),
    // successes: req.flash('successes'),
    id: req.params.id
  });
});


// Resend a code if it was not received
router.post('/users/:id/resend', function(request, response) {

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

router.post('/users/:id/verify', function(request, response) {
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

router.get('/users/:id', function(request, response, next) {
  User.findById(request.params.id, function(err, user) {
    if (err || !user) {
      return next();
    }
    response.render('main.ejs', {
      title: 'Hi there ' + user.fullName + '!',
      user: user
      // errors: request.flash('errors'),
      // successes: request.flash('successes')
    });
  });
});




// ----------------------------------------------OTP NUMBER-----------------------------------------------

// router.use("/user", index);


router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

// router.post("/otpVerification", function(req, res){
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

// router.post("/smsVerification", function(req, res){
//
// })


router.post("/register", function(req, res) {
  if (req.body.password === req.body.re_password) {
    Users = new User({
      username: req.body.username,
      name: req.body.name,
      // emailToken: crypto.randomBytes(64).toString("hex"),
      // isVerified: false
    });
    User.register(Users, req.body.password, function(err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      }
      else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/voting");
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

// router.get("/verify-email", async function(req, res, next) {
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


router.post("/login", function(req, res) {
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



// router.get('/', function (req, res) {
//     res.render('index');
// });
//
// router.get('/users/new', function (req, res) {
//     res.render('signup.ejs', {
//         title: 'Create User Account',
//         // errors: req.flash('errors')
//     });
// });
// // router.get("/good", function(req, res){
// //   res.send("Good, successfully registerd on my app");
// // });
// router.post('/users', function (req, res) {
//     const params = req.body;
//
//     // Create a new user based on form parameters
//     const user = new User({
//         fullName: params.fullName,
//         email: params.email,
//         phone: params.phone,
//         countryCode: '91',
//         password: params.password
//     });
//
//     user.save(function(err, doc) {
//         if (err) {
//             // req.flash('errors', 'There was a problem creating your account - note that all fields are required. Please double-check your input and try again.');
//             res.redirect('/users/new');
//         } else {
//             // If the user is created successfully, send them an account verification token
//             user.sendAuthyToken(function(err) {
//                 if (err) {
//                     // req.flash('errors', 'There was a problem sending your token - sorry :(');
//                 }
//                 // Send to token verification page
//                 res.redirect(`/users/${doc._id}/verify`);
//             });
//         }
//     });
// });
//
// router.get('/users/:id/verify', function (req, res) {
//     res.render('verify.ejs', {
//         title: 'Verify Phone Number',
//         // errors: req.flash('errors'),
//         // successes: req.flash('successes'),
//         id: req.params.id
//     });
// });
//
// // Resend a code if it was not received
// router.post('/users/:id/resend', function (request, response) {
//
//     User.findById(request.params.id, function(err, user) {
//         if (err || !user) {
//             //console.log('User not found for this ID.');
//             return die('User not found for this ID.');
//         }
//         // If we find the user, let's send them a new code
//         user.sendAuthyToken(postSend);
//     });
//
//     // Handle send code response
//     function postSend(err) {
//         if (err) {
//             //console.log('There was a problem sending you the code');
//             return die('There was a problem sending you the code - please '
//                 + 'retry.');
//         }
//
//         //request.flash('successes', 'Code re-sent!');
//         response.redirect('/users/'+request.params.id+'/verify');
//     }
//
//     // respond with an error
//     function die(message) {
//         // request.flash('errors', message);
//         response.redirect('/users/'+request.params.id+'/verify');
//     }
// });
//
// router.post('/users/:id/verify', function (request, response) {
//     let user = {};
//
//     User.findById(request.params.id, function(err, doc) {
//         if (err || !doc) {
//             return die('User not found for this ID.');
//         }
//
//         // If we find the user, let's validate the token they entered
//         user = doc;
//         user.verifyAuthyToken(request.body.code, postVerify);
//         // response.redirect("/good");
//     });
//
//     // Handle verification response
//     function postVerify(err) {
//         if (err) {
//             return die('The token you entered was invalid - please retry.');
//         }
//
//         // If the token was valid, flip the bit to validate the user account
//         user.verified = true;
//         user.save(postSave);
//     }
//
//     // after we save the user, handle sending a confirmation
//     function postSave(err) {
//         if (err) {
//             console.log(err);
//             return die('There was a problem validating your account please enter your token again.');
//         }
//
//         // Send confirmation text message
//         // const message = 'You did it! Signup complete :)';
//         // user.sendMessage(message, function() {
//             // request.flash('successes', message);
//             response.redirect(`/users/${user._id}`);
//         // }, function(err) {
//         //     // request.flash('errors', 'You are signed up, but we could not send you a message. Our bad :(');
//         // });
//     }
//     // respond with an error
//     function die(message) {
//         console.log(message);
//         response.redirect('/users/new');
//         // response.redirect('/users/'+request.params.id+'/verify');
//     }
// });
//
// router.get('/users/:id', function (request, response, next) {
//     User.findById(request.params.id, function(err, user) {
//         if (err || !user) {
//             return next();
//         }
//         response.render('main.ejs', {
//             title: 'Hi there ' + user.fullName + '!',
//             user: user
//             // errors: request.flash('errors'),
//             // successes: request.flash('successes')
//         });
//     });
// });

module.exports = router;
