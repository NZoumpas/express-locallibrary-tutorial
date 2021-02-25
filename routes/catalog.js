var express = require("express");
var router = express.Router();

// REQUIRE CONTROLLERS MODULES
var book_controller = require("../controllers/bookController");
var author_controller = require("../controllers/authorController");
var genre_controller = require("../controllers/genreController");
var book_instance_controller = require("../controllers/bookinstanceController");

// ------- BOOK ROUTERS ------

//GET CATALOG HOME PAGE
router.get("/", book_controller.index);

//GET REQUEST FOR CREATING A BOOK.NOTE: 'THIS MUST COME BEFORE ROUTES THAT DISPLAY BOOK (use id)'
router.get("/book/create", book_controller.book_create_get);

//POST REQUEST FOR CREATING BOOK
router.post("/book/create", book_controller.book_create_post);

//GET REQUEST TO DELETE BOOK
router.get("/book/:id/delete", book_controller.book_delete_get);

//POST REQUEST TO DELETE BOOK
router.post("/book/:id/delete", book_controller.book_delete_post);

//GET REQUEST TO UPDATE BOOK
router.get("/book/:id/update", book_controller.book_update_get);

//POST REQUEST TO UPDATE BOOK
router.post("/book/:id/update", book_controller.book_update_post);

//GET REQUEST FOR ONE BOOK
router.get("/book/:id", book_controller.book_detail);

//GET REQUEST FOR LIST OF ALL BOOK ITEMS
router.get("/books", book_controller.book_list);

// ----- AUTHOR ROUTERS

//GET REQUEST FOR CREATING AUTHOR. NOTE: 'THIS MUST ONE COME BEFORE ROUTE FOR id (i.e display author)'
router.get("/author/create", author_controller.author_create_get);

//POST request for creating AUTHOR
router.post("/author/create", author_controller.author_create_post);

//GET request to delete AUTHOR
router.get("/author/:id/delete", author_controller.author_delete_get);

//POST request to delete AUTHOR
router.post("/author/:id/delete", author_controller.author_delete_post);

//GET request to update AUTHOR
router.get("/author/:id/update", author_controller.author_update_get);

//POST request to update AUTHOR
router.post("/author/:id/update", author_controller.author_update_post);

//GET request for one AUTHOR
router.get("/author/:id", author_controller.author_detail);

//POST request for list of all AUTHORS
router.get("/authors", author_controller.author_list);

// -------- GENRE ROUTERS ------

//GET request for creating a GENRE.NOTE: 'This must come before route that displays Genre (uses id)
router.get("/genre/create", genre_controller.genre_create_get);

//POST request for creating Genre
router.post("/genre/create", genre_controller.genre_create_post);

//GET request for delete GENRE
router.get("/genre/:id/delete", genre_controller.genre_delete_get);

//POST request for delete GENRE
router.post("/genre/:id/delete", genre_controller.genre_delete_post);

//GET request to update GENRE
router.get("/genre/:id/update", genre_controller.genre_update_get);

//POST request to update GENRE
router.post("/genre/:id/update", genre_controller.genre_update_post);

//GET request for one GENRE
router.get("/genre/:id", genre_controller.genre_detail);

//GET request for list of all GENRE
router.get("/genres", genre_controller.genre_list);

// --------- BOOKINSTANVE ROUTERS --------

//GET request for creating a Bookinstance.NOTE: 'This must come before route that displays Bookinstance (uses id)'
router.get(
  "/bookinstance/create",
  book_instance_controller.bookinstance_create_get
);

//POST request for creating Bookinstance
router.post(
  "/bookinstance/create",
  book_instance_controller.bookinstance_create_post
);

//GET request to delete Bookinstance
router.get(
  "/bookinstance/:id/delete",
  book_instance_controller.bookinstance_delete_get
);

//POST request for delete Bookinstance
router.post(
  "/bookinstance/:id/delete",
  book_instance_controller.bookinstance_delete_post
);

//GET request to update Bookinstanc
router.get(
  "/bookinstance/:id/update",
  book_instance_controller.bookinstance_update_get
);

//POST request to update Bookinstance
router.post(
  "/bookinstance/:id/update",
  book_instance_controller.bookinstance_update_post
);

//GET request for one Bookinstance
router.get("/bookinstance/:id", book_instance_controller.bookinstance_detail);

//GET request for list of all Bookinstance
router.get("/bookinstances", book_instance_controller.bookinstance_list);

module.exports = router;
