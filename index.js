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
});

userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);

///////////////////////////////////////////////////////////

////////////////Passport Local Authentication//////////////

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

///////////////////////////////////////////////////////////

const connectEnsureLogin = require("connect-ensure-login");

app.get("/", function (req, res) {
  res.render("home");
});

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
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
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

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});
