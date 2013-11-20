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
        this._columnInsertIndex = 0;
        this._containerInnerWidth = 0;
        this._maxVisibleItems = opts.maxVisibleItems || 20;

        this.debouncedRelayout = debounce(function () {
            self._relayout.apply(self, arguments);
        }, opts.debounceRelayout || 200);

        this.debouncedFitColumns = debounce(function () {
            self._fitColumns();
        }, opts.debounceRelayout || 200);

        ContentListView.call(this, opts);
 
        $(window).resize(function() {
            if (self._autoFitColumns) {
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
            var contentListView = new ContentListView({
                maxVisibleItems: this._maxVisibleItems/numColumns,
                stash: this.more
            });
            this._columnViews.push(contentListView);
            contentListView.$el.addClass(this.columnClassName);
            this.$listEl.append(contentListView.$el);
        }

        this._moreAmount = this._moreAmount || numColumns * 2; // Show more displays 2 new rows

        this.relayout();
    };

    MediaWallView.prototype.fitColumns = function (opts) {
        if (this._containerInnerWidth == this.$el.innerWidth()) {
            return;
        }
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
        this._clearColumns();
        this.setColumns(numColumns);
    };

    MediaWallView.prototype._clearColumns = function () {
        var contentViews = [];
        for (var i=0; i < this._columnViews.length; i++) {
            var columnView = this._columnViews[i];
            contentViews = contentViews.concat(columnView.views);
            columnView.destroy();
        }
        this.views = contentViews;
        if (this.comparator) {
            this.views.sort(this.comparator);
        }
        this._columnViews = [];
    };

    /**
     * Add a piece of Content to the MediaWallView
     * @param content {Content} A Content model to add to the MediaWallView
     * @return the newly created ContentView
     */
    MediaWallView.prototype.add = function(content, opts) {
        opts = opts || {};
        var self = this;

        var targetColumnView = this._columnViews[this._columnInsertIndex];
        this._columnInsertIndex++;
        this._columnInsertIndex = this._columnInsertIndex == this._columnViews.length ? 0 : this._columnInsertIndex;
        targetColumnView.write(content);
    };
    
    /**
     * Remove a View from this ListView
     * @param content {Content|ContentView} The ContentView or Content to be removed
     * @returns {boolean} true if Content was removed, else false
     */
    MediaWallView.prototype.remove = function (content) {
        var retVal;
        for (var i=0; i < this._columnViews.length; i++) {
            var contentView = this._columnViews[i].getContentView(content);
            if (contentView) {
                retVal = this._columnViews[i].remove(contentView);
                return retVal;
            }
        }
        return retVal;
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
        this.columnBasedLayout(opts);
    };

    MediaWallView.prototype.columnBasedLayout = function (opts) {
        // Round-robin through columns, prepending each column with the next
        // available view
        opts = opts || {};

        this._columnInsertIndex = 0;
        for (var i=this.views.length-1; i >= 0; i--) {
            var contentView = this.views[i];
            this.add(contentView.content);
        }
    };

    MediaWallView.prototype.showMore = function (numToShow) {
        for (var i=0; i < this._columnViews.length; i++) {
            this._columnViews[i].bounded(false);
        }
        ContentListView.prototype.showMore.call(this, numToShow);
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

    MediaWallView.prototype.getContentView = function (newContent) {
        for (var i=0; i < this._columnViews.length; i++) {
            var contentView = this._columnViews[i].getContentView(newContent);
            if (contentView) {
                return contentView;
            }
        }
        return null;
    };

    MediaWallView.prototype.destroy = function () {
        ContentListView.prototype.destroy.call(this);
        this._columnViews = null;
    };

    return MediaWallView;
});
