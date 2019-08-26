const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ArticleSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  // `comment` is an object that stores a Comment id
  // The ref property links the ObjectId to the Note model
  // This allows us to populate the Article with an associated Note
  comment: {
    type: Schema.Types.ObjectId,
    ref: "Comment"
  }
});

const Article = mongoose.model("Article", ArticleSchema);

module.exports = Article;