// pl-scraper.js
require('dotenv').config()
const axios = require("axios");
const cheerio = require("cheerio");
const moment = require('moment');
const mongoose = require('mongoose');
const Category = require('../models/category');
const Clue = require('../models/clue');
console.log(process.env.MONGO_URL)
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }).then(
  () => { console.log('mongo connected...') },
  err => { console.log(err) }
);

const limit = true;



let getSeason = async function(i) {
  const url = "http://j-archive.com/showseason.php?season=" + i;
  let season = await axios(url)
    
      const html = season.data;
      const $ = cheerio.load(html);
      const linkList = $("table td a");
      let gameIds = [];
      linkList.each((i, link) => {
        let href = $(link).attr('href');
        href = href.split("id=");
        let hrefId = href[1];
        gameIds.push(hrefId);
      });
    await getGames(gameIds);
    console.log('completed season')
    
}

let getGames = async function(gameIds) {
  console.log(gameIds)
  for(const gameId of gameIds) {
    console.log('Game: '+gameId);
    await createCategoriesAndClues(gameId)
  }
}

let createCategoriesAndClues = async function (gameId) {
  let gameurl = "http://www.j-archive.com/showgame.php?game_id=" + gameId;
  let question, value, category, airdate, qId;

  let response = await axios(gameurl)
  const $game = cheerio.load(response.data);

  let cats = [];
  categories = $game("#jeopardy_round .category_name");
  categories.each(async function (i, category) {
    let categoryName = $game(category).text().toLowerCase();
    //Create category here
    let c = await Category.findOneAndUpdate(
      { "title": categoryName },
      { "title": categoryName },
      { upsert: true, new: true }
    ).exec();
    cats.push(c);
  });

  let ad = $game("#game_title h1").text().split(" - ");
  if (ad[1]) {
    airdate = moment(ad[1], 'dddd, MMMM D, YYYY').toISOString();
    console.log("Working on: " + ad[1]);
  }
  
  const questions = $game("#jeopardy_round .clue");
  let qArr = [];

  questions.each(async function (i, q) {
    let answer = '';

    let qdiv = $game(q).find('div').first()
    let regex = /ponse">(.*)<\/e/
    if (qdiv) {
      qdivMouseover = $game(qdiv).attr('onmouseover')
      if (qdivMouseover) {
        let answermatch = qdivMouseover.match(regex)
        answer = answermatch[1]
      }
    }

      question = $game(q).find('.clue_text').text();
      qId = gameId + "_" + $game(q).find('.clue_order_number a').text();
      index = $game(q).index();
      category = cats[index];
      let tmpValue = $game(q).find('.clue_value').text();
      value = tmpValue.replace(/\$/g, '');

      if (value && question && answer) {

        let newClue = {
          airdate, answer, question, value, gameId, qId, category
        }
        let c = await Clue.findOneAndUpdate(
          { "qId": qId },
          newClue,
          { upsert: true, new: true }
        ).exec() 
      }
    })
    console.log('finished game')
}

let main = async function(){
  for (var i = 32; i < 35; i++) {
    console.log('Getting Season: ' + i);
    await getSeason(i)
  }
}
main();