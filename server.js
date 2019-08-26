const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
const axios = require("axios");
const cheerio = require("cheerio");
const exphbs = require("express-handlebars");
const path = require("path");

const db = require("./models");
const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// Use morgan logger for logging requests
app.use(logger("dev"));

// Connect to the Mongo DB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

// Handlebars template engine
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// set path for static assets
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", function (req, res) {
  res.render("index");
});

// A GET route for scraping the gamesindustry.biz website
app.get("/scrape", function (req, res) {
  axios.get("https://www.gamesindustry.biz/").then(function (response) {
    const $ = cheerio.load(response.data);
    let results = [];

    $(".entry").each(function (i, element) {
      const title = $(element).find("h2").attr("class", "title").text();
      const body = $(element).find("p").attr("class", "body").text();
      const link = $(element).find("a").attr("href");
      
      results.push({
        title: title,
        body: body,
        link: link
      });
    });

    db.Article.create(results)
      .then(function (dbArticle) {
        console.log(dbArticle);
      })
      .catch(function (err) {
        console.log(err);
      });
  });
  res.send("Scrape complete!");
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
  db.Article.find({})
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the comments associated with it
    .populate("Comment")
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function (dbComment) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbComment._id }, { new: true });
    })
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

app.listen(PORT, function () {
  console.log("Server listening on: http://localhost:" + PORT);
});