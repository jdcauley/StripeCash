/**
 * AuthController.js
 *
 * @description ::
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var passport = require('passport'),
    request = require('request'),
    secrets = require('../../config/secrets');

module.exports = {

  index: function(req, res){
    res.view();
  },

  login: function(req, res){
    passport.authenticate('local', function(err, user, info){
      if ((err) || (!user)) {
        req.flash("message", '<div class="alert alert-danger">Invalid Credentials</div>');
        res.cookie("message", {message: "Invalid credentials", type: "error", options: {}});
        res.redirect("/");
        return;
      }

      req.logIn(user, function(err){
        if (err) {
          res.send(err);
          res.redirect('/');
        } else {
          req.session.authenticated = true;
          res.redirect("/user");
          return;
        }

      });
    })(req, res);
  },

  logout: function (req,res){
    req.logout();
    res.redirect('/out');
  },

  stripe: function(req, res, done){
    var params = req.params.all();
    console.log(params);

    var r = request.post('https://connect.stripe.com/oauth/token', function optionalCallback (err, httpResponse, body) {
      if (err) {
        return console.error(err);
      }
      console.log(body);
        var connect = JSON.parse(body);

        console.log(connect);
        User.update(req.user.id,{
          connect: {
            access_token: connect.access_token,
            livemode: connect.livemode,
            refresh_token: connect.refresh_token,
            token_type: connect.token_type,
            stripe_publishable_key: connect.stripe_publishable_key,
            stripe_user_id: connect.stripe_user_id,
            scope: connect.scope
          }
        }).exec(function(err, updated){
          if(err){
            req.flash("message", '<div class="alert alert-danger">' + err +'</div>');
            res.cookie("message", {message: "Error", type: "error", options: {}});
            res.redirect('/user');
            return;
          } else {
            req.flash("message", '<div class="alert alert-danger">You\'ve Connected your Stripe Account</div>');
            res.cookie("message", {message: "Success", type: "error", options: {}});
            res.redirect('/user');
            return;
          }
        });
    });

    var form = r.form()
        form.append('client_secret', secrets.stripe.secretKey),
        form.append('code', params.code),
        form.append('grant_type', 'authorization_code');

  }

};
