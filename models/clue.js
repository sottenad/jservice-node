const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var clueSchema = new Schema({
  airdate: Date, 
  answer: String, 
  question: String, 
  value: Number, 
  gameId: Number,
  qId: String,
  category: {type: mongoose.Schema.Types.ObjectId, ref: 'Category'},
},{ timestamps: true });

var Clue = mongoose.model('Clue', clueSchema);
module.exports = Clue
