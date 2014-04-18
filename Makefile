.PHONY: all build

all: build

build: node_modules

dist:
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

deploy:
	lfcdn

deployprod:
	lfcdn prod