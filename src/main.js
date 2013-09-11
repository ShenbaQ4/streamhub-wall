define([
    'streamhub-sdk/jquery',
    'streamhub-sdk/views/list-view',
    'streamhub-sdk/content/views/content-view',
    'streamhub-sdk/util'
], function($, ListView, ContentView, util) {

    var MEDIA_WALL_STYLE_EL;
    var MEDIA_WALL_CSS = ".streamhub-media-wall-view { \
	    position:relative; \
	} \
    .streamhub-media-wall-view .content-container { \
        position: relative; \
        margin: 0px; \
        padding: 0 0 15px 0; \
        border-radius: 3px; \
        border: 1px solid rgba(0,0,0,0.15); \
    } \
	.streamhub-media-wall-view article.content { \
	    width: 320px; \
        padding: 5px; \
        border: none; \
        box-sizing: border-box; \
	    -webkit-transition-duration: 1s; \
	       -moz-transition-duration: 1s; \
	        -ms-transition-duration: 1s; \
	         -o-transition-duration: 1s; \
	            transition-duration: 1s; \
	    -webkit-transition-property: -webkit-transform, opacity, top, left; \
	       -moz-transition-property:    -moz-transform, opacity, top, left; \
	        -ms-transition-property:     -ms-transform, opacity, top, left; \
	         -o-transition-property:      -o-transform, opacity, top, left; \
	            transition-property:         transform, opacity, top, left; }";
    /**
     * A view that displays Content in a media wall.
     * @param opts {Object} A set of options to config the view with
     * @param opts.el {HTMLElement} The element in which to render the streamed content
     * @param opts.relayoutWait {number} The number of milliseconds to wait when debouncing
     *        .relayout(). Defaults to 200ms.
     * @param opts.css {boolean} Whether to insert default media wall css. Default true.
     * @constructor
     */
    var MediaWallView = function(opts) {
        var self = this;

        opts = opts || {};

        ListView.call(this, opts);

        $(this.el).addClass('streamhub-media-wall-view');

        opts.css = (typeof opts.css === 'undefined') ? true : opts.css;
        if (!MEDIA_WALL_STYLE_EL && opts.css) {
            MEDIA_WALL_STYLE_EL = $('<style></style>').text(MEDIA_WALL_CSS).prependTo('head');
        }
        if (opts.columns && typeof opts.columns === 'number') {
            $('<style>.streamhub-media-wall-view article.content { width: ' + 100/opts.columns + '%; }</style>').appendTo('head');
        }

        this.debouncedRelayout = debounce(function () {
            self._relayout.apply(self, arguments);
        }, opts.debounceRelayout || 200);

        $(window).resize(function() {
            self.relayout();
        });
    };
    util.inherits(MediaWallView, ListView);

    /**
     * Add a piece of Content to the MediaWallView
     * @param content {Content} A Content model to add to the MediaWallView
     * @return the newly created ContentView
     */
    MediaWallView.prototype.add = function(content, stream) {
        var self = this,
            contentView = ListView.prototype.add.call(this, content);

        var contentContainerEl = $('<div class="content-container"></div>');
        contentContainerEl.append(contentView.$el.children());
        contentView.$el.append(contentContainerEl); 
        contentView.$el.on('imageLoaded.hub', function() {
            self.relayout();
        });

        this.relayout();
    };

    MediaWallView.prototype.relayout = function (opts) {
        opts = opts || {};
        if (opts.force) {
            this._relayout.apply(this, arguments);
        } else {
            this.debouncedRelayout.apply(this, arguments);
        }
    };

    MediaWallView.prototype._relayout = function(opts) {
        var columnWidth = 0;
        var columnHeights = [];
        var cols = 0;
        var containerWidth = $(this.el).innerWidth();
        var maximumY;

        $.each(this.contentViews, function (index, contentView) {
            var $contentView = contentView.$el;

            if (columnWidth === 0) {
                columnWidth = $contentView[0].getBoundingClientRect().width;
                if (columnWidth !== 0) {
                    cols = Math.floor(containerWidth / columnWidth);
                    for (var j = 0; j < cols; j++) {
                        columnHeights[j] = 0;
                    }
                }
            }
            // get the minimum Y value from the columns
            var minimumY = Math.min.apply( Math, columnHeights );
            maximumY = Math.max.apply( Math, columnHeights );
            var shortCol = 0;

            // Find index of short column, the first from the left
            for (var k = 0; k < columnHeights.length; k++) {
                if ( columnHeights[k] === minimumY ) {
                    shortCol = k;
                    break;
                }
            }
            // position the content
            var x = columnWidth * shortCol;
            var y = minimumY;

            $contentView.css({
                position: 'absolute',
                left: x+'px',
                top: y+'px'
            });

            // apply height to column
            columnHeights[shortCol] = minimumY + $contentView.outerHeight(true);
            if (columnHeights[shortCol] > maximumY) {
                maximumY = columnHeights[shortCol];
            }
        });

        $(this.el).css('height', maximumY + 'px');
    };

    /**
     * Returns a function, that, as long as it continues to be invoked, will not be triggered.
     * The function will be called after it stops being called for N milliseconds.
     * Copied from Underscore.js (MIT License) http://underscorejs.org/docs/underscore.html#section-65
     * @param func {function} The function to debounce
     * @param wait {number} The number of milliseconds to wait for execution of func
     * @param immediate {boolean} trigger the function on the leading edge, instead of the trailing.
     * @return {function} A debounced version of the passed `func`
     */
    function debounce(func, wait, immediate) {
        var timeout, result;
        return function() {
            var context = this,
                args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) {
                    result = func.apply(context, args);
                }
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) {
                result = func.apply(context, args);
            }
            return result;
        };
    }

    return MediaWallView;
});
