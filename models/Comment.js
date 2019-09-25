const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  title: String,
  body: String,
  article: { 
    type: Schema.Types.ObjectId,
    ref: "Article" 
  }
});

const Comment = mongoose.model("Comment", CommentSchema);

module.exports = Comment;