all: 
	uglifyjs src/*.js src/ajax/*.js -m -v -c -o dist/adhese.min.js

noajax: 
	uglifyjs src/*.js -m -v -c -o dist/adhese.min.js