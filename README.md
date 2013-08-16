eol-globi-js
============

[![Build Status](https://ci.testling.com/jhpoelen/eol-globi-js.png)](https://ci.testling.com/jhpoelen/eol-globi-js)

#Why?

Javascript library for embedding [EOL's Global Biotic Interactions Data](http://github.com/jhpoelen/eol-globi-data/) (or species interaction data) in webpages like eol or iNaturalist.  This library helps display answers to questions like: Which species eat rats _(Rattus rattus)_? -or What does a human _(Homo sapiens)_ eat?

# Getting Started

This library is using d3 to render svg widgets based on interaction data.  Curern

Here's an example on how to render the interaction graph widget.  Notice the ```../globi-dist.js``` script tag.

```javascript
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

If you'd like the standalone version (including d3), please use globi-dist.js.

# Running Tests
To test, run ```node test/test.js```


