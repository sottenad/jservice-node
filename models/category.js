const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  title: {
    type: String,
    unique: true
  }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category
