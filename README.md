# streamhub-wall

streamhub-wall displays StreamHub social feeds as a visually engaging, full-screen tiled Content experience that's great for covering live events, hosting photo contests, and powering social sections of your website.

## Getting Started

The quickest way to use streamhub-wall is to use the built version hosted on Livefyre's CDN.

### Dependencies

streamhub-wall depends on [streamhub-sdk](https://github.com/livefyre/streamhub-sdk). Ensure it's been included in your page.

	<script src="http://cdn.livefyre.com/libs/sdk/v1.1.0-build.212/streamhub-sdk.min.gz.js"></script>

Include streamhub-wall too.

	<script src="http://cdn.livefyre.com/libs/apps/Livefyre/streamhub-wall/v1.0.0-build.33/streamhub-wall.min.js"></script>
	
Optionally, include some reasonable default CSS rules for StreamHub Content

    <link rel="stylesheet" href="http://cdn.livefyre.com/libs/sdk/v1.1.0-build.212/streamhub-sdk.gz.css" />

### Usage

1. Require streamhub-sdk and streamhub-wall

        var Hub = Livefyre.require('streamhub-sdk'),
            WallView = Livefyre.require('streamhub-wall');
    
2. Create a WallView, passing the DOMElement to render in

        var wallView = new WallView({
            el: document.getElementById('wall')
        });
    
3. An empty wall is no fun, so use the SDK to create a StreamManager for a Livefyre Collection

        var streamManager = Hub.StreamManager.create.livefyreStreams({
            network: "labs.fyre.co",
            siteId: 315833,
            articleId: 'example'
        });
    
4. And bind the streamManager to your wall and start it up

        streamManager.bind(wallView).start();

You now have a Wall! See this all in action on [this jsfiddle](http://jsfiddle.net/59sT9/1/).

## Local Development

Instead of using a built version of streamhub-wall from Livefyre's CDN, you may wish to fork, develop on the repo locally, or include it in your existing JavaScript application.

Clone this repo

    git clone https://github.com/Livefyre/streamhub-wall

Development dependencies are managed by [npm](https://github.com/isaacs/npm), which you should install first.

With npm installed, install streamhub-wall's dependencies. This will also download [Bower](https://github.com/bower/bower) and use it to install browser dependencies.

    cd streamhub-wall
    npm install

This repository's package.json includes a helpful script to launch a web server for development

    npm start

You can now visit [http://localhost:8080/examples/mediawall](http://localhost:8080/examples/mediawall) to see an example wall loaded via RequireJS.

# StreamHub

[Livefyre StreamHub](http://www.livefyre.com/streamhub/) is used by the world's biggest brands and publishers to power their online Content Communities. StreamHub turns your site into a real-time social experience. Curate images, videos, and Tweets from across the social web, right into live blogs, chats, widgets, and dashboards. Want StreamHub? [Contact Livefyre](http://www.livefyre.com/contact/).
