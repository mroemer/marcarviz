/**
 * Database model for user accounts with mongoose and passport plugin
 * 
 * A user account requires:
 * - email (field username): String; unique identifier for each user (identifcal to email address)
 * - password (field hash): String; hashed and salted password
 * 
 * Additional fields:
 * - resetPasswordToken: String; token sent to users to authenticate password resets
 * - resetPasswordExpires: Date; expiration data of password token
 */
    
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
    username: { type: String, required: true, unique: true },
    hash: { type: String, required: true },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);

