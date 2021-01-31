const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
require("dotenv").config();

const app = express();

const expressSession = require("express-session")({
  secret: "asckhnajedbeqkubxniw73fyhkadjs",
  resave: false,
  saveUninitialized: false,
});

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));
app.use(expressSession);
app.set("view engine", "ejs");

app.listen(3000, function (req, res) {
  console.log("Server running at 3000");
});

//////////////////////Passport Setup//////////////////////

const passport = require("passport");

app.use(passport.initialize());
app.use(passport.session());

//////////////////////////////////////////////////////////

///////////////////////Mongoose Setup/////////////////////

const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

mongoose.connect("mongodb://localhost:27017/secretsDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId:String,
  secret:String
});

const findOrCreate = require("mongoose-findorcreate");

userSchema.plugin(findOrCreate);
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

///////////////////////////////////////////////////////////

////////////////Passport Local Authentication//////////////

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

///////////////////////////////////////////////////////////

////////////////GOOGLE Authentication//////////////////////

const GoogleStrategy = require("passport-google-oauth20").Strategy;


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile.emails[0].value);
      User.findOrCreate({ googleId:profile.id, username:profile.emails[0].value}, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

////////////////////////////////////////////////////////////

const connectEnsureLogin = require("connect-ensure-login");

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["email","profile"] })
);

app.get( "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/secrets");
  }
);

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        console.log(user);
        // passport.authenticate("local")(req,res,function(){
        //   console.log(req.isAuthenticated());
        //   res.redirect("/secrets");
        // });

        req.login(user, function (err) {
          if (err) {
            console.log(err);
          }
          return res.redirect("/secrets");
        });
      }
    }
  );
});

app.get("/secrets", function (req, res) {
  User.find({"secret": {$ne:null}},function(err,foundUsers){
    if(err) console.log(err);
    else{
       res.render("secrets",{foundUsers:foundUsers});
    }
  });
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});


app.post("/submit", function (req, res) {
  const secret=req.body.secret;
  console.log(req.user);
  
  User.findById(req.user.id,function(err,foundUser){
     if(err) console.log(err);
     else{
       if(foundUser){
          foundUser.secret=secret;
          foundUser.save();
          res.redirect("/secrets");
       }
     }
  });

});