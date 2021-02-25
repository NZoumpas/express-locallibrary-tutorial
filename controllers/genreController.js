const { body, validationResult } = require("express-validator");
var Genre = require("../models/genre");
var Book = require("../models/book");
var async = require("async");

//display list of all gendre
exports.genre_list = function (req, res, next) {
  Genre.find()
    .sort([["family_name", "ascending"]])
    .exec(function (err, list_genres) {
      if (err) {
        return next(err);
      }
      //success, so render
      res.render("genre_list", {
        title: "Genre List",
        list_genres: list_genres,
      });
    });
};

//display detail page for a spesifiec Genre
exports.genre_detail = function (req, res, next) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books: function (callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // no results
        var err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }
      // success, so render
      res.render("genre_detail", {
        title: "Genre Detail",
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

//display genre create form on GET
exports.genre_create_get = function (req, res, next) {
  res.render("genre_form", { title: "Create Genre" });
};

//handle genre create on POST
exports.genre_create_post = [
  //validate and santise the name field -- επικύρωση και απολύμανση του πεδίου ονόματος
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),
  //process equest after validation and sanitization -- επεξεργασία αίτησης μετά την επικύρωση και απολύμανση
  (req, res, next) => {
    //Extract the validatioon errors from a request -- Εξαγάγετε τα σφάλματα επικύρωσης από ένα αίτημα
    const errors = validationResult(req);
    //Create a genre object with escaped and trimmed data -- Δημιουργήστε ένα είδος είδους με δεδομένα διαφυγής και περικοπής
    var genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      //The are errors.Render the form again with sanitized values/error messages
      //-- Τα σφάλματα είναι. Δώστε ξανά τη φόρμα με αποτιμημένες τιμές / μηνύματα σφάλματος
      res.render("genre_form", {
        title: "Create Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      //Data from form is valid -- Τα δεδομένα από τη φόρμα είναι έγκυρα
      // Check if Genre with same name already exists. -- Ελέγξτε εάν υπάρχει ήδη είδος με το ίδιο όνομα.
      Genre.findOne({ name: req.body.name }).exec(function (err, found_genre) {
        if (err) {
          return next(err);
        }
        if (found_genre) {
          //Genre exists, redirect to its detail page. -- Το είδος υπάρχει, ανακατεύθυνση στη σελίδα λεπτομερειών του.
          res.redirect(found_genre.url);
        } else {
          genre.save(function (err) {
            if (err) {
              return next(err);
            }
            //Genre saved. redirect to genre detail page.-- Το είδος αποθηκεύτηκε. ανακατεύθυνση στη σελίδα λεπτομερειών του είδους
            res.redirect(genre.url);
          });
        }
      });
    }
  },
];

//display genre form on GET
exports.genre_delete_get = function (req, res, next) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books: function (callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        //no result
        res.redirect("/catalog/genres");
      }
      //success
      res.render("genre_delete", {
        title: "Delete Genre",
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

//handle genre delete on POST
exports.genre_delete_post = function (req, res, next) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books: function (callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre_books.length > 0) {
        res.render("genre_delete", {
          title: "Delete Genre",
          genre: results.genre,
          genre_books: results.genre_books,
        });
        return;
      } else {
        Genre.findByIdAndRemove(req.body.id, function deleteGenre(err) {
          if (err) {
            return next(err);
          }
          res.redirect("/catalog/genres");
        });
      }
    }
  );
};

// Display Genre update form on GET.
exports.genre_update_get = function (req, res, next) {
  Genre.findById(req.params.id, function (err, genre) {
    if (err) {
      return next(err);
    }
    if (genre == null) {
      // No results.
      var err = new Error("Genre not found");
      err.status = 404;
      return next(err);
    }
    // Success.
    res.render("genre_form", { title: "Update Genre", genre: genre });
  });
};

// Handle Genre update on POST.
exports.genre_update_post = [
  // Validate and sanitze the name field.
  body("name", "Genre name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request .
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data (and the old id!)
    var genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values and error messages.
      res.render("genre_form", {
        title: "Update Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      Genre.findByIdAndUpdate(
        req.params.id,
        genre,
        {},
        function (err, thegenre) {
          if (err) {
            return next(err);
          }
          // Successful - redirect to genre detail page.
          res.redirect(thegenre.url);
        }
      );
    }
  },
];
