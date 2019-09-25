const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");

const exphbs = require("express-handlebars");
const path = require("path");

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
require("./routes/apiRoutes")(app);

app.listen(PORT, function () {
  console.log("Server listening on: http://localhost:" + PORT);
});