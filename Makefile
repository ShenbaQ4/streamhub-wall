.PHONY: all build

all: build

build: node_modules

dist: src requirejs.conf.js tools
	./node_modules/requirejs/bin/r.js -o ./tools/build.conf.js	

# if package.json changes, install
node_modules: package.json
	npm install
	touch $@

test: build
	npm test

clean:
	rm -rf node_modules

package: build

env=dev
deploy:
	./node_modules/.bin/lfcdn -e $(env)

