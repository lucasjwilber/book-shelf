'use strict';

const express = require('express');
const app = express();
const superagent = require('superagent');
require('dotenv').config();

const methodOverride = require('method-override');
app.use(methodOverride((request, response) => {
  if (request.body && typeof request.body === 'object' && '_method' in request.body) {
    let method = request.body._method;
    delete request.body._method;
    return method;
  }
}));

const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
const PORT = process.env.PORT || 32202;
client.on('error', error => console.error(error));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true, }));
app.use(express.static('public'));

//routes:
app.get('/', renderLibrary);

app.get('*', renderErrorPage);


function renderLibrary() {
  let sql = 'SELECT * FROM library;';
  client.query(sql)
    .then(results => {
      let library = results.rows;
      console.log(library);
    })
    .catch(error => console.error(error));
}
















client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`connected to database, app is up on port ${PORT}`));
  })
  .catch(error => {
    console.log('failed to connect to database. error message is:');
    console.error(error);
    console.log('end of error message.');
  });