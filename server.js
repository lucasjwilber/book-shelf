'use strict';

//server setup
const express = require('express');
const app = express();
const superagent = require('superagent');
require('dotenv').config();
const PORT = process.env.PORT || 3001;
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true, }));
app.use(express.static('public'));

//database setup
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', error => console.error(error));

//routes
app.get('/', renderHomePage);
app.get('/search', renderSearchPage);
app.post('/search', handleSearch);
app.get('/:id', displayDetailView);
app.post('/saveBook', saveBook);
app.put('/saveBook', updateBook);
app.post('/deleteBook', deleteBook);
app.get('*', handleError);


function renderHomePage(request, response) {
  client.query(`SELECT * FROM books;`)
    .then(results => {

      //get unique bookshelves from the results, and make an array of them
      let bookshelfNames = new Set();
      results.rows.forEach(book => bookshelfNames.add(book.bookshelf));
      let organizedLibrary = [];
      bookshelfNames.forEach(shelf => organizedLibrary.push({ name: shelf, books: [] }));

      //add each book to the array made for its corresponding bookshelf
      let allBooks = results.rows;
      allBooks.forEach(book => {
        organizedLibrary.forEach(shelf => {
          if (shelf.name === book.bookshelf) shelf.books.push(book);
        });
      });

      response.render('pages/index.ejs', { library: organizedLibrary, });
    })
    .catch(error => {
      databaseError(error, response);
    })
}


function renderSearchPage(request, response) {
  response.render('pages/search.ejs');
}


function handleSearch(request, response) {
  const searchType = request.body.searchType;
  const searchText = request.body.searchText;
  const url = `https://www.googleapis.com/books/v1/volumes?q=in${searchType}+${searchText}`;

  superagent.get(url)
    .then(results => {
      const arrayOfResults = results.body.items.slice(0, 10).map(book => {
        return new Book(book.volumeInfo);
      });

      client.query('SELECT DISTINCT bookshelf FROM books;')
        .then(results => {
          let bookShelves = results.rows;
          //TODO: do i need "override: false" below?
          response.render('pages/searchResults.ejs', { bookList: arrayOfResults, bookShelves: bookShelves, override: false, });
        })
        .catch(error => {
          databaseError(error, response);
        });
    })

    .catch(error => {
      console.error(error);
      response.status(500).render('pages/error.ejs');
    });
}


function displayDetailView(request, response) {
  let bookID = request.params.id;

  client.query(`SELECT * FROM books WHERE id=${bookID};`)
    .then(result => {
      let bookInfo = result.rows[0];

      client.query('SELECT DISTINCT bookshelf FROM books;')
        .then(results => {
          let bookShelves = results.rows;
          response.render('pages/bookDetailView.ejs', { book: bookInfo, bookShelves: bookShelves, override: true, });
        })
        .catch(error => {
          databaseError(error, response);
        });
    })
    .catch(error => {
      databaseError(error, response);
    });
}


function saveBook(request, response) {
  let obj = request.body;
  //use the default bookshelf option unless one was specified in the form
  let bookshelf = obj.newBookshelf ? obj.newBookshelf : obj.oldBookshelf;

  let sql = `INSERT INTO books (author, title, isbn, image_url, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;`;
  let safeValues = [obj.author, obj.title, obj.isbn, obj.image_url, obj.description, bookshelf];

  client.query(sql, safeValues)
    .then(results => {
      response.redirect(`/${results.rows[0].id}`);
    })
    .catch(error => {
      databaseError(error, response);
    });
}

//TODO: DRY up these v ^

function updateBook(request, response) {
  let obj = request.body;
  //use the default bookshelf option unless one was specified in the form
  let bookshelf = obj.newBookshelf ? obj.newBookshelf : obj.oldBookshelf;

  let sql = `UPDATE books SET author=$1, title=$2, isbn=$3, image_url=$4, description=$5, bookshelf=$6 WHERE id=$7 RETURNING id;`;
  let safeValues = [obj.author, obj.title, obj.isbn, obj.image_url, obj.description, bookshelf, obj.id];

  client.query(sql, safeValues)
    .then(results => {
      response.redirect(`/${results.rows[0].id}`);
    })
    .catch(error => {
      databaseError(error, response);
    });
}


function deleteBook(request, response) {
  client.query(`DELETE FROM books WHERE id=${request.body.id};`)
    .then(() => {
      console.log('book deleted from database');
      response.redirect('/');
    })
    .catch(error => {
      databaseError(error, response);
    });
}


function Book(obj) {
  this.author = obj.authors || obj.author || ['Author not found.'];
  this.title = obj.title || 'Title not found.';

  let isbn;
  if (obj.industryIdentifiers) isbn = obj.industryIdentifiers[0];
  this.isbn = isbn ? `${isbn.type} ${isbn.identifier}` : 'ISBN not found';

  if (!obj.imageLinks) { console.log(obj); }
  this.image_url = obj.imageLinks ? secureUrl(obj.imageLinks.thumbnail) : 'Image not found.';

  this.description = obj.description || 'Description not found.';
}

//Replace http with https for the image links
function secureUrl(url) {
  return url.replace(/^http:/i, 'https:');
}


function handleError(request, response, error) {
  console.error(error);
  response.status(404).render('pages/error.ejs');
}


function databaseError(error, response) {
  console.log('database error');
  console.error(error);
  response.render('pages/error.ejs').status(503);
}


//only start the server if the db is working
client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`Connected to DB, app is listening on port ${PORT}`));
  })
  .catch((error) => {
    console.error(error);
    console.log('failed to connect to db');
  });
