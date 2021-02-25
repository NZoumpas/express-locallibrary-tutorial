const { body, validationResult } = require("express-validator");
var Book = require("../models/book");
var Author = require("../models/author");
var Genre = require("../models/genre");
var BookInstance = require("../models/bookinstance");

var async = require("async");
const { find } = require("../models/genre");

exports.index = function (req, res) {
  async.parallel(
    {
      book_count: function (callback) {
        Book.countDocuments({}, callback); //pass an empty object as match condition to find all documents an this coolection
      },
      book_instance_count: function (callback) {
        BookInstance.countDocuments({}, callback);
      },
      book_instance_available_count: function (callback) {
        BookInstance.countDocuments({ status: "Available" }, callback);
      },
      author_count: function (callback) {
        Author.countDocuments({}, callback);
      },
      genre_count: function (callback) {
        Genre.countDocuments({}, callback);
      },
    },
    function (err, results) {
      res.render("index", {
        title: "Local Library Home",
        error: err,
        data: results,
      });
    }
  );
};

//display list of all books
exports.book_list = function (req, res, next) {
  Book.find({}, "title author")
    .populate("author")
    .exec(function (err, list_books) {
      if (err) {
        return next(err);
      }
      //sucess , so render
      res.render("book_list", { title: "Book List", book_list: list_books });
    });
};

//display detail page for a specifiec book
exports.book_detail = function (req, res, next) {
  async.parallel(
    {
      book: function (callback) {
        Book.findById(req.params.id)
          .populate("author")
          .populate("genre")
          .exec(callback);
      },
      book_instance: function (callback) {
        BookInstance.find({ book: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        //no resultaat
        var err = new Error("Book not found");
        err.status = 404;
        return next(err);
      }
      // success, so render
      res.render("book_detail", {
        title: results.book.title,
        book: results.book,
        book_instances: results.book_instance,
      });
    }
  );
};

//display book create form on GET
exports.book_create_get = function (req, res, next) {
  //Get all authors and genres, wich we can use for adding to our book
  async.parallel(
    {
      authors: function (callback) {
        Author.find(callback);
      },
      genres: function (callback) {
        Genre.find(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      res.render("book_form", {
        title: "Create Book",
        authors: results.authors,
        genres: results.genres,
      });
    }
  );
};

//handle book create on POST
exports.book_create_post = [
  //Convert the genre to an array ---- Μετατροπή του είδους σε πίνακα.
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  },

  //Validate and sanitise fields ----  Επικύρωση και απολύμανση πεδίων.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  //Process request after validation and sanitization ---- Επεξεργασία αιτήματος μετά την επικύρωση και απολύμανση
  (req, res, next) => {
    //Extract the validation errors from a request ---- Εξαγάγετε τα σφάλματα επικύρωσης από ένα αίτημα
    const errors = validationResult(req);

    //Create a Book object with escaped and trimmed data ---- Δημιουργήστε ένα αντικείμενο βιβλίου με διαγραμμένα και περικομμένα δεδομένα
    var book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });
    if (!errors.isEmpty()) {
      //There are errors.Render form agaain with sanitized values/error messages -- Υπάρχουν σφάλματα.
      //Δώστε ξανά τη φόρμα με αποτιμημένες τιμές / μηνύματα σφάλματος
      // Get all authors and genres for form. --- Βρείτε όλους τους συγγραφείς και τα είδη για φόρμα.
      async.parallel(
        {
          authors: function (callback) {
            Author.find(callback);
          },
          genres: function (callback) {
            Genre.find(callback);
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          }

          //Mark our selected genres as checked ---  Επισημάνετε τα επιλεγμένα είδη μας ως επιλεγμένα
          for (let i = 0; i < results.genres.length; i++) {
            if (book.genre.indexOf(results.genres[i]._id) > -1) {
              // Current genre is selected. Set "checked" flag ----  Έχει επιλεγεί το τρέχον είδος.Ορίστε "επιλεγμένη" σημαία.
              results.genres[i].checked = "true";
            }
          }
          res.render("book_form", {
            title: "Create Book",
            authors: results.authors,
            genres: results.genres,
            book: book,
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      //data from form is valid.Save book --- τα δεδομένα από τη φόρμα είναι έγκυρα. Αποθηκεύστε το βιβλίο
      book.save(function (err) {
        if (err) {
          return next(err);
        }
        //succes - redirect to new book record ---
        res.redirect(book.url);
      });
    }
  },
];

//display book delete form on GET
exports.book_delete_get = function (req, res, next) {
  async.parallel(
    {
      book: function (callback) {
        Book.findById(req.params.id)
          .populate("author")
          .populate("genre")
          .exec(callback);
      },
      book_bookinstances: function (callback) {
        BookInstance.find({ book: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        // No results.
        res.redirect("/catalog/books");
      }
      // Successful, so render.
      res.render("book_delete", {
        title: "Delete Book",
        book: results.book,
        book_instances: results.book_bookinstances,
      });
    }
  );
};
//handle book delete on POST
exports.book_delete_post = function (req, res, next) {
  async.parallel(
    {
      book: function (callback) {
        Book.findById(req.body.id)
          .populate("author")
          .populate("genre")
          .exec(callback);
      },
      book_bookinstances: function (callback) {
        BookInstance.find({ book: req.body.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      // Success
      if (results.book_bookinstances.length > 0) {
        // Book has book_instances. Render in same way as for GET route.
        res.render("book_delete", {
          title: "Delete Book",
          book: results.book,
          book_instances: results.book_bookinstances,
        });
        return;
      } else {
        // Book has no BookInstance objects. Delete object and redirect to the list of books.
        Book.findByIdAndRemove(req.body.id, function deleteBook(err) {
          if (err) {
            return next(err);
          }
          // Success - got to books list.
          res.redirect("/catalog/books");
        });
      }
    }
  );
};

//display book update form on GET
exports.book_update_get = function (req, res, next) {
  //Get book, authors and genres for form
  async.parallel(
    {
      book: function (callback) {
        Book.findById(req.params.id)
          .populate("author")
          .populate("genre")
          .exec(callback);
      },
      authors: function (callback) {
        Author.find(callback);
      },
      genres: function (callback) {
        Genre.find(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        //No result
        var err = new Error("Book not found");
        err.status = 404;
        return next(err);
      }
      //success. Mark our selected genres as checked
      for (
        var all_g_iter = 0;
        all_g_iter < results.genres.length;
        all_g_iter++
      ) {
        for (
          var book_g_iter = 0;
          book_g_iter < results.book.genre.length;
          book_g_iter++
        ) {
          if (
            results.genres[all_g_iter]._id.toString() ===
            results.book.genre[book_g_iter]._id.toString()
          ) {
            results.genres[all_g_iter].checked = "true";
          }
        }
      }
      res.render("book_form", {
        title: "Update Book",
        authors: results.authors,
        genres: results.genres,
        book: results.book,
      });
    }
  );
};

//handle book update on POST
exports.book_update_post = [
  // Convert the genre to an array -- Μετατροπή του είδους σε πίνακα
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  },

  // Validate and sanitise fields. -- Επικύρωση και απολύμανση πεδίων.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  // Process request after validation and sanitization. -- Επεξεργασία αιτήματος μετά την επικύρωση και απολύμανση.
  (req, res, next) => {
    // Extract the validation errors from a request. -- Εξαγάγετε τα σφάλματα επικύρωσης από ένα αίτημα
    const errors = validationResult(req);

    // Create a Book object with escaped/trimmed data and old id
    var book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
      _id: req.params.id, //This is required, or a new ID will be assigned! -- Αυτό απαιτείται, διαφορετικά θα εκχωρηθεί ένα νέο αναγνωριστικό!
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.
      //Υπάρχουν λάθη. Δώστε ξανά τη φόρμα με αποτιμημένες τιμές / μηνύματα σφάλματος

      // Get all authors and genres for form. --- Βρείτε όλους τους συγγραφείς και τα είδη για φόρμα.
      async.parallel(
        {
          authors: function (callback) {
            Author.find(callback);
          },
          genres: function (callback) {
            Genre.find(callback);
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          }

          // Mark our selected genres as checked. -- Επισημάνετε τα επιλεγμένα είδη μας ως επιλεγμένα
          for (let i = 0; i < results.genres.length; i++) {
            if (book.genre.indexOf(results.genres[i]._id) > -1) {
              results.genres[i].checked = "true";
            }
          }
          res.render("book_form", {
            title: "Update Book",
            authors: results.authors,
            genres: results.genres,
            book: book,
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      // Data from form is valid. Update the record. -- Τα δεδομένα από τη φόρμα είναι έγκυρα. Ενημερώστε την εγγραφή.
      Book.findByIdAndUpdate(req.params.id, book, {}, function (err, thebook) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to book detail page. --- Επιτυχής - ανακατεύθυνση στη σελίδα λεπτομερειών του βιβλίου.
        res.redirect(thebook.url);
      });
    }
  },
];
