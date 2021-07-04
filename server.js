// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var fs = require("fs");
var connect = require('connect');
var serveStatic = require('serve-static');

app.use(serveStatic(__dirname));

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});


router.get('/get-spritesheets', function(req, res) {
  var dirname = "assets/spritesheets/";
  var paths = [];
  
  var fileNames = fs.readdirSync(dirname);
  
  for(var filename of fileNames) {
    paths.push(dirname + filename);
    
  }

  res.json(paths);

});

router.get('/get-backgrounds', function(req, res) {
  var dirname = "assets/backgrounds/";
  var paths = [];
  
  var fileNames = fs.readdirSync(dirname);
  
  for(var filename of fileNames) {
    paths.push(dirname + filename);
    
  }

  res.json(paths);

});


router.get('/get-sprites', function(req, res) {
  var dirname = "assets/sprites/";
  var sprites = [];
  
  var fileNames = fs.readdirSync(dirname);
  
  for(var filename of fileNames) {
    if(!filename.endsWith(".json")) continue;
    var content = fs.readFileSync(dirname + filename, 'utf-8');
    var sprite = JSON.parse(content);
    sprite.path = dirname + filename;
    sprite.name = filename.split(".")[0];
    sprites.push(sprite);
  }

  res.json(sprites);

});

router.get('/get-levels', function(req, res) {
  var dirname = "assets/levels/";
  var levels = [];
  
  var fileNames = fs.readdirSync(dirname);
  
  for(var filename of fileNames) {
    if(!filename.endsWith(".json")) continue;
    var content = fs.readFileSync(dirname + filename, 'utf-8');
    var level = JSON.parse(content);
    level.path = dirname + filename;
    levels.push(level);
  }

  res.json(levels);

});

function saveSpriteHelper(req) {
  fs.writeFileSync("./assets/sprites/" + req.name + ".json", JSON.stringify(req));
}

function writeSpriteFileHelper() {
  var fileNames = fs.readdirSync("assets/sprites/");
  var jsCode = "var spriteJsons: any = [";
  var first = true;
  for(var filename of fileNames) {
    if(!filename.endsWith(".json")) continue;
    if(!first) jsCode += ",";
    var content = fs.readFileSync("assets/sprites/" + filename, 'utf-8');
    jsCode += content;
    first = false;
  }
  jsCode += "];\n";
  jsCode += "export {spriteJsons};"
  fs.writeFileSync("./game/sprites.ts", jsCode);
}

// more routes for our API will happen here
router.post('/save-sprite', function(req, res) {
  saveSpriteHelper(req.body);
  writeSpriteFileHelper();
  res.json({message:"Success"});
});

// more routes for our API will happen here
router.post('/save-sprites', function(req, res) {
  for(var sprite of req.body) {
    saveSpriteHelper(sprite);
  }
  writeSpriteFileHelper();
  res.json({message:"Success"});
});

// more routes for our API will happen here
router.post('/save-level', function(req, res) {
  fs.writeFileSync("./assets/levels/" + req.body.name + ".json", JSON.stringify(req.body));

  var fileNames = fs.readdirSync("assets/levels/");
  var jsCode = "var levelJsons: any = [";
  var first = true;
  for(var filename of fileNames) {
    if(!filename.endsWith(".json")) continue;
    if(!first) jsCode += ",";
    var content = fs.readFileSync("assets/levels/" + filename, 'utf-8');
    jsCode += content;
    first = false;
  }
  jsCode += "];\n";
  jsCode += "export {levelJsons};"
  fs.writeFileSync("./game/levels.ts", jsCode);

  res.json({message:"Success"});
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/', router);

// START THE SERVER
// =============================================================================
app.listen(port);
//console.log('Magic happens on port ' + port);
