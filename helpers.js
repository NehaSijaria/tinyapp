const getUserByEmail = (email, database) => {

  let user;
  for (const key in database) {
    if (database[key].email === email) {
      user = key;
    }
  }
  return user;

 };

 module.exports = getUserByEmail;