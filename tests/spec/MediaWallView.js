define([
    'jasmine',
    'streamhub-wall',
    'streamhub-sdk/content/views/content-list-view',
    'streamhub-sdk',
    'streamhub-sdk/content',
    'streamhub-sdk-tests/mocks/mock-attachments-stream',
    'jasmine-jquery'],
function (jasmine, MediaWallView, ContentListView, Hub, Content, MockStream) {
    'use strict';

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
            var stream;

            beforeEach(function() {
                setFixtures('<div id="hub-MediaWallView"></div>');
                stream = new MockStream();
                view = new MediaWallView({ el: $('#hub-MediaWallView').get(0) });
            });
            it ("should contain 9 mock items & childViews (from MockAttatchmentsStream) after stream start", function () {
                var onEnd = jasmine.createSpy('onEnd');
                stream.pipe(view);
                stream.on('end', onEnd);
                waitsFor(function () {
                    return onEnd.callCount;
                });
                runs(function () {
                    expect(view.views.length).toBe(9);
                });
            });
        });

        describe("Round-robin column insertion", function () {

            describe("when adding content with different .createdAt dates", function () {
                var view,
                    startDateInt = 1375383041586,
                    date1 = new Date(startDateInt),
                    date2 = new Date(startDateInt + 1 * 10000),
                    date3 = new Date(startDateInt + 2 * 10000),
                    content1, content2, content3;
                beforeEach(function () {
                    setFixtures('<div id="hub-MediaWallView"></div>');
                    $('#hub-MediaWallView').width(300*4); //220px is the default width of content
                    view = new MediaWallView({
                        el: $('#hub-MediaWallView').get(0),
                        pickColumn: MediaWallView.columnPickers.roundRobin
                    });
                    content1 = new Content({ body: 'what1' });
                    content1.createdAt = date1;
                    content2 = new Content({ body: 'what2' });
                    content2.createdAt = date2;
                    content3 = new Content({ body: 'what3' });
                    content3.createdAt = date3;
                    view.add(content3);
                    view.add(content1);
                    view.add(content2);
                });
                it("should select target column ContentView to write into", function () {
                    expect(view._columnViews.length).toEqual(4);
                    expect(view._columnViews[0].views[0].content).toEqual(content3);
                    expect(view._columnViews[1].views[0].content).toEqual(content1);
                    expect(view._columnViews[2].views[0].content).toEqual(content2);
                });
            });

            describe("when removing content", function () {
                var view, content1, content2, content3;
                beforeEach(function () {
                    setFixtures('<div id="hub-MediaWallView"></div>');
                    $('#hub-MediaWallView').width(300*4); //220px is the default width of content
                    view = new MediaWallView({
                        el: $('#hub-MediaWallView').get(0),
                        pickColumn: MediaWallView.columnPickers.roundRobin
                    });
                    content1 = new Content({ body: 'what1' });
                    content2 = new Content({ body: 'what2' });
                    content3 = new Content({ body: 'what3' });
                    view.add(content3); //column1
                    view.add(content1); //column2
                    view.add(content2); //column3
                });

                it('should remove the contentView from #views', function () {
                    expect(view.views.length).toEqual(3);
                    view.remove(content1)
                    expect(view.views.length).toEqual(2);
                });

                it('should remove the contentView from the appropriate column view', function () {
                    expect(view._columnViews[0].views.length).toEqual(1);
                    expect(view._columnViews[0].views[0].content.body).toEqual('what3');
                    view.remove(content3);
                    expect(view._columnViews[0].views.length).toEqual(0);
                });
            });
        });


        describe("Shortest column first insertion", function () {

            describe("when adding content with different .createdAt dates", function () {
                var view,
                    startDateInt = 1375383041586,
                    date1 = new Date(startDateInt),
                    date2 = new Date(startDateInt + 1 * 10000),
                    date3 = new Date(startDateInt + 2 * 10000),
                    date4 = new Date(startDateInt + 3 * 10000),
                    date5 = new Date(startDateInt + 4 * 10000),
                    content1, content2, content3, content4, content5;
                beforeEach(function () {
                    setFixtures('<div id="hub-MediaWallView"></div>');
                    $('#hub-MediaWallView').height(1000).width(300*3); //220px is the default width of content
                    view = new MediaWallView({
                        el: $('#hub-MediaWallView').get(0),
                        pickColumn: MediaWallView.columnPickers.shortestColumn,
                        animate: false
                    });
                    content1 = new Content({ body: 'what1' });
                    content1.createdAt = date1;
                    content2 = new Content({ body: 'what2' });
                    content2.createdAt = date2;
                    content3 = new Content({ body: 'what3' });
                    content3.createdAt = date3;
                    content4 = new Content({ body: 'what4' });
                    content4.createdAt = date4;
                    content5 = new Content({ body: 'what5' });
                    content5.createdAt = date5;
                });

                it("should insert into lowest tiebreaker index", function () {
                    expect(view._columnViews.length).toEqual(3);
                    expect(view._columnHeights[0]).toEqual(0);
                    expect(view._columnHeights[1]).toEqual(0);
                    expect(view._columnHeights[2]).toEqual(0);

                    view.add(content1);
                    view.views[0].$el.height('36px');
                    view._columnHeights[0] = 36;
                    expect(view._columnViews[0].views[0].content).toEqual(content1);

                    view.add(content2);
                    view.views[1].$el.height('36px');
                    view._columnHeights[1] = 36;
                    expect(view._columnViews[1].views[0].content).toEqual(content2);

                    view.add(content3);
                    view.views[2].$el.height('36px');
                    view._columnHeights[2] = 36;
                    expect(view._columnViews[2].views[0].content).toEqual(content3);
                });

                it("should select target column ContentView to write into", function () {
                    view.add(content3);
                    view.views[0].$el.height('500px');
                    view._columnHeights[0] = 500;

                    view.add(content1);
                    view.views[1].$el.height('36px');
                    view._columnHeights[1] = 36;

                    view.add(content2);
                    view.views[2].$el.height('36px');
                    view._columnHeights[2] = 36;

                    view.add(content4);
                    view.views[1].$el.height('72px');
                    view._columnHeights[1] += 72;

                    view.add(content5);
                    view.views[2].$el.height('72px');
                    view._columnHeights[2] += 72;

                    expect(view._columnViews.length).toEqual(3);
                    expect(view._columnViews[0].views[0].content).toEqual(content4);
                    expect(view._columnViews[1].views[0].content).toEqual(content5);
                    expect(view._columnViews[2].views[0].content).toEqual(content2);
                    expect(view._columnViews[0].views[1].content).toEqual(content3);
                    expect(view._columnViews[1].views[1].content).toEqual(content1);
                });
            });


            describe("when removing content", function () {
                var view, content1, content2, content3;
                beforeEach(function () {
                    setFixtures('<div id="hub-MediaWallView"></div>');
                    $('#hub-MediaWallView').width(300*4); //220px is the default width of content
                    view = new MediaWallView({
                        el: $('#hub-MediaWallView').get(0),
                        pickColumn: MediaWallView.columnPickers.shortestColumn
                    });
                    content1 = new Content({ body: 'what1' });
                    content2 = new Content({ body: 'what2' });
                    content3 = new Content({ body: 'what3' });
                    view.add(content3); //column1
                    view.views[0].$el.height('10px');
                    view._columnHeights[0] = 10;
                    view.add(content1); //column2
                    view.views[1].$el.height('10px');
                    view._columnHeights[1] = 10;
                    view.add(content2); //column3
                    view.views[2].$el.height('10px');
                    view._columnHeights[2] = 10;
                });

                it('should remove the contentView from #views', function () {
                    expect(view.views.length).toEqual(3);
                    view.remove(content1)
                    expect(view.views.length).toEqual(2);
                });

                it('should remove the contentView from the appropriate column view', function () {
                    expect(view._columnViews[0].views.length).toEqual(1);
                    expect(view._columnViews[0].views[0].content.body).toEqual('what3');
                    view.remove(content3);
                    expect(view._columnViews[0].views.length).toEqual(0);
                });
            });
        });

    });

    describe("auto fitting columns", function () {
        var view;

	    beforeEach(function() {
	        setFixtures('<div id="hub-MediaWallView"></div>');
		});

        it('calls #fitColumns() in constructor if no opts.columns specified', function () {
            spyOn(MediaWallView.prototype, 'fitColumns');

            $('#hub-MediaWallView').width(220*4); //220px is the default width of content
	        view = new MediaWallView({ el: $('#hub-MediaWallView').get(0) });
            expect(view._autoFitColumns).toBe(true);
            expect(MediaWallView.prototype.fitColumns).toHaveBeenCalled();
        });

        it('calls #fitColumns() when window is resized', function () {
            $('#hub-MediaWallView').width(220*4); //220px is the default width of content
	        view = new MediaWallView({ el: $('#hub-MediaWallView').get(0) });
            spyOn(view, 'debouncedRelayout');
            $(window).trigger('resize');
            expect(view._autoFitColumns).toBe(true);
            expect(view.debouncedRelayout).toHaveBeenCalled();
        });

        it('sets column width proportional to the media wall width', function () {
            $('#hub-MediaWallView').width(12345);
	        view = new MediaWallView({ el: $('#hub-MediaWallView').get(0), minContentWidth: 400 });
            expect(view._columnViews.length).toBe(parseInt(12345/400));
        });
    });

    describe('when rendering', function () {
        var view;

	    beforeEach(function() {
	        setFixtures('<div id="hub-MediaWallView"></div>');
            $('#hub-MediaWallView').width(300*4); //220px is the default width of content

            spyOn(MediaWallView.prototype, 'fitColumns').andCallThrough();
            view = new MediaWallView({
                el : $('#hub-MediaWallView').get(0),
                autoRender: false
            });
		});

        it('calls base #render and creates column views', function () {
            expect(view._numberOfColumns).toBe(4);
            expect(view._columnViews.length).toEqual(0);
            view.render();
            expect(view._columnViews.length).toEqual(view._numberOfColumns);

            view.render();
            expect(view._numberOfColumns).toBe(4);
            expect(view._columnViews.length).toEqual(view._numberOfColumns);
        });
    });

    describe('when relayouting', function () {
        var view;

	    beforeEach(function() {
	        setFixtures('<div id="hub-MediaWallView"></div>');
            $('#hub-MediaWallView').width(300*4); //220px is the default width of content

            spyOn(MediaWallView.prototype, 'fitColumns').andCallThrough();
            view = new MediaWallView({
                el : $('#hub-MediaWallView').get(0)
            });
		});

        it('expects child views to retain their event handlers (e.g. TiledAttachmentListView.el)', function () {
            expect(view._numberOfColumns).toBe(4);
            spyOn(MediaWallView.prototype, '_clearColumns').andCallThrough();
            spyOn(MediaWallView.prototype, '_createColumnView').andCallThrough();
            view.relayout();
            expect(MediaWallView.prototype._clearColumns).toHaveBeenCalled();
            expect(MediaWallView.prototype._createColumnView.callCount).toBe(view._numberOfColumns);
        });
    });

});
