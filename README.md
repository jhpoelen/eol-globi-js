eol-globi-js
============

[![Build Status](https://travis-ci.org/jhpoelen/eol-globi-js.svg?branch=master)](https://travis-ci.org/jhpoelen/eol-globi-js)
[![Code Climate](https://codeclimate.com/github/jhpoelen/eol-globi-js/badges/gpa.svg)](https://codeclimate.com/github/jhpoelen/eol-globi-js)

#Why?

Species interaction data tells us a lot about how organisms interact within an ecosystem.

```eol-globi-js``` contains a javascript api to embed species interactions visualizations in web pages using [EOL's Global Biotic Interactions Data](http://github.com/jhpoelen/eol-globi-data/) (or species interaction data). This library helps display answers to questions like: Which species eat rats _(Rattus rattus)_? -or What does a human _(Homo sapiens)_ eat?

The goal of this is to give you (yes you!) easy access to species interaction data and inspire other meaningful uses of the rich data sets that are readily available.

If you are interested in building your own visualization based on interaction data, you might want to:

1. checkout the examples in the  [```examples/```](https://github.com/jhpoelen/eol-globi-js/tree/master/examples) directory, and/or,

2. improve this library by becoming a contributor to this project, and/or,

3. use the [GloBI REST](http://github.com/jhpoelen/eol-globi-data/wiki/rest) services directly, and/or,

4. use the [eol-globi-data-js](http://github.com/jhpoelen/eol-globi-data-js) to access data using a javascript library.


# Getting Started

This library is using [d3](http://d3js.org) to render svg widgets based on [GloBI](http://github.com/jhpoelen/eol-globi-data) species interaction data.

If you'd like the standalone version (including d3), please use globi-dist.js, otherwise, simply include the npm module [```globi```](https://npmjs.org/package/globi) module in your project.

Below is an example snippet on how to render the interaction graph widget.  You can find the full example in [bipartite-graph.html](https://github.com/jhpoelen/eol-globi-js/tree/master/examples/bipartite-graph.html]).  The examples have been tested in Firefox.

```javascript
        ...
        <script src="../globi-dist.js" charset="utf-8"></script>
        <script type="text/javascript" charset="utf-8">

            window.onload = function () {
                var california = { nw_lat: 41.574361, nw_lng: -125.533448, se_lat: 32.750323, se_lng: -114.744873};
                var options = { location: california, width: 1000, height: 500 };

                // event emitter (ee) object is returned for client to respond to events
                var ee = globi.addInteractionGraph(options);

                // interaction data is received and has been rendered
                ee.on('ready', function () {
                    ee.appendGraphTo(document.querySelector('#interaction_graph'));
                    ee.appendLegendTo(document.querySelector('#interaction_graph_legend'));
                });

                // specific interactions have been selected by user
                ee.on('selected', function (interactions) {
                    // remove previous interaction text
                    globi.d3.selectAll('#selected-interactions').selectAll('div').remove();

                    // add new interaction text
                    var divs = globi.d3.selectAll('#selected-interactions').selectAll('div')
                            .data(interactions);

                    divs.enter()
                            .append('div')
                            .text(function (d) {
                                return  '[' + d.source.name + ' (' + d.source.id + ')]-[:'
                                        + d.type
                                        + ']->[' + d.target.name + ' (' + d.target.id + ')]';
                            });
                });

            };

        </script>
        ...
```

If all goes well, you should see something like: [![interaction graph](https://s3-us-west-2.amazonaws.com/bioticinteractions/interaction-graph.png)](https://github.com/jhpoelen/eol-globi-js/tree/master/examples/bipartite-graph.html)

Another example, a [species interaction browser](https://github.com/jhpoelen/eol-globi-js/tree/master/examples/species_interaction_browser.html) should look something like: [![species_browser](https://s3-us-west-2.amazonaws.com/bioticinteractions/interaction-browser.png)](https://github.com/jhpoelen/eol-globi-js/tree/master/examples/species_interaction_browser.html)


# Running Tests
To test, run ```testling``` in the root directory of this project.

# NPM (node package manager) module
[![npm logo](https://npmjs.org/static/npm.png)](http://npmjs.org)

This library is published as the npm module [```globi```](https://npmjs.org/package/globi) and depends on [```globi-data```](https://npmjs.org/package/globi-data).

# Feedback
 Feedback is much appreciated! Please open a [new issue](http://github.com/jhpoelen/eol-globi-js/issues/new) to share you ideas or . . . become a contributor . . .
