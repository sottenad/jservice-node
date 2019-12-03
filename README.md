Uses Hapi & Mongoose to expose a simple API for serving trivia.

The Dev environment expects a .env file with the following:
`MONGO_URL` - the full url to the your mongo database.

We also expect some SSL keys - use [this](https://livebook.manning.com/book/hapi-js-in-action/chapter-11/209) to make it:
* `server.crt`
* `sever.key`

`npm run dev` starts the development server.
`npm run scrape` fetches clues from jarchive.com. **CAUSES EXTREME TRAFFIC - USE SPARINGLY**
