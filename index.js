const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
require("dotenv").config();
const bcrypt = require("bcrypt");
const saltRounds = 10;
const mongoose = require("mongoose");

const e = require("express");
mongoose.connect("mongodb://localhost:27017/secretsDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const app = express();

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));
app.set("view engine", "ejs");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const User = new mongoose.model("User", userSchema);

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    const user = new User({
      email: req.body.email,
      password: hash,
    });
    user.save(function (err) {
      if (err) {
        console.log(err);
      } else {
        res.render("secrets");
      }
    });
  });
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", function (req, res) {
  User.findOne({ email: req.body.email }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        bcrypt.compare( req.body.password,foundUser.password,
          function (err, result) {
            if (result === true) {
              res.render("secrets");
            }
            else{
              res.render("home");
            }
          }
        );
      }
      else{
        res.render("home");
      }
    }
  });
});

app.listen(3000, function (req, res) {
  console.log("Server running at 3000");
});
