/**
 * CashController.js
 *
 * @description ::
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var secrets = require('../../config/secrets'),
    stripe = require("stripe")(secrets.stripe.secretKey);

module.exports = {

  transfer: function(req, res){
    var params = req.params.all(),
        transferAmount = Math.round(Number(params.amount) + 50);

    console.log(transferAmount);

    User.findOneByEmail(req.user.email, function(err, sender){
      User.findOneByEmail(params.reciever, function (err, reciever){
        stripe.transfers.create({
          amount: transferAmount, // amount in cents
          currency: "usd",
          recipient: 'self',
          card: sender.recipient.default_card,
          statement_description: 'Transfer to: ' + params.reciever
        }, function(err, fromSender) {
          if(err){
            console.log(err);
            req.flash("message", '<div class="alert alert-danger">Something went wrong</div>');
            res.cookie("message", {message: "Something went wrong", type: "error", options: {}});
            res.redirect('/user');
          } else {
            console.log(fromSender);
            if(reciever){

              stripe.transfers.create({
                amount: params.amount, // amount in cents
                currency: "usd",
                recipient: reciever.recipient.id,
                card: reciever.recipient.default_card,
                statement_description: 'Transfer to: ' + params.reciever
              }, function(err, toReciever) {
                if(err){
                  console.log(err);
                  req.flash("message", '<div class="alert alert-danger">Something went wrong</div>');
                  res.cookie("message", {message: "Something went wrong", type: "error", options: {}});
                  res.redirect('/user');
                } else {
                  console.log(toReciever);
                  req.flash("message", '<div class="alert alert-danger">You\re Transfer Should Finish in 2 Days</div>');
                  res.cookie("message", {message: "Success", type: "Success", options: {}});
                  res.redirect('/user');
                }
              });

            } else {
              console.log('set up email to send about transfer');
              mailer.send({
                from:       'jordan@cauley.co',
                to:         user.email,
                replyTo:    'jordan@cauley.co',
                subject:    'New Account Acivation Required',
                html:       '<h3>Thanks for signing up</h3><p><a href="http://localhost:1337/user/' + user.id + '/activate/' + user.activationToken + '">Please Activate Your Account</a></p>'
              }, function(err, response){
                sails.log.debug('nodemailer sent', err, response);
              });
              req.flash("message", '<div class="alert alert-danger">We Sent an Email asking them to accept your cash</div>');
              res.cookie("message", {message: "Success", type: "Success", options: {}});
              res.redirect('/user');
            }
          }
        });
      });
    });

  }

};
