#!/usr/bin/nodejs

// -------------- load packages -------------- //
// INITIALIZATION STUFF

var express = require('express')
var app = express();
var mysql = require('mysql');

app.set('view engine','ejs')

app.use(express.static('static_files'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.locals.pool = mysql.createPool({
  user    : process.env.DIRECTOR_DATABASE_USERNAME,
  password: process.env.DIRECTOR_DATABASE_PASSWORD,
  host    : process.env.DIRECTOR_DATABASE_HOST,
  port    : process.env.DIRECTOR_DATABASE_PORT,
  database: process.env.DIRECTOR_DATABASE_NAME
})

/*app.use( cookieSession ({
  name: 'friendersession',
  keys: ['idk'],
}));*/
app.use(require('cookie-session')({
  name: 'friendersession',
  keys: ['idk'],
}));

app.get('/', (req, res) => {
  res.render("home");
});
app.get('/myprofile',[init_session_cookies], (req, res) => {
  console.log( req.cookies )
  if(!req.session.loggedIn){
	    let redirect_url = 'https://tjfriender.sites.tjhsst.edu/signup'
        res.redirect(redirect_url)
  }
  //req.session.username
  var out = {
        'username' : req.session.username
    }
  
  res.render("profile",out);
});
app.get('/signup', (req, res) => {
  res.render("signup");
});
app.get('/match', (req, res) => {
  res.render("match");
});

function init_session_cookies(req,res,next) {
	/*if (!('clicks' in req.session)) {
	    req.session.clicks = 0;
	}*/
    if (!('loggedIn' in req.session)) {
	    req.session.loggedIn = false;
	}
	if (!('username' in req.session)) {
	    req.session.username = "guest";
	}
	next()
}

function checkDB(sqlquery, pool) {
  return new Promise(function(resolve, reject) {
    pool.query(sqlquery, (err, res) => {
      if (err) {
        console.log(err)
        reject(err);
      }
      resolve(res);
      console.log("DATABASE THING WORKED")
    })
  })
};

app.post("/login", async function(req, res) {
  var pool = res.app.locals.pool;
  let verified = false;

  let username = req.body.uname;
  let password = req.body.password;
  console.log(username);
  //let sqlquery = 'UPDATE profiles SET nickname = "' + newNickname + '" WHERE id='+userId+';'
  let sqlCheck = "select * from users where username like '" + username + "';";
  let usercheck = await checkDB(sqlCheck, pool);
  if(usercheck[0]){
      let sqlquery = 'SELECT pass FROM users WHERE username = "' + username + '";';
      let userpass = await checkDB(sqlquery, pool);
      console.log(userpass[0]);
      console.log(userpass[0].pass);
      if (userpass[0].pass == password) {
            //verified = true;
            req.session.loggedIn = true
            req.session.username = username
      }
      if(username === undefined){
          res.redirect("https://tjfriender.sites.tjhsst.edu");
      }
      if (req.session.loggedIn == true){ 
          res.redirect("https://tjfriender.sites.tjhsst.edu/myprofile");
      }else{
          res.redirect("https://tjfriender.sites.tjhsst.edu");
      }
  }else{
  res.redirect("https://tjfriender.sites.tjhsst.edu");
  }
  
});

app.post("/signup", async function(req, res) {
  var pool = res.app.locals.pool;

  let username = req.body.uname;
  let password = req.body.password;
  let firstname = req.body.fname;
  let lastname = req.body.lname;
  if(!username || !password || !firstname || !lastname){
      res.redirect("https://tjfriender.sites.tjhsst.edu/signup")
  }else{
  
  
      let sqlquery = 'INSERT INTO users (username, lastname, firstname, pass) VALUES ("'+username+'","' + lastname + '","' +
      firstname +'","'+ password + '");';
    
      let createAccount = await checkDB(sqlquery, pool);
    
      //verified = true;
      req.session.loggedIn = true
      req.session.username = username
      
      res.redirect("https://tjfriender.sites.tjhsst.edu/myprofile")
  }
})



// -------------- listener -------------- //
// // The listener is what keeps node 'alive.' 

var listener = app.listen(process.env.PORT || 8080, process.env.HOST || "0.0.0.0", function() {
    console.log("Express server started");
});