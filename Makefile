all:
	uglifyjs src/*.js src/ajax/*.js src/detection/*.js src/fingerprint/*.js src/events/*.js src/rtb/*.js vast/adhese-vast.js src/safeframe/SafeFrame.js src/safeframe/js/lib/base.js src/safeframe/js/host/host.js src/safeframe/js/lib/boot.js -m -v -c -o dist/adhese.min.js

nocompression:
	uglifyjs src/*.js src/ajax/*.js src/detection/*.js src/fingerprint/*.js src/events/*.js vast/adhese-vast.js -b -v -o dist/adhese.js

novastnoajax:
	uglifyjs src/*.js src/detection/*.js src/fingerprint/*.js src/events/*.js src/rtb/*.js src/safeframe/SafeFrame.js src/safeframe/js/lib/base.js src/safeframe/js/host/host.js src/safeframe/js/lib/boot.js -m -v -c -o dist/adhese.novastajax.min.js

novast:
	uglifyjs src/*.js src/ajax/*.js src/detection/*.js src/fingerprint/*.js src/events/*.js src/rtb/*.js -m -v -c -o dist/adhese.novast.min.js

vastonly:
	uglifyjs vast/adhese-vast.js src/ajax/*.js -m -v -c -o vast/dist/adhese.vast.min.js

nofingerprint:
	uglifyjs src/*.js src/detection/*.js src/ajax/*.js vast/adhese-vast.js -m -v -c -o dist/adhese.min.js

novastnoajaxnofingerprint:
	uglifyjs src/*.js src/detection/*.js -m -v -c -o dist/adhese.novastnoajaxnofingerprint.min.js

debug:
	uglifyjs src/*.js src/ajax/*.js src/detection/*.js src/visible/*.js src/fingerprint/*.js src/events/*.js src/rtb/*.js vast/adhese-vast.js src/safeframe/SafeFrame.js src/safeframe/js/lib/base.js src/safeframe/js/host/host.js src/safeframe/js/lib/boot.js -b -v -o dist/adhese.debug.js

.PHONY: docs
docs:
	jsdoc --verbose -c conf/jsdoc.conf
