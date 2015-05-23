#!/usr/bin/env node

var program = require('commander');
var mkdirp = require('mkdirp');
var os = require('os');
var fs = require('fs');
var path = require('path');
var readline = require('readline');
var ncp = require('ncp').ncp;
var pkg = require('./package.json');
var _exit = process.exit;
var version = pkg.version;

process.exit = exit

// CLI

before(program, 'outputHelp', function () {
  this.allowUnknownOption();
});


program
  .version(version)
  .usage('[dir]')  
  .parse(process.argv);

if (!exit.exited) {
  doGenerate();
}



/**
 * Install a before function; AOP.
 */

function before(obj, method, fn) {
  var old = obj[method];

  obj[method] = function () {
    fn.call(this);
    old.apply(this, arguments);
  };
}

// main generating part 

function doGenerate() {
	var destinationPath = program.args.shift() || '.';

 
	var appName = path.basename(path.resolve(destinationPath));

	// empty directory check 
	emptyDirectory( destinationPath, function (empty) {
		if( empty ){
      createApplication(appName, destinationPath);
    } 
		else{
			confirm('destination is not empty, continue ? [y/N] ', function(ok){
				if(ok){
					process.stdin.destroy();
					console.log("ok , creating application ... ");
					createApplication(appName, destinationPath);
				}else{
					console.log("aorting");
					exit(1);
				}
			});
		}
	});
}


function createApplication( app_name, dest ){


	var pkg = {
        name: app_name
      , version: '0.0.0'
      , private: true
      , scripts: { start: 'node app.js' }
      , dependencies: {
          'wolverinejs': '*',
      }
    }

  mkdir( dest , function(){
  });

	write( dest + '/package.json', JSON.stringify(pkg, null, 2));

	// copy all from template folder 
	ncp( path.join(__dirname, '.', 'templates/'), dest, function (err) {
	 if (err) {
	   return console.error(err);
	 }
	 console.log('done!');
	});
  console.log();

   console.log('    cd %s && npm install', dest);
   console.log();
   console.log("run the app");
   console.log('   npm start');
}









/**
 *   helper function 
 */


function loadTemplate(name) {
  return fs.readFileSync(path.join(__dirname, '.', 'templates', name), 'utf-8');
}

function emptyDirectory(path, fn) {
  fs.readdir(path, function(err, files){
    if (err && 'ENOENT' != err.code) throw err;
    fn(!files || !files.length);
  });
}


/**
 * Graceful exit for async STDIO
 */

function exit(code) {
  // flush output for Node.js Windows pipe bug
  // https://github.com/joyent/node/issues/6247 is just one bug example
  // https://github.com/visionmedia/mocha/issues/333 has a good discussion
  function done() {
    if (!(draining--)) _exit(code);
  }

  var draining = 0;
  var streams = [process.stdout, process.stderr];

  exit.exited = true;

  streams.forEach(function(stream){
    // submit empty write request and wait for completion
    draining += 1;
    stream.write('', done);
  });

  done();
}



/**
 * Prompt for confirmation on STDOUT/STDIN
 */
function confirm(msg, callback) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question(msg, function (input) {
    rl.close();
    callback(/^y|yes|ok|true$/i.test(input));
  });
}


/**
 * echo str > path.
 *
 * @param {String} path
 * @param {String} str
 */function write(path, str, mode) {
  fs.writeFileSync(path, str, { mode: mode || 0666 });
  //console.log('   \x1b[36mcreate\x1b[0m : ' + path);
}



/**
 * Mkdir -p.
 *
 * @param {String} path
 * @param {Function} fn
 */

function mkdir(path, fn) {
  mkdirp(path, 0755, function(err){
    if (err) throw err;
    console.log('   \033[36mcreate\033[0m : ' + path);
    fn && fn();
  });
}

