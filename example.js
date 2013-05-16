define(function(require) {
    var Hub = require('streamhub-sdk');
    var View = require('streamhub-wall');

    return function(el) {
        var streams = Hub.StreamManager.create.livefyreStreams({
            network: "labs-t402.fyre.co",
            environment: "t402.livefyre.com",
            siteId: "303827",
            articleId: 'sh_col_51_1366914813'
        });
        var view = new View({el: el});
        
        streams.bind(view).start();
         
        return view;
    };
});