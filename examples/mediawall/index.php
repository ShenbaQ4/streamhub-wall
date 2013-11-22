<!DOCTYPE html>
<html>
    <head>
        <link rel="stylesheet" type="text/css" href="../lib/streamhub-sdk/src/css/style.css">
        <style>
        body {
            font-family: sans-serif;
            font-size: 14px;
            line-height: 18px;
        }
        #view {
            position:relative;
        }
        a {
            text-decoration: none;
        }
        .content, .content[data-content-has-avatar=true] {
            background-color:white;
            margin: 10px;
            width: 300px;
            overflow-x: hidden;
        }
        #view .content {
          -webkit-transition-duration: 1s;
             -moz-transition-duration: 1s;
              -ms-transition-duration: 1s;
               -o-transition-duration: 1s;
                  transition-duration: 1s;

          -webkit-transition-property: -webkit-transform, opacity, top, left;
             -moz-transition-property:    -moz-transform, opacity, top, left;
              -ms-transition-property:     -ms-transform, opacity, top, left;
               -o-transition-property:      -o-transform, opacity, top, left;
                  transition-property:         transform, opacity, top, left;
        }
        
        </style>
        <script type="text/javascript" src="//platform.twitter.com/widgets.js"></script>
        <script type="text/javascript" src="/lib/requirejs/require.js"></script>
        <script src="/streamhub-sdk.min.js"></script>
        <script src="/streamhub-wall.min.js"></script>
    </head>
    <body>
        <?php
        // include the library include(dirname(__FILE__) . “/livefyre-api/libs/php/Livefyre.php”); // set up some values

            $cms_content_id = "xbox-0";
            $cms_permalink_url = "http://www.url.com/xbox-0";
            $cms_title = "New Collection Title";
            $cms_tags = "";
            $NETWORK = "labs-t402.fyre.co";
            $NETWORK_KEY = "";// Fill in with your key, this is the auth_clientkey for the domain you are working on
            $SITE_ID = "303827"; // Fill in with your site ID
            $SITE_KEY = "";//""; // Fill in with your site key, this is the site api_secret

            $metadata = array (
                "title" => $cms_title,
                "url" => $cms_permalink_url,
                "tags" => $cms_tags,
                "stream_type" => "livecomments"
            );

            $checksum = md5(json_encode($metadata));

            $metadata["checksum"] = $checksum;
            $metadata["articleId"] = $cms_content_id;
            $metadata["type"] = "livecomments";

            $collectionMeta = JWT::encode($metadata, $SITE_KEY);

        ?>
        
        <div id="view"></div>

        <script src="../../lib/requirejs/require.js" type="text/javascript"></script>
        <script src="/requirejs.conf.js" type="text/javascript"></script>
        <script>
            requirejs({
                baseUrl: "/"
            });
        </script>
        <script>
        require([
            'streamhub-sdk',
            'streamhub-sdk/collection',
            'streamhub-sdk/content',
            'streamhub-wall',
            'streamhub-sdk/collection/clients/stream-client'
        ],function (Hub, Collection, Content, MediaWallView, LivefyreStreamClient) {
            var opts = {
                "network": "<?php echo $NETWORK; ?>",
                "siteId": "<?php echo $SITE_ID; ?>",
                "articleId": "<?php echo $cms_content_id; ?>",
                "environment": "livefyre.com",
                "collectionMeta": "<?php echo $collectionMeta; ?>",
                "checksum" : "<?php echo $checksum; ?>",
                "signed": true
            };

            var view = window.view = new MediaWallView({
                el: document.getElementById("view"),
                minContentWidth: 300,
                //,columns: 6
                //,modal: false
                initial: 5,
                showMore: 2
            });

            var collection = new Collection(opts);
            collection.createArchive().pipe(view.more);
            collection.createUpdater().pipe(view);
            
/*             setInterval(function () {
                view.write(new Content({ body: 'poop' }));
            }, 5000); */
        });
        </script>
    </body>
</html>
