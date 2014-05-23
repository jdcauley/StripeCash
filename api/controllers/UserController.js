/**
 * UserController.js
 *
 * @description ::
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

 var passport = require('passport'),
     Puid = require('puid'),
     secrets = require('../../config/secrets'),
     stripe = require("stripe")(secrets.stripe.secretKey);

module.exports = {

  index: function(req, res){
    res.view({
      user : req.user
    });
  },

  create: function(req, res){
    var params = req.params.all();

    User.findOneByEmail(params.email, function (err, userExists){
      if(userExists){

        req.flash("message", '<div class="alert alert-danger">User Exists - Do you need to Reset your Password?</div>');

        res.cookie("message", {message: "User Exists", type: "error", options: {}});
        res.redirect("/login");
        return;

      } else {

        User.create({
          username: params.email,
          email: params.email,
          password: params.password,
          confirmPassword: params.confirmPassword
        }).done(function userCreated(err, user){

          if (err) {
            req.flash("message", '<div class="alert alert-danger">Something went wrong</div>');

            res.cookie("message", {message: "Something went wrong", type: "error", options: {}});
            res.redirect("/login");
            return;
          } else {
            mailer.send({
              from:       'jordan@cauley.co',
              to:         user.email,
              replyTo:    'jordan@cauley.co',
              subject:    'New Account Acivation Required',
              html:       '<h3>Thanks for signing up</h3><p><a href="http://localhost:1337/user/' + user.id + '/activate/' + user.activationToken + '">Please Activate Your Account</a></p>'
            }, function(err, response){
              sails.log.debug('nodemailer sent', err, response);
            });
            req.flash("message", '<div class="alert alert-success">Plese Check Your Email</div>');

            res.cookie("message", {message: "Something went wrong", type: "error", options: {}});
            res.redirect("/");
          }
        });
      }

    });

  },

  activate: function(req, res){
    console.log('activate');
    var params = req.params.all();
    sails.log.debug('activation action');
    //Activate the user that was requested.
    User.update({
      id: params.id,
      activationToken: params.token
    },{
      activated: true
    }, function(err, user) {
      // Error handling
      if (err) {
        sails.log.debug(err);
        res.send(500, err);
      // Updated users successfully!
      } else {
        sails.log.debug("User activated:", user);
        res.redirect('/');
      }
    });
  },

  resetPass: function(req, res){

    puid = new Puid(true);

    var params = req.params.all();
    var newPass = puid.generate();

    User.findOneByEmail(params.email, function (err, userExists){

      if(userExists){

        crypto.generate({saltComplexity: 10}, newPass, function(err, hash){
          if(err){

            req.flash("message", '<div class="alert alert-danger">Opps, something went wrong, lets try again.</div>');

            res.cookie("message", {message: "Not a User", type: "error", options: {}});
            res.redirect("/forgot");
            return;

          }else{

            mailer.send({
              from:       'jordan@cauley.co',
              to:         user.email,
              replyTo:    'jordan@cauley.co',
              subject:    'Your Password Reset',
              html:       'Your new password for peices.co ' + newPass
            }, function(err, response){
              sails.log.debug('nodemailer sent', err, response);
            });
            newPass = hash;
            User.update(
              {password: user.password},
              {password: newPass}
            ).exec(function updateCB(err,updated){
              console.log('Updated user to have pass ' + newPass);
            });
          }
        });

      } else {

        req.flash("message", '<div class="alert alert-danger">Sorry, no account for that address</div>');

        res.cookie("message", {message: "Not a User", type: "error", options: {}});
        res.redirect("/forgot");
        return;

      }

    });
  },

  update: function(req, res, next){

    var params = req.params.all();

      User.update(req.user.id, params).exec(function(err, updated){
        if(err){
          req.flash("message", '<div class="alert alert-danger">' + err +'</div>');
          res.cookie("message", {message: "Error", type: "error", options: {}});
          res.redirect('/user');
          return;
        } else {
          return req.user;
          res.redirect('/user');
        }
      });

  },

  card: function(req, res, next){

    var params = req.params.all();
    console.log(params.stripeToken);

    User.findOneById(req.user.id, function(err, currentUser){
      console.log('user found');

      stripe.recipients.create({
        name: params.name,
        type: 'individual',
        email: currentUser.email,
        card: params.stripeToken
      }, function(err, recipient){
        if(err){
          console.log(err);
        } else {
          console.log(recipient);
          User.update(req.user.id, {recipient: recipient}).exec(function(err, updatedUser){
            if(err){
              console.log(err);
            } else {
              req.flash("message", '<div class="alert alert-danger">New Card and Recipient</div>');
              res.cookie("message", {message: "Success", type: "success", options: {}});
              res.redirect('/user');
              return;
            }
          });
        }
      });

    });

  },

  pass: function(req, res, next){
    var params = req.params.all();
    if (!params.password || params.password != params.confirmation) {
      req.flash("message", '<div class="alert alert-danger">' + err +'</div>');
      res.cookie("message", {message: "Error", type: "error", options: {}});
      res.redirect('/user');
      return;
    } else {
      crypto.generate({saltComplexity: 10}, params.password, function(err, hash){
        if(err){
          return cb(err);
        } else {
          params.password = hash;
          params.confirmation = hash;

          User.findOneById(req.user.id, function(err, user){
            User.update(
              {password: user.password},
              {password: params.password}
            ).exec(function updateCB(err, updated){
              res.redirect('/user');
            });
          });
        }
      });
    }
  },

};
