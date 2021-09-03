const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");
app.use(cookieParser());

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    name: "Sam",
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    name: "Carol",
    email: "user2@example.com", 
    password: "dishwasher-funk",
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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  let templateVars = {
    username: req.cookies["username"]
  };
    res.render("urls_new", templateVars);
});

app.get("/urls", (req, res) => {
  let templateVars = {
     username: req.cookies["username"],
     urls: urlDatabase 
   };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// Cookie get login
app.get("/login", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: []
  };
  res.render("/urls_index", templateVars);
});

// Cookie login Route
app.post("/login", (req, res) => { 
  res.cookie('username', req.body.username).redirect("/urls/");
});

// Register
app.get("/register", (req, res) => {
  let templateVars = {
    user: req.cookies["userId"]
  };

  res.render("urls_register", templateVars);
});
// Handeling user's registration
const findUserByEmail = (email) => {
  // using the built-in function here => find
 return Object.values(users).find(userObj => userObj.email === email);
};

app.post("/register", (req, res) => { 
  // const {name, email, password} = req.body;
  // console.log(req.body);
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  // const registeredEmail = findUserByEmail(email);
  // if(email === '' || pasword === ''){
  //   res.send('error')
  // } else if (email === registeredEmail){
  //   res.send('400');
  // }
  const userId = createUserID();

  const addNewUser = {
    id: userId,
    name: name,
    email: email,
    password: password
  };

  users[userId] = addNewUser;
  res.cookies("userId", userId);
  console.log(users);
  // urlDatabase[req.params.shortURL] = req.body.updatedURL;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  // console.log(req.body);  // Log the POST request body to the console
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/`);         // Respond with 'Ok' (we will replace this)
  // res.send("OK"); //Change for now
});

// Delete a generated URL
app.post("/urls/:id/delete", (req, res) => {
  const deletedURL = req.params.id;
  delete urlDatabase[deletedURL];
  res.redirect("/urls");
});
//edit button
app.post("/urls/:shortURL", (req, res) => { 
  urlDatabase[req.params.shortURL] = req.body.updatedURL;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username").redirect("/urls/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});