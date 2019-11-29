'use strict';

$('.selectBookButton').on('click', fillBookDetailsForm);
$('#editBookButton').on('click', fillBookDetailsForm);
$('#bookSubmitButton').on('click', bookSubmit);
$('#bookSubmitButton').on('submit', bookSubmit);
$('#closeFormButton').on('click', bookSubmit);


function bookSubmit(event) {
  $('#selectedBookForm').addClass("hide");
}

function fillBookDetailsForm() {

  let $selectedBook;
  if ($(this)[0].id === 'editBookButton') {
    $selectedBook = $(this).parent()[0].children[2].children;
  } else {
    $selectedBook = ($(this).parent()[0].children);
  }

  let $selectedImage = $selectedBook[0].src;
  let $selectedTitle = $selectedBook[1].textContent;
  let $selectedAuthor = $selectedBook[2].textContent;
  let $selectedDescription = $selectedBook[3].textContent;
  let $selectedISBN = $selectedBook[4].textContent;

  //if we're on the search page there won't be a bookshelf value defined yet. in that case index 5 would be the submit button.
  if ($selectedBook[5].tagName !== 'BUTTON') {
    let $selectedBookshelf = $selectedBook[5].textContent;
    $('#formBookShelf').val($selectedBookshelf);
  }

  $('#formImage').attr('src', $selectedImage);
  $('#formImageURL').val($selectedImage);
  $('#formTitle').val($selectedTitle);
  $('#formTitle').val($selectedTitle);
  $('#formAuthor').val($selectedAuthor);
  $('#formDescription').val($selectedDescription);
  $('#formISBN').val($selectedISBN);

  $('#selectedBookForm').removeClass("hide");
}
