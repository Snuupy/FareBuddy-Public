var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');

var userSchema = mongoose.Schema({
  username: String,
  password: String,
  phone: String,
  uberId: String
});
userSchema.plugin(findOrCreate);


User = mongoose.model('User', userSchema);

module.exports = {
    User:User
};
