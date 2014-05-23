/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {

    username: {
      type: 'string',
      unique: true
    },
    email: {
      type: 'string',
      unique: true
    },
    password: {
      type: 'string',
      required: true
    },
    confirmPassword: {
      type: 'string',
      required: true
    },
    name: {
      type: 'string'
    },
    activated: {
      type: 'boolean',
      defaultsTo: false
    },
    activationToken: {
      type: 'string'
    },
    connect: {
      type: 'json'
    },
    customer: {
      type: 'json'
    },
    recipient: {
      type: 'json'
    },

    toJSON: function() {
      // this gives you an object with the current values
      var obj = this.toObject();
      delete obj.password;
      delete obj.confirmPassword;
      delete obj.confirmation;
      delete obj.activationToken;
      delete obj.activated;
      // return the new object without password
      return obj;
    },

	},

  beforeCreate: function(user, cb) {
    if (!user.password || user.password != user.confirmPassword) {
      console.log('comparison fail'); // replace with flash message
    } else {
      crypto.generate({saltComplexity: 10}, user.password, function(err, hash){
        if(err){
          return cb(err);
          // needs flash message
        }else{
          user.password = hash;
          user.confirmPassword = hash;
          user.activated = false; //make sure nobody is creating a user with activate set to true, this is probably just for paranoia sake
          user.activationToken = crypto.token(new Date().getTime()+user.email);
          return cb(null, user);
        }
      });
    }
  }
};
