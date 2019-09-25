const axios = require("axios");
const cheerio = require("cheerio");

const db = require('../models');

module.exports = function (app) {
    app.get("/", function (req, res) {
        db.Article.find({ isSaved: false })
            .limit(15)
            .sort({ _id: -1 })
            .then(function (resultsObj) {     
                res.render("index", {articles: resultsObj});
            })
            .catch(function (err) {
                console.log(err);
            });
    });

    app.get("/saved", function(req, res) {
        db.Article.find({ isSaved: true })
            .then(function(resultsObj) {
                res.render("saved", {articles: resultsObj});
            })
            .catch(function(err) {
                console.log(err);
            });
    });

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
                    link: link,
                    isSaved: false
                });
            });

            db.Article.findOneAndUpdate(results, { $set: results }, { upsert: true, returnNewDocument: true } )
                .then(function (dbArticle) {
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    console.log(err);
                });
        });
        res.send("Scrape complete!");
    });

    // Route for saving an article
    app.post("/articles/save", function(req, res) {
        db.Article.update({ _id: req.body.id }, { $set: { isSaved: true } })
            .then(function(dbArticle) {
                res.json(dbArticle);
            })
            .catch(function(err) {
                console.log(err);
            });
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
        db.Comment.create(req.body)
            .then(function (dbComment) {
                // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
                // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
                // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
                return db.Article.findOneAndUpdate({ _id: req.params.id }, { comment: dbComment._id }, { new: true });
            })
            .then(function (dbArticle) {
                res.json(dbArticle);
            })
            .catch(function (err) {
                res.json(err);
            });
    });
}