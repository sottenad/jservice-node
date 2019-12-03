require('dotenv').config()

const Fs = require('fs');
const Path = require('Path');
const Hapi = require('@hapi/hapi');
const Category = require('./models/category');
const Clue = require('./models/clue');
const mongoose = require('mongoose');


mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}).then(
  () => { console.log('mongo connected...') },
  err => { console.log(err) }
);


const init = async () => {


  const server = Hapi.server({
    port:3000,
    tls:{
      key: Fs.readFileSync(Path.join(__dirname, 'server.key')),
      cert: Fs.readFileSync(Path.join(__dirname, 'server.crt'))
    },
    host:'localhost'
  })

  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) =>{
      return 'hello world';
    }
  })

  /* --------------------------------------------- */
  /* -------------- Categories ------------------- */
  /* --------------------------------------------- */

  server.route({
    method: 'GET',
    path: '/categories',
    handler: async (request, h) => {
      try {
          var cat = await Category.find().exec();
          return h.response(cat);
      } catch (error) {
          return h.response(error).code(500);
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/categories/{id}',
    handler: async (request, h) => {
      try {
          var cat = await Category.findOne({_id: request.params.id}).exec();
          return h.response(cat);
      } catch (error) {
          return h.response(error).code(500);
      }
    }
  })

  /* ---------------------------------------- */
  /* -------------- Clues ------------------- */
  /* ---------------------------------------- */

  server.route({
    method: 'POST',
    path: '/clues',
    handler: async (req, h) => {
      try {
          let query = {};
          let skip = 0;
          let limit = 100;
          if(req.payload){
            if(req.payload.value){
            query.value = req.payload.value
            }
            if(req.payload.min_date){
              query.airdate = {$gte: req.payload.min_date};
            }
            if(req.payload.max_date){
              query.airdate = {$lte: req.payload.max_date};
            }
            if(req.payload.category){
              query.category = {_id: req.payload.category}
            }
            if(req.payload.skip){
              skip = req.payload.skip;
            }
            if(req.payload.limit){
              limit = req.payload.limit;
            }

          }
          //console.log(query, skip, limit)
          var cat = await Clue.find(query).skip(parseInt(skip)).populate('category').limit(parseInt(limit)).exec();
          return h.response(cat);
      } catch (error) {
        //TODO: Log Errors
        console.log(error);
        return h.response(error).code(500);
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/clues/{id}',
    handler: async (request, h) => {
      try {
          var cat = await Clue.findOne({_id: request.params.id}).populate('category').limit(100).exec();
          return h.response(cat);
      } catch (error) {
          return h.response(error).code(500);
      }
    }
  })

  /* -------------------------------------- */
  /* -------------- 404 ------------------- */
  /* -------------------------------------- */
  server.route({
    method: '*',
    path: '/{any*}',
    handler: function (request, h) {
        return '404 Error! Page Not Found!';
    }
  });



  await server.start();
  console.log('Running on %s', server.info.uri);
}

process.on('unhandledRejection', (err) =>{
  console.log(err);
  process.exit(1)
})

init();