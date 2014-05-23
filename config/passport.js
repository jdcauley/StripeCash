var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

function findById(id, fn) {
  console.log(id);
  User.findOneById(id).done( function(err, user){
    if (err){
      return fn(null, null);
    }else{
      return fn(null, user);
    }
  });
}

function findByUsername(u, fn) {
  User.findOne({
    username: u,
    activated: true
  }).done(function(err, user) {
    // Error handling
    if (err) {
      return fn(null, null);
    // The User was found successfully!
    }else{
      return fn(null, user);
    }
  });
}

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});

module.exports = {

    // Init custom express middleware
    express: {
        customMiddleware: function (app) {
          console.log('custom middleware passport');

          passport.use(new LocalStrategy(
            function(username, password, done) {
              process.nextTick(function () {
                findByUsername(username, function(err, user) {
                  if (err) { return done(null, err); }
                  if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
                  crypto.compare(password, user.password, function(response) {
                    if(!response) return done(null, false, { message: 'Invalid Password' }); // error passwords dont compare
                    var returnUser = { username: user.username, createdAt: user.createdAt, id: user.id };
                    return done(null, returnUser, { message: 'Logged In Successfully'} );
                  });

                })
              });
            }
          ));

          app.use(passport.initialize());
          app.use(passport.session());

        }
    }

};
