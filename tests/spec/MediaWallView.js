define([
    'jasmine',
    'streamhub-wall',
    'streamhub-sdk',
    '../MockStream',
    'jasmine-jquery'],
function (jasmine, MediaWallView, Hub, MockStream) {
describe('A MediaWallView', function () {
	// construction behavior
    describe('can be constructed', function() {
        it ("with no options", function () {
	        var view = new MediaWallView();
        	expect(view).toBeDefined();
    	});
    	it ("with empty options", function () {
        	var view = new MediaWallView({});
        	expect(view).toBeDefined();
    	});
	    it ("with an el", function () {
	        setFixtures('<div id="hub-MediaWallView"></div>');  
	        var view = new MediaWallView({
	            el: $('#hub-MediaWallView')
	        });
	        expect(view).toBeDefined();
	    });
	});
	
	// post construction behavior    
    describe ("after correct construction", function () {
	    var view;
        var streams;
	    
	    beforeEach(function() {
	        setFixtures('<div id="hub-MediaWallView"></div>');
	        streams = new Hub.StreamManager({main: new MockStream()});
	        view = new MediaWallView({ el: $('#hub-MediaWallView').get(0) });
            streams.bind(view);
		});
        it ("should contain 50 mock items & childViews after stream start", function () {
            streams.start();
        });
    });
}); 
});
