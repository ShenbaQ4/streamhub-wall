define([
    'streamhub-sdk/jquery',
    'streamhub-sdk/content/views/content-list-view',
    'streamhub-sdk/content/views/content-view',
    'text!streamhub-wall/style.css',
    'inherits'
], function($, ContentListView, ContentView, MEDIA_WALL_CSS, inherits) {

    var MEDIA_WALL_STYLE_EL;

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

        this._id = new Date().getTime();
        this._autoFitColumns = true;
        this._contentWidth = opts.minContentWidth || 300;
        this._columnViews = [];
        this._columnAppendIndex = 0;
        this._columnPrependIndex = 0;
        this._containerInnerWidth = 0;

        ContentListView.call(this, opts);

        this.debouncedRelayout = debounce(function () {
            self._relayout.apply(self, arguments);
        }, opts.debounceRelayout || 200);

        this.debouncedFitColumns = debounce(function () {
            self._fitColumns();
        }, opts.debounceRelayout || 200);
 
        $(window).resize(function() {
            self.relayout();
            if (self._autoFitColumns && self._containerInnerWidth != self.$el.innerWidth()) {
            console.log('resize fit cols');
                self.fitColumns();
            }
        });

        opts.css = (typeof opts.css === 'undefined') ? true : opts.css;
        if (!MEDIA_WALL_STYLE_EL && opts.css) {
            MEDIA_WALL_STYLE_EL = $('<style></style>').text(MEDIA_WALL_CSS).prependTo('head');
        }
        if (opts.columns && typeof opts.columns === 'number') {
            this._autoFitColumns = false;
            this.setColumns(opts.columns);
        }
        if (this._autoFitColumns) {
            this.fitColumns({ force: true });
        }
    };
    inherits(MediaWallView, ContentListView);


    MediaWallView.prototype.mediaWallClassName = 'streamhub-media-wall-view';
    MediaWallView.prototype.columnClassName = 'hub-wall-column';
    MediaWallView.prototype.insertingClassName = 'hub-wall-is-inserting';

    MediaWallView.prototype._getWallStyleEl = function () {
        var $wallStyleEl = $('#wall-style-' + this._id);
        if ($wallStyleEl) {
            return $wallStyleEl;
        }
    };

    MediaWallView.prototype._setColumnWidth = function (width) {
        var $wallStyleEl = this._getWallStyleEl();
        if ($wallStyleEl) {
            $wallStyleEl.remove();
        }
        $wallStyleEl = $('<style id="wall-style-' + this._id + '"></style');
        $wallStyleEl.html('.streamhub-media-wall-'+this._id+' .hub-wall-column { width: ' + width + '; }');
        $wallStyleEl.appendTo('head');

        return this._getColumnWidth();
    };

    MediaWallView.prototype._getColumnWidth = function () {
        var $contentContainerEl = this.$el.find('.'+this.columnClassName);
        if ($contentContainerEl.length) {
            this._columnWidth = $contentContainerEl[0].getBoundingClientRect().width;
            return this._columnWidth;
        }
        return 0;
    };

    MediaWallView.prototype.setElement = function (el) {
        ContentListView.prototype.setElement.call(this, el);
        this.$el
            .addClass(this.mediaWallClassName)
            .addClass('streamhub-media-wall-' + this._id);
    };

    MediaWallView.prototype.setColumns = function (numColumns) {
        var $wallStyleEl = this._getWallStyleEl();
        if ($wallStyleEl) {
            $wallStyleEl.remove();
        }
        $wallStyleEl = $('<style id="wall-style-' + this._id + '"></style');
        this._setColumnWidth((100/numColumns) + '%');

        for (var i=0; i < numColumns; i++) {
            var contentListView = new ContentListView();
            this._columnViews.push(contentListView);
            contentListView.$el.addClass(this.columnClassName);
            this.$listEl.append(contentListView.$el);
        }

        this.relayout();
    };

    MediaWallView.prototype.fitColumns = function (opts) {
        opts = opts || {};

        if (opts.force) {
            this._fitColumns.apply(this, arguments);
        } else {
            this.debouncedFitColumns.apply(this, arguments);
        }
    };

    MediaWallView.prototype._fitColumns = function (opts) {
        this._containerInnerWidth = $(this.el).innerWidth();
        var numColumns = parseInt(this._containerInnerWidth / this._contentWidth, 10) || 1;
        this.setColumns(numColumns);
    };

    /**
     * Add a piece of Content to the MediaWallView
     * @param content {Content} A Content model to add to the MediaWallView
     * @return the newly created ContentView
     */
    MediaWallView.prototype.add = function(content, opts) {
        var self = this,
            contentView = ContentListView.prototype.add.call(this, content, opts);

        //TODO(ryanc): Should no longer need this if using browser positioning
        //contentView.$el.on('imageLoaded.hub', function() {
        //    self.relayout();
        //});

        this.relayout();
    };
    
    /**
     * Remove a View from this ListView
     * @param content {Content|ContentView} The ContentView or Content to be removed
     * @returns {boolean} true if Content was removed, else false
     */
    MediaWallView.prototype.remove = function (view) {
        var retVal = ContentListView.prototype.remove.call(this, view);
        if (retVal) {
            this.relayout();
        }
        return retVal;
    };

    MediaWallView.prototype._insert = function (contentView, opts) {
        opts = opts || {};
        var newContentViewIndex,
            $previousEl;

        newContentViewIndex = this.views.indexOf(contentView);

        var targetColumnView;
        if (opts.append === true && newContentViewIndex > 0) {
            var targetColumnView = this._columnViews[this._columnAppendIndex];
            targetColumnView.$el.append(contentView.$el);
            this._columnAppendIndex++;
            this._columnAppendIndex = this._columnAppendIndex == this._columnViews.length ? 0 : this._columnAppendIndex;
        } else {
            // New content goes to the next available column for insertion
            var targetColumnView = this._columnViews[this._columnPrependIndex];
            targetColumnView.$el.prepend(contentView.$el);
            this._columnPrependIndex++;
            this._columnPrependIndex = this._columnPrependIndex == this._columnViews.length ? 0 : this._columnPrependIndex;
        }
        setTimeout(function () { contentView.$el.addClass(this.insertingClassName); }.bind(this), 1);
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
        opts = opts || {};

        //this.columnBasedLayout(opts);
    };

    MediaWallView.prototype.columnBasedLayout = function (opts) {
        // Round-robin through columns, prepending each column with the next
        // available view
        opts = opts || {};

        var columnWidth = 0;
        var columnHeights = [];
        var cols = 0;
        var containerWidth = $(this.el).innerWidth();
        var maximumY;

        $.each(this.views, function (index, contentView) {
            var $contentContainerEl = contentView.$el.parent('.'+this.columnClassName);

            if (columnWidth === 0) {
                columnWidth = $contentContainerEl[0].getBoundingClientRect().width;
                if (columnWidth !== 0) {
                    cols = Math.floor(containerWidth / columnWidth);
                    for (var j = 0; j < cols; j++) {
                        columnHeights[j] = 0;
                    }
                }
            }

        }.bind(this));
    };

    MediaWallView.prototype.isotopeLayout = function (opts) {
        var columnWidth = 0;
        var columnHeights = [];
        var cols = 0;
        var containerWidth = $(this.el).innerWidth();
        var maximumY;

        $.each(this.views, function (index, contentView) {
            var $contentContainerEl = contentView.$el.parent('.'+this.columnClassName);

            if (columnWidth === 0) {
                columnWidth = $contentContainerEl[0].getBoundingClientRect().width;
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

            var css = { position: 'absolute' };
            if (opts.translate) {
                css.left = 0+'px';
                css.top = 0+'px';
                css['-webkit-transform'] = 'translate('+x+'px, '+y+'px)'
            } else {
                css.left = x+'px';
                css.top = y+'px';
            }
            if (opts.hardwareAccelerate) {
                css['-webkit-transform'] = css['-webkit-transform'] + ' rotateY(0deg)';
            }

            $contentContainerEl.css(css);

            // apply height to column
            columnHeights[shortCol] = minimumY + contentView.$el.outerHeight(true);

            if (columnHeights[shortCol] > maximumY) {
                maximumY = columnHeights[shortCol];
            }

            $contentContainerEl.removeClass(this.insertingClassName);

            $(this.$listEl).css('height', maximumY + 'px');
        }.bind(this));
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
