const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');


app.use(cookieSession({
  name: "session",
  keys: ["key1" , "key2"]
}));

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

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

const generateRandomString = () => {
  let txt = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < charactersLength; i++) {
    txt += characters.charAt(Math.floor(Math.random() *
        charactersLength));
  }
  return txt.substring(0, 6);
};

// Handeling user's registration
const findUserByEmail = (email) => {
  const user =  Object.values(users).find(userObj => userObj.email === email);
  return user;
};

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
  const currentUser = req.session.user_Id;
  if (!currentUser) {
    return res.send("Please log in.");
  }
  if (!urlDatabase[req.params.shortURL]) {
    return res.send("ID doesn't exists.");
  }
  if (urlDatabase[req.params.shortURL].userID !== currentUser) {
    return res.send("You don't have access to the url.");
  }
};

//1st route: create home-page on the server(Get)
app.get("/", (req, res) => {
  const currentUser = req.session.user_Id;
  if (!currentUser)
  {
    return res.redirect('/login');
  } 
  
  return res.redirect('/urls');

});
//creating database as a string
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: 'Hello World!' };
  return res.render("hello_world", templateVars);
});

app.get("/urls/new", (req, res) => {
  const currentUser = req.session.user_Id;
  const templateVars = {
    userId: currentUser,
    user: users[currentUser] || null
  };
    if (currentUser === undefined || currentUser === null) {
    return res.redirect('/login');
  }
  if (currentUser) {
    return res.render("urls_new", templateVars);
  }

});

app.get("/urls", (req, res) => {
  const currentUser = req.session.user_Id;
  const templateVars = {
    user: users[currentUser] || null,
    urls: urlsForUser(currentUser)
  };
  if (currentUser) {
    return res.render("urls_index", templateVars);
  } else {
    return res.send ('User is not logged in.');
    // res.redirect('/login');
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const currentUser = req.session.user_Id;
  const user = users[currentUser] || null;

  urlOwnership(req, res);

  const { shortURL } = req.params;
  const { longURL   } = urlDatabase[shortURL];
  const templateVars = {
    shortURL,
    longURL,
    user
  };
  return res.render("urls_show", templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.send('Error Message - Id does not exist');
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  return res.redirect(longURL);
});

// Cookie get login
app.get("/login", (req, res) => {
  const currentUser = req.session["user_Id"];
  const templateVars = {
    user: users[currentUser],
    urls: []
  };
  return res.render("urls_login", templateVars);
});

// Register
app.get("/register", (req, res) => {
  const templateVars = {
    user: req.session["user_Id"]
  };

  return res.render("urls_register", templateVars);
});

// Login Route 
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const isAlreadyExists = findUserByEmail(email);
  if (email === '' || password === '') {
    res.status(403);
    return res.send('Please enter Email ID or Password.');
  }
  if (!isAlreadyExists) {
    res.status(403);
    return res.send("User not registered. Please register.");
  }

  if (email === isAlreadyExists.email) {
    if (!bcrypt.compareSync(password, isAlreadyExists.password)) {
      res.status(403);
      return res.send("Incorrect Password.");
    } else {
      req.session.user_Id = isAlreadyExists.id;
      return res.redirect("/urls");
    }
  } else {
    res.status(403);
    return res.send("Incorrect email.");
  }
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  // const password = req.body.password;
  const password = bcrypt.hashSync(req.body.password, 10);
  const alreadyRegistered = findUserByEmail(email);
  //For better user experience: I implemented attribute:required in input in forms.
  // if (email === '' || password === '') {
  //   res.status(403);
  //   res.send('Please enter Email ID or Password.');
  // }
  if (!alreadyRegistered) {
    const userId = generateRandomString();
    const addNewUser = {
      id: userId,
      email: email,
      password: password
    };
    users[userId] = addNewUser;
    req.session.user_Id = userId;
    res.redirect("/urls");
  } 
  if (email === alreadyRegistered?.email) {
    res.status(403);
    return res.send('Already registered.');
  }
});

app.post("/urls", (req, res) => {
  const currentUser = req.session['user_Id'];
  if(!currentUser) {
   return res.send('Please login to access Tiny App');    
  }
  const shortURL = generateRandomString();
  const newURL = {
    longURL: req.body.longURL,
    userID: currentUser
  };
  urlDatabase[shortURL] = newURL;
  res.redirect(`/urls/`);         // Respond with 'Ok' (we will replace this)
});

// Delete a generated URL
app.post("/urls/:id/delete", (req, res) => {
  const currentUser = req.session.user_Id;
  if (!currentUser) {
    return res.send("Please log in.");
  }
  const shortURL = req.params.id;
  const urlObj = urlDatabase[shortURL];
  if (!urlObj) {
    return res.send("ShortURL doesnot exist.");
  } 
  if (currentUser !== urlObj.userID) {
    return res.send("User doesn't have permissions to access to the url.");
  }
  // urlOwnership(req, res);
  // const deletedURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});
//edit button

app.post("/urls/:shortURL", (req, res) => {
  const currentUser = req.session.user_Id;
  if(!currentUser) {
    return res.send('Please login to access Tiny App');    
   }
  urlOwnership(req, res);
  urlDatabase[req.params.shortURL].longURL = req.body.updatedURL;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
  
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});