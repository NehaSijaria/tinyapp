const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
// const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');


app.use(cookieSession({
  name: "session",
  keys: ["key1" , "key2"]
}));

app.set("view engine", "ejs");
// app.use(cookieParser());

const users = {
  "userRandomID": {
    id: "userRandomID",
    name: "Sam",
    email: "user@example.com",
    password: "$2b$10$1vD0wzAEVp7WlvcgNAgJeOxhx8H31lbOLeXTITSgPNdVlucAOtcfC"
  },
  "user2RandomID": {
    id: "user2RandomID",
    name: "Carol",
    email: "user2@example.com",
    password: "$2b$10$1vD0wzAEVp7WlvcgNAgJeOxhx8H31lbOLeXTITSgPNdVlucAOtcfC",
  }
};


const generateRandomString = () => {
  let txt = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < charactersLength; i++) {
    txt += characters.charAt(Math.floor(Math.random() *
        charactersLength));
  
  }
  return txt.substring(0, 6);
};

const createUserID = () => {
  const userID = Math.random().toString(36).substring(2, 8); // Generating random unique user id
  return userID;
};

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
//1st route: create home-page on the server(Get)
app.get("/", (req, res) => {
  res.send("Hello!");
});
//creating database as a string
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
});

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.get("/urls/new", (req, res) => {
  // const currentUser = req.cookies["user_Id"];
  const currentUser = req.session.user_Id;
  if (currentUser === undefined) {
    res.redirect('/login');
  }
  let templateVars = {
    userId: currentUser,
    // userId: req.session["user_Id"],
    user: users[currentUser] || null
  };
  if (currentUser) {
    res.render("urls_new", templateVars);
  }

});

const urlsForUser = (id) => {
  let URLS = {};
  for (let shortUrl in urlDatabase) {
    if (id === urlDatabase[shortUrl].userID) {
      URLS[shortUrl] = urlDatabase[shortUrl];
    }
  }
  return URLS;
};

const urlOwnership = (req, res) => {
  // const currentUser = req.cookies["user_Id"];
  const currentUser = req.session.user_Id;
  if (!currentUser) {
    res.send("Please log in.");
  }
  if (!urlDatabase[req.params.shortURL]) {
    res.send("ID doesn't exists.");
  }
  if (urlDatabase[req.params.shortURL].userID !== currentUser) {
    res.send("You don't have access to the url.");
  }
};

app.get("/urls", (req, res) => {
  // const currentUser = req.cookies["user_Id"];
  const currentUser = req.session.user_Id;
  console.log('------->', currentUser);
  let templateVars = {
    user: users[currentUser] || null,
    urls: urlsForUser(currentUser)
  };
  if (currentUser) {
    res.render("urls_index", templateVars);
  } else {
    //res.send ('User is not logged in.');
    res.redirect('/login');
  }

});

app.get("/urls/:shortURL", (req, res) => {
  // const currentUser = req.cookies["user_Id"];
  const currentUser = req.session.user_Id;
  urlOwnership(req, res);
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[currentUser] || null
  };
  res.render("urls_show", templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.send('Error Message - Id does not exist');
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// Cookie get login
app.get("/login", (req, res) => {
  // const currentUser = req.cookies["user_Id"];
  const currentUser = req.session["user_Id"];
  const templateVars = {
    user: users[currentUser],
    urls: []
  };
  res.render("urls_login", templateVars);
});

// Register
app.get("/register", (req, res) => {
  let templateVars = {
    // user: req.cookies["user_Id"]
    user: req.session["user_Id"]
  };

  res.render("urls_register", templateVars);
});
// Handeling user's registration
const findUserByEmail = (email) => {
  // using the built-in function here => find */
  let user =  Object.values(users).find(userObj => userObj.email === email);
  return user;
};


// New Cookie login Route
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  
  // console.log('----> email', email);
  // console.log('----> password', password);
  const isAlreadyExists = findUserByEmail(email);
  console.log('Email in user object', isAlreadyExists);

  //console.log("users", isAlreadyExists.email);
  //console.log('email: ', email);

  if (isAlreadyExists === undefined) {
    res.status(403);
    res.send("User not registered. Please register.");
    // res.redirect("/login");
  }

  if (email === isAlreadyExists.email) {
    // if (password !== isAlreadyExists.password) {
    if (!bcrypt.compareSync(password, isAlreadyExists.password)) {
      res.status(403);
      res.send("Incorrect Password.");
    } else {
      // res.send("OK");
      // res.cookie("user_Id", isAlreadyExists.id);
      req.session.user_Id = isAlreadyExists.id;
      // console.log("---->Password Matched");
      // console.log(isAlreadyExists.id);
      res.redirect("/urls");
      // res.cookie('user_Id', currentUser).redirect("/urls/");
    }
  } else {
    res.status(403);
    res.send("Incorrect email.");
  }

});

app.post("/register", (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  // const password = bcrypt.hashSync(req.body.password, 10);
  const alreadyRegistered = findUserByEmail(email);
  if (email === '' || password === '') {
    res.status(403);
    res.send('Please enter Email ID or Password.');
    // alreadyRegistered could be object or it could be undefined
    // how do you check if a variable called 'alreadyRegistered' is undefined or not?
    // if undefined === undefined?
    // mdn safe operator
  } else if (email === alreadyRegistered.email) {
    res.status(403);
    res.send('Already registered.');
  }

  if (alreadyRegistered === undefined) {
    let userId = createUserID();
    const addNewUser = {
      id: userId,
      name: name,
      email: email,
      password: password
    };
    users[userId] = addNewUser;
    // res.cookie("user_Id", userId);
    req.session.user_Id = userId;
    console.log('newly created user------------->', users);
    // urlDatabase[req.params.shortURL] = req.body.updatedURL;
    res.redirect("/urls");
  }
});

app.post("/urls", (req, res) => {
  // const currentUser = req.cookies["user_Id"];
  const currentUser = req.session['user_Id'];
  console.log('--->current user', currentUser);
  console.log(currentUser);
  console.log('New url created', req.body);  // Log the POST request body to the console
  let shortURL = generateRandomString();
  console.log('Short url created', shortURL);

  const newURL = {
    longURL: req.body.longURL,
    userID: currentUser
  };
  urlDatabase[shortURL] = newURL;
  console.log(shortURL);
  console.log('New record added---->', urlDatabase);
  res.redirect(`/urls/`);         // Respond with 'Ok' (we will replace this)
  // res.send("OK"); //Change for now
});

// Delete a generated URL
app.post("/urls/:id/delete", (req, res) => {
  urlOwnership(req, res);
  const deletedURL = req.params.id;
  delete urlDatabase[deletedURL];
  res.redirect("/urls");
});
//edit button
app.post("/urls/:shortURL", (req, res) => {
  urlOwnership(req, res);
  console.log('---->', req.params.shortURL);
  urlDatabase[req.params.shortURL].longURL = req.body.updatedURL;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  // res.clearCookie("user_Id").redirect("/login");

  req.session = null;
  res.redirect("/login");
  
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});