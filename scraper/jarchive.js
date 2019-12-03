// pl-scraper.js

const axios = require("axios");
const cheerio = require("cheerio");
const moment = require('moment');
const mongoose = require('mongoose');
const Category = require('../models/category');
const Clue = require('../models/clue');

mongoose.connect('mongodb://sottenad:Steve1986!@ds231658.mlab.com:31658/jservice', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false}).then(
  () => { console.log('mongo connected...') },
  err => { console.log(err) }
);

const limit = true;
for(var i=1; i<3; i++){
  console.log('Getting Season: ' + i);
  getSeason(i)
}


function getSeason(i){
  const url = "http://j-archive.com/showseason.php?season="+i;
  axios(url)
    .then(response => {
      const html = response.data;
      const $ = cheerio.load(html);
      const linkList = $("table td a");
      let gameIds = [];
      linkList.each((i, link) => {
        let href = $(link).attr('href');
        href = href.split("id=");
        let hrefId = href[1];
        gameIds.push(hrefId);
      });
      return gameIds;
    })
    .then(gameIds => {
      getGames(gameIds);
    });
}

function getGames(gameIds){
  
    gameIds.forEach(function(gameId) {
      createCategoriesAndClues(gameId)
    });
}

function createCategoriesAndClues(gameId){
  let gameurl = "http://www.j-archive.com/showgame.php?game_id=" + gameId;

  axios(gameurl).then(response => {
    const html = response.data;
    const $game = cheerio.load(html);

    //Define vars
    let question, value, category, airdate, qId;

    //get an array of the category names, we'll need these later
    categories = $game("#jeopardy_round .category_name");
    categoryArr = [];
    categories.each(function(i, category) {
      let categoryName = $game(category).text().toLowerCase();
      //Create category here
      let c = Category.findOneAndUpdate(
        { "title" : categoryName }, 
        { "title" : categoryName },
        { upsert: true, new: true }
      ).exec();
      
      categoryArr.push(c)
    });

    Promise.all(categoryArr).then(cats =>{

        //get the airdate
      let ad = $game("#game_title h1").text().split(" - ");
      if (ad[1]) {
        airdate = moment(ad[1], 'dddd, MMMM D, YYYY').toISOString();
        console.log("Working on: " + ad[1]);
      }
      //OK, were going to do this twice, once for each round
      const questions = $game("#jeopardy_round .clue");
        questions.each(function(i, q){

          let answer = '';

          let qdiv = $game(q).find('div').first()
          let regex = /ponse">(.*)<\/e/
          if(qdiv){
            qdivMouseover = $game(qdiv).attr('onmouseover')
            if(qdivMouseover){
              let answermatch = qdivMouseover.match(regex)
              answer = answermatch[1]
            }
          }
        
          question = $game(q).find('.clue_text').text();
          qId = gameId + "_" + $game(q).find('.clue_order_number a').text();
          index =	$game(q).index();
          category = cats[index];
          let tmpValue = $game(q).find('.clue_value').text();
          value = tmpValue.replace(/\$/g, '');

          if(value && question && answer){

            let newClue = {
              airdate, answer, question, value, gameId, qId, category
            }
            let c = Clue.findOneAndUpdate(
              { "qId" : qId }, 
              newClue,
              { upsert: true, new: true },
              function(err, doc){
                if(err){ console.log(err) }
                else{ 
                  // console.log(doc)
                }
              }
            )
          }
        
      })
    })

    
  });
}