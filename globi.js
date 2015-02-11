var d3 = require('d3');
var globiData = require('globi-data');
var EventEmitter = require('events').EventEmitter;
var jQuery = require('jquery');


var globi = {};
globi.d3 = d3;
globi.globiData = globiData;
globi.jQuery = jQuery;

// comments from code workshop 1 Aug 2013
// substack - bin-fields to use app /utils
// matt - document function with comments
// jack - introduce auto-complete, provide feedbackafter submit a search, fuzzy search
// ryan - top 5 searches
// bemson - drop-down
// substack - populate full data in server replies to reduce round trips

/**
 * Default area for all kinds of location consuming functions
 *
 * @type {{north: number, west: number, south: number, east: number}}
 */
globi.DEFAULT_AREA = {
    north: 90,
    west: -180,
    south: -90,
    east: 180
};

globi.createTaxonInfo = function (scientificName) {
    var ee = new EventEmitter();
    var taxonInfoDiv = document.createElement('div');
    taxonInfoDiv.setAttribute('class', 'globi-taxon-info');
    var callback = function (taxonInfo) {
        var img = document.createElement('img');
        img.setAttribute('src', taxonInfo.thumbnailURL);
        taxonInfoDiv.appendChild(img);
        var p = document.createElement('p');
        p.innerHTML = '<a href="' + taxonInfo.infoURL + '" target="_blank">' + taxonInfo.commonName + ' (<i>' + taxonInfo.scientificName + '</i>)</a>';
        taxonInfoDiv.appendChild(p);
        ee.emit('ready');
    };
    globiData.findTaxonInfo(scientificName, callback);

    ee.appendTaxonInfoTo = function (target) {
        target.appendChild(taxonInfoDiv);
    };

    ee.registerOnClick = function (onClick) {
        var img = taxonInfoDiv.getElementsByTagName('img')[0];
        if (img) {
            img.addEventListener('click', function () {
                onClick(scientificName);
            });
        }
    };
    return ee;
};

globi.viewInteractions = function (id, interactionType, sourceTaxonScientificName, interactionDescription, onClickScientificName) {
    var search = {"sourceTaxonScientificName": sourceTaxonScientificName, "interactionType": interactionType};
    var callback = function (interactions) {
        var htmlText = '<b>' + interactionDescription + '</b>';
        if (interactions && interactions.length === 0) {
            htmlText += ' <b> nothing</b>';
        }
        d3.select('#' + id).html(htmlText);
        interactions.forEach(function (interaction) {
            var taxonInfo = globi.createTaxonInfo(interaction.target.name);
            taxonInfo.registerOnClick(onClickScientificName);
            taxonInfo.on('ready', function() {
                 taxonInfo.appendTaxonInfoTo(document.getElementById(id));
            });
        });
    };
    globiData.findSpeciesInteractions(search, callback);
};

var matchAgainstTaxonomy = function (node) {
    return node.path && 'no:match' !== node.path;
};

var indexForNode = function (node) {
    return node.path + '_' + node.name;
};

var classnameForNode = function (node) {
    return node.name.replace(' ', '_');
};

var parse = function (response, interactions, nodes) {
    for (var i = response.length - 1; i >= 0; i--) {
        var inter = response[i];
        if (matchAgainstTaxonomy(inter.source) && matchAgainstTaxonomy(inter.target)) {
            var source = inter.source.name;

            var sourceIndex = indexForNode(inter.source);
            nodes[sourceIndex] = {name: source, id: inter.source.id, path: inter.source.path};

            var target = inter.target.name;
            var targetIndex = indexForNode(inter.target);
            nodes[targetIndex] = {name: target, id: inter.target.id, path: inter.target.path};

            var type = inter.type;
            var interactionIndex = source + '-' + type + '-' + target;
            interactions[interactionIndex] = {source: nodes[sourceIndex], type: type, target: nodes[targetIndex]};
        }
    }
};

var taxonColorMap = [];
taxonColorMap.Arthropoda = 'red';
taxonColorMap.Mammalia = 'lightblue';
taxonColorMap.Aves = 'brown';
taxonColorMap.Actinopterygii = 'blue';
taxonColorMap.Arachnida = 'pink';
taxonColorMap.Mollusca = 'orange';
taxonColorMap.Plantae = 'green';
taxonColorMap.Amphibia = 'violet';
taxonColorMap.Reptilia = 'yellow';
taxonColorMap.Bacteria = 'magenta';
taxonColorMap.other = 'gray';

var addLegend = function (legendDiv, colorMap, width, height) {
    var taxonRankColors = [];
    var i = 1;
    for (var taxon_rank in colorMap) {
        if (colorMap.hasOwnProperty(taxon_rank)) {
            taxonRankColors.push({rank: taxon_rank, color: colorMap[taxon_rank], id: i });
            i++;
        }
    }

    var legend = d3.select(legendDiv).append('svg')
        .attr('width', width / 5)
        .attr('height', height);

    var radius = height / taxonRankColors.length / 4;
    var yOffset = (height - 2 * radius * taxonRankColors.length) / taxonRankColors.length / 2;
    var xOffset = width / 20;

    legend.selectAll('circle')
        .data(taxonRankColors)
        .enter()
        .append('circle')
        .attr('style', function (d) {
            return 'fill:' + d.color;
        })
        .attr('cx', function (d) {
            return xOffset + radius;
        })
        .attr('cy', function (d) {
            return height / 50 + radius + d.id * (yOffset + (radius * 2));
        })
        .attr('r', function (d) {
            return radius;
        });

    legend.selectAll('text')
        .data(taxonRankColors)
        .enter()
        .append('text')
        .text(function (d) {
            return d.rank;
        })
        .style("font-size", function (d) {
            return height / 30 + "px";
        })
        .attr("x", function (d) {
            return xOffset * 1.4 + radius;
        })
        .attr("y", function (d) {
            return 1.2 * height / 50 + radius + d.id * (yOffset + (radius * 2));
        });

};

var pathColor = function (d) {
    var color = taxonColorMap.other;
    for (var taxonRank in taxonColorMap) {
        if (taxonColorMap.hasOwnProperty(taxonRank)) {
            if (d.path && d.path.match(taxonRank)) {
                color = taxonColorMap[taxonRank];
                break;
            }
        }
    }
    return color;
};

var nodeStyle = function (d) {
    return 'fill: ' + pathColor(d) + '; stroke: blue; opacity: 0.5;';
};

var nodeStyleActive = function (d) {
    return 'fill: ' + pathColor(d) + '; stroke: blue; opacity: 1.0;';
};


var lineStyle = function (d) {
    return 'stroke:' + (d.type === 'ATE' ? 'lightgreen' : 'pink') + '; fill:none; opacity:0.5;';
};

var lineStyleActive = function (d) {
    return 'stroke:' + (d.type === 'ATE' ? 'green' : 'red') + "; fill:none; opacity:0.9;";
};


var activateTaxonNodesAndLinks = function (svg, d, interactionDirection, ee) {
    svg.selectAll('.' + interactionDirection.start + '.' + classnameForNode(d))
        .attr('style', nodeStyleActive);
    svg.selectAll('.link.' + interactionDirection.start + '-' + classnameForNode(d))
        .attr('style', lineStyleActive);

    var interactions = svg.selectAll('.link.' + interactionDirection.start + '-' + classnameForNode(d)).data();
    ee.emit('select', interactions);
};

var addSourceTaxonNodes = function (svg, nodeArray, ee) {
    svg.selectAll('.source')
        .data(nodeArray)
        .enter()
        .append('circle')
        .attr('class', function (d) {
            return 'source ' + classnameForNode(d);
        })
        .attr('style', nodeStyle)
        .attr('cx', function (d) {
            return d.x;
        })
        .attr('cy', function (d) {
            return d.y1;
        })
        .attr('r', function (d) {
            return d.radius;
        })
        .on('mouseover', function (d) {
            activateTaxonNodesAndLinks(svg, d, {start: 'source', finish: 'target'}, ee);
            return d.name;
        })
        .on("mouseout", function (d) {
            svg.selectAll('.source.' + classnameForNode(d)).attr('style', nodeStyle);
            svg.selectAll('.link.source-' + classnameForNode(d)).attr('style', lineStyle);
            d3.selectAll('#source-taxon').selectAll('span').remove();
            d3.selectAll('#source-names').selectAll('span').remove();
            d3.selectAll('#target-names').selectAll('span').remove();
            ee.emit('deselect');
            return d.name;
        });
};

var addTargetTaxonNodes = function (svg, nodeArray, ee) {
    svg.selectAll('.target')
        .data(nodeArray)
        .enter()
        .append('circle')
        .attr('class', function (d) {
            return 'target ' + classnameForNode(d);
        })
        .attr('style', nodeStyle)
        .attr('cx', function (d) {
            return d.x;
        })
        .attr('cy', function (d) {
            return d.y2;
        })
        .attr('r', function (d) {
            return d.radius;
        })
        .on('mouseover', function (d) {
            activateTaxonNodesAndLinks(svg, d, {start: 'target', finish: 'source'}, ee);
            return d.name;
        })
        .on("mouseout", function (d) {
            svg.selectAll('.target.' + classnameForNode(d)).attr('style', nodeStyle);
            svg.selectAll('.link.target-' + classnameForNode(d)).attr('style', lineStyle);
            d3.selectAll('#target-taxon').selectAll('span').remove();
            d3.selectAll('#target-names').selectAll('span').remove();
            d3.selectAll('#source-names').selectAll('span').remove();
            ee.emit('deselect');
            return d.name;
        });
};

var addInteraction = function (svg, interactionArray, ee) {
    svg.selectAll('.link')
        .data(interactionArray)
        .enter()
        .append('path')
        .attr('class', function (d) {
            return 'link source-' + classnameForNode(d.source) + ' target-' + classnameForNode(d.target);
        })
        .attr('style', lineStyle)
        .attr('d', function (d) {
            return 'M' + d.source.x + ' ' + d.source.y1 + ' L' + d.target.x + ' ' + d.target.y2;
        })
        .on('mouseover', function (d) {
            d3.select(this).attr('style', lineStyleActive(d));
            ee.emit('select', [d]);
            return d;
        })
        .on('mouseout', function (d) {
            d3.select(this).attr('style', lineStyle(d));
            ee.emit('deselect');
            return d;
        });
};


globi.addInteractionGraph = function (options) {
    var ee = new EventEmitter();

    var legendDiv = document.createElement('div');
    legendDiv.setAttribute('class', 'globi-interaction-graph-legend');
    addLegend(legendDiv, taxonColorMap, options.width, options.height);

    var graphDiv = document.createElement('div');
    graphDiv.setAttribute('class', 'globi-interaction-graph');

    var svg = d3.select(graphDiv).append('svg')
        .attr('width', options.width)
        .attr('height', options.height);


    var callback = function (interactions) {
        console.log('found [' + interactions.length + '] interactions');
        var mergedInteractions = {};
        var nodes = {};

        parse(interactions, mergedInteractions, nodes);

        var nodeKeys = [];

        var number_of_nodes = 0;
        for (var node_key in nodes) {
            if (nodes.hasOwnProperty(node_key)) {
              number_of_nodes++;
              nodeKeys.push(node_key);
            }
        }

        nodeKeys.sort();

        var i = 0;

        var taxonNodes = [];
        for (var nodeKey in nodeKeys) {
            if (nodeKeys.hasOwnProperty(nodeKey)) {
              var key = nodeKeys[nodeKey];
              var widthPerNode = options.width / (number_of_nodes + 1);
              nodes[key].x = widthPerNode + i * widthPerNode;
              /**
              * @gb: Added a second ordinate to fix y-scale problem
              * * Additionally this speeds up rendering because we don't need Bezier ploting in #addIteraction anymore
              */
              nodes[key].y1 = widthPerNode;
              nodes[key].y2 = options.height - widthPerNode;
              nodes[key].radius = widthPerNode / 2.0;
              nodes[key].color = "pink";
              taxonNodes.push(nodes[key]);
              i = i + 1;
            }
        }

        var interactionsArray = [];
        for (var mi in mergedInteractions) {
            if (mergedInteractions.hasOwnProperty(mi)) {
              mergedInteractions[mi].source = nodes[indexForNode(mergedInteractions[mi].source)];
              mergedInteractions[mi].target = nodes[indexForNode(mergedInteractions[mi].target)];
              interactionsArray.push(mergedInteractions[mi]);
            }
        }

        addSourceTaxonNodes(svg, taxonNodes, ee);
        addTargetTaxonNodes(svg, taxonNodes, ee);
        addInteraction(svg, interactionsArray, ee);
        ee.emit('ready');
    };

    globiData.findSpeciesInteractions(options, callback);

    ee.appendGraphTo = function (target) {
        target.appendChild(graphDiv);
    };
    ee.appendLegendTo = function (target) {
        target.appendChild(legendDiv);
    };
    return ee;
};

/**
 * Normalizes coordinates into an object with
 * north, south, west, and east properties
 *
 * normalizing follows the rules:
 * 1. illegal parameter defaults to standard area
 * 2. illegal parameter count defaults to standard area
 * 3. north > south; west < east
 * 4. single point expands to "4%"-area
 *
 * @param coordinates
 * @returns {{}}
 */
globi.getNormalizeAreaCoordinates = function(coordinates) {
    var temp,
        normalized = {};
    switch (arguments.length) {
        case 1:
            normalized = arguments[0];
            break;
        case 2:
            arguments[2] = 1.02 * arguments[0];
            arguments[3] = 1.02 * arguments[1];
            arguments[0] = 0.98 * arguments[0];
            arguments[1] = 0.98 * arguments[1];
        case 4:
            normalized = {
                north: arguments[1],
                west: arguments[0],
                south: arguments[3],
                east: arguments[2]
            };
            break;
        default:
            normalized = getDefaultArea();
            break;
    }
    if (typeof normalized.north === 'undefined' ||
        typeof normalized.south === 'undefined' ||
        typeof normalized.west === 'undefined' ||
        typeof normalized.east === 'undefined'
    ) {
        normalized = getDefaultArea();
    }
    if (normalized.north < normalized.south) {
        temp = normalized.north;
        normalized.north = normalized.south;
        normalized.south = temp;
    }
    if (normalized.west > normalized.east) {
        temp = normalized.west;
        normalized.west = normalized.east;
        normalized.east = temp;
    }
    return normalized;

    function getDefaultArea() {
        return globi.DEFAULT_AREA;
    }
};

/**
 * Callback list handling (incl. trigger control)
 *
 * inspired by jQuery#Callbacks
 *
 * @param {String|Object} options
 * @returns {Object}
 * @constructor
 */
globi.Callbacks = function(options) {
    function createOptions(options) {
        var object = {}, names = options.split(' ');
        for (var i = 0, name; name = names[i]; i++) {
            object[name] = true;
        }
        return object;
    }

    options = typeof options === 'string' ?
        createOptions(options) :
        globi.extend({}, options);

    var firing,
        memory,
        fired,
        locked,
        list = [],
        queue = [],
        firingIndex = -1,
        fire = function() {
            locked = options.once;

            fired = firing = true;
            for(; queue.length; firingIndex = -1) {
                memory = queue.shift();
                while (++firingIndex < list.length) {
                    if(list[firingIndex].apply(memory[0], memory[1]) === false &&
                        options.stopOnFalse) {
                        firingIndex = list.length;
                        memory = false;
                    }
                }
            }

            if (!options.memory) {
                memory = false;
            }

            firing = false;

            if (locked) {
                if (memory) {
                    list = [];
                } else {
                    list = '';
                }
            }
        },

        self = {
            add: function() {
                if (list) {
                    if (memory && !firing) {
                        firingIndex = list.length -1;
                        queue.push(memory);
                    }

                    (function add(args) {
                        for (var i = 0, arg; arg = args[i]; i++) {
                            if (typeof arg === 'function') {
                                if (!options.unique || !self.has(arg)) {
                                    list.push(arg);
                                }
                            } else if (arg && arg.length && typeof arg !== 'string') {
                                add(arg);
                            }
                        }
                    })(arguments);

                    if (memory && !firing) {
                        fire();
                    }
                }
                return this;
            },

            remove: function() {
                for(var i = 0, arg; arg = arguments[i]; i++) {
                    var index;
                    while ((index = list.indexOf(arg)) > -1) {
                        list.splice(index, 1);

                        if (index <= firingIndex) {
                            firingIndex--;
                        }
                    }
                }
                return this;
            },

            has: function(fn) {
                return fn ?
                list.indexOf(fn) > -1 :
                list.length > 0;
            },

            empty: function() {
                if (list) {
                    list = [];
                }
                return this;
            },

            disable: function() {
                locked = queue = [];
                list = memory = '';
                return this;
            },

            disabled: function() {
                return !list;
            },

            lock: function() {
                locked = queue = [];
                if (!memory && !firing) {
                    list = memory = '';
                }
                return this;
            },

            locked: function() {
                return !!locked;
            },

            fireWith: function(context, args) {
                if (!locked) {
                    args = args || [];
                    args = [ context, args.slice ? args.slice() : args ];
                    queue.push(args);
                    if (!firing) {
                        fire();
                    }
                }
                return this;
            },

            fire: function() {
                self.fireWith(this, arguments);
                return this;
            },

            fired: function() {
                return !!fired;
            }
        };

    return self;
};

/**
 * Deferred function handling
 * allows easier asynchronous call management
 *
 * heavily inspired by jQuery#Deferred
 *
 * @param {Function} [func]
 * @returns {Object}
 * @constructor
 */
globi.Deferred = function(func) {
    var tuples = [
            [ 'resolve', 'done', globi.Callbacks('once memory'), 'resolved' ],
            [ 'reject', 'fail', globi.Callbacks('once memory'), 'rejected' ],
            [ 'notify', 'progress', globi.Callbacks('memory') ]
        ],
        state = 'pending',
        promise = {
            state: function() {
                return state;
            },
            always: function() {
                deferred.done(arguments).fail(arguments);
                return this;
            },
            then: function() {
                var fns = arguments;
                return globi.Deferred(function(newDefer) {
                    tuples.forEach(function(tuple, i) {
                        var fn = typeof fns[i] === 'function' && fns[i];
                        deferred[tuple[1]](function() {
                            var returned = fn && fn.apply(this, arguments);
                            if (returned && typeof returned.promise === 'function') {
                                returned.promise()
                                    .done(newDefer.resolve)
                                    .fail(newDefer.reject)
                                    .progress(newDefer.notify);
                            } else {
                                newDefer[tuple[0] + 'With'](
                                    this === promise ? newDefer.promise() : this,
                                    fn ? [ returned ] : arguments
                                );
                            }
                        });
                    });
                    fns = null;
                }).promise();
            },
            promise: function(obj) {
                return obj != null ? globi.extend(obj, promise) : promise;
            }
        },
        deferred = {};

    tuples.forEach(function(tuple, i) {
        var list = tuple[2],
            stateString = tuple[3];

        promise[tuple[1]] = list.add;

        if (stateString) {
            list.add(function() {
                state = stateString;
            }, tuples[i ^ 1][2].disable, tuples[2][2].lock );
        }

        deferred[tuple[0]] = function() {
            deferred[tuple[0] + "With"]( this === deferred ? promise : this, arguments );
            return this;
        };
        deferred[tuple[0] + "With"] = list.fireWith;
    });

    promise.promise(deferred);

    if (func) {
        func.call(deferred, deferred);
    }

    return deferred;
};

/**
 * Simple object extension
 *
 * @param {Object} target
 * @param {Object} source
 * @returns {Object}
 */
globi.extend = function(target, source) {
    for (var k in source) {
        if (source.hasOwnProperty(k)) {
            var value = source[k];
            if (target.hasOwnProperty(k) && typeof target[k] === "object" && typeof value === "object") {
                globi.extend(target[k], value);
            } else {
                target[k] = value;
            }
        }
    }
    return target;
};

/**
 * Fetches paginated data by retrieving it chunk by chunk
 *
 * @param {Object} settings
 * @constructor
 */
globi.PaginatedDataFetcher = function(settings) {
    this.settings = globi.extend({
        offset: 0,
        limit: 1024,
        url: '',
        type: 'json'
    }, settings);
    this.init();
};

globi.extend(globi.PaginatedDataFetcher.prototype, {
    init: function() {
        this._data = [];
    },

    setUrl: function(url) {
        this.url = url;
    },

    fetchChunk: function(offset) {
        var me = this, settings = me.settings;
        var d = globi.Deferred();
        $.ajax(settings.url + '&limit=' + settings.limit + '&offset=' + offset + '&type=' + settings.type, {
            dataType: 'json'
        }).done(function(response) {
            d.resolve(response);
        });
        return d.promise();
    },

    poll: function() {
        var me = this, settings = me.settings;
        return me.fetchChunk(settings.offset).then(function(reponse) {
            me._data = me._data.concat(reponse.data);
            if (reponse.data.length < settings.limit) {
                return me._data;
            }

            settings.offset = settings.offset + settings.limit;
            return me.poll();
        });
    },

    fetch: function(callback) {
        var me = this;
        me.poll().then(function () {
            return true;
        }).done(function () {
            callback(me._data);
        });
    }
});

(function($, undefined) {
    'use strict';

    var pluginName = 'interactions',
        defaults = {
            'common-language-code': 'en'
        };

    var baseUrl = 'api.globalbioticinteractions.org';
    var resultFormat = 'type=json.v2';

    var queryCache = {
        'distinctInteractionSourceOnly': 'taxon/###source###/###interaction###',
        'distinctInteraction': 'taxon/###source###/###interaction###/###target###'
    };

    function Plugin(element, options) {
        this.$element = $(element);

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.selectedSourceTaxon = null;
        this.selectedInteractionType = null;
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function() {
            this.$element.empty();
            this.$element.css({
                padding: '20px'
            });
            this.createSourceTaxonSelector();
            this.createInteractionTypesSelector();
            this.createResultView();
            this.$element.append(this.sourceTaxonSelector.$element);
            this.$element.append(this.typeSelector.$element);
            this.$element.append(this.resultView);
        },

        update: function(bboxString) {
            this.settings.bboxString = bboxString;
            this.init();
        },

        createSourceTaxonSelector: function() {
            var me = this;

            this.sourceTaxonSelector = new SourceTaxonSelector({
                selected: { callback: me.updateTypeSelector, context: me },
                bboxString: me.settings.bboxString
            });
        },

        createInteractionTypesSelector: function() {
            var me = this;
            this.typeSelector = new InteractionTypeSelector({
                change: { callback: me.retrieveDataForSourceAndTypeSelection, context: me }
            });
            this.typeSelector.disable();
        },

        updateTypeSelector: function(sourceTaxon) {
            this.selectedSourceTaxon = sourceTaxon;
            this.typeSelector.disable(true);
            this.clearResultView();
            this.retrieveDataForTypeSelection(sourceTaxon);
        },

        retrieveDataForTypeSelection: function(sourceTaxon) {
            var me = this;

            globiData.findInteractionTypes(
                [sourceTaxon],
                {
                    callback: function(data) {
                        var me = this;
                        $.each(data, function(key) { me.typeSelector.addOption(me._camelCaseToRealWords(key), key); });
                        me.typeSelector.enable();
                    },
                    context: me
                }
            );
        },

        retrieveDataForSourceAndTypeSelection: function(interactionType) {
            var me = this, sourceTaxon = me.selectedSourceTaxon;
            this.selectedInteractionType = interactionType;

            globiData.findSpeciesInteractions(
                {"sourceTaxonScientificName": sourceTaxon, "interactionType": interactionType},
                { callback: me.showDataForSourceAndTypeSelection, context: me }
            );
        },

        createResultView: function() {
            this.resultView = $('<div id="results" />');
        },

        clearResultView: function() {
            this.resultView.empty();
        },

        showDataForSourceAndTypeSelection: function(data) {
            this.clearResultView();
            var odd = true;
            if (data.length > 0) {
                var table = $('<table class="interactions-result"/>');
                data.forEach(function (item) {
                    table.append(
                        '<tr class="' + (odd ? 'odd' : 'even') + '"><td>' + item.source.name + '</td>' +
                        '<td>' + item.type + '</td>' +
                        '<td>' + item.target.name + '</td>' +
                        '</tr>');
                    odd = !odd;
                });
                this.resultView.append(table);
            } else {
                this.resultView.html('Empty resultset');
            }
        },

        _camelCaseToRealWords: function(str) {
            str = str.replace(/([A-Z])/g, function($1){return " "+$1.toLowerCase();});
            var strParts = str.split(' '), lastPart = strParts[strParts.length - 1];
            if (['of', 'by'].indexOf(lastPart) >= 0) {
                strParts.unshift('is');
            }
            return strParts.join(' ');
        }
    });

    function SourceTaxonSelector(settings) {
        this.settings = $.extend({
            idPrefix: 'source-taxon-',
            selected: {
                callback: function() {},
                context: this
            }
        }, settings);
        this.init();
    }

    $.extend(SourceTaxonSelector.prototype, {
        init: function() {
            var me = this;
            this.$element = $('<div id="' + this.settings.idPrefix + 'selector-wrapper"/>');
            this._data = [];

            this.process();
        },

        process: function() {
            var me = this,
                url = 'http://api.globalbioticinteractions.org/taxon?' + me.settings.bboxString + '&field=taxon_path&field=taxon_path_ids&field=taxon_common_names';

            if (!this.dataFetcher) {
                this.dataFetcher = new globi.PaginatedDataFetcher({
                    url: url
                });
            } else {
                this.dataFetcher.settings.url = url;
            }

            this.$element.empty();
            this.initUi();
            this.dataFetcher.fetch(function(data) {
                me.parseData(data);
                me.processUi();
                me.render();
            });
        },

        update: function(bboxString) {
            this.settings.bboxString = bboxString;
            this.process();
        },

        initUi: function() {
            this.$element.append('<div id="' + this.settings.idPrefix + 'splash">Data load ... please wait.</div>')
        },

        processUi: function() {
            this.$element.empty();
            this.$element.append('<div style="margin-bottom: 10px;"><input size="50"  placeholder="Type in a taxon name" id="' + this.settings.idPrefix + 'input" /></div>');
            this.$element.append('<div style="width: 100px; float: left; margin-right: 10px;"><img id="' + this.settings.idPrefix + 'image" width="100px" src="" alt=""/></div>');
            var wrapper = this.$element.append('<div style="float: left;"/>');
            wrapper.append('<div style="font-size: 12px;" id="' + this.settings.idPrefix + 'id" />');
            wrapper.append('<div style="font-size: 12px;" id="' + this.settings.idPrefix + 'name" />');
            this.$element.append('<div style="margin-top:10px;clear: left;"/>');
        },

        render: function() {
            var me = this,
                settings = me.settings,
                inputSelector = '#' + settings.idPrefix + 'input',
                nameSelector = '#' + settings.idPrefix + 'name',
                idSelector = '#' + settings.idPrefix + 'id',
                imageSelector = '#' + settings.idPrefix + 'image';
            $( inputSelector ).autocomplete({
                minLength: 3,
                source: me._data,
                focus: function( event, ui ) {
                    $( inputSelector ).val( ui.item.label );
                    return false;
                },
                select: function( event, ui ) {
                    $(inputSelector).val(ui.item.label );
                    $(nameSelector).html( ui.item.name );
                    $(idSelector).html( ui.item.value );
                    $(imageSelector).attr( "src", '' );
                    globiData.findThumbnailById(ui.item.value, function(thumbnailUrl) {
                        $(imageSelector).attr( "src", thumbnailUrl );
                    });
                    setTimeout(settings.selected.callback.call(settings.selected.context, ui.item.name), 0);
                    return false;
                }
            }).autocomplete( "instance" )._renderItem = function( ul, item ) {
                return $( "<li>" )
                    .append( "<a>" + item.label + "<br>" + item.value + "</a>" )
                    .appendTo( ul );
            };
        },

        parseData: function(data) {
            var me = this;
            var idCache = [];
            data.forEach(function(item) {
                var commonNames = globiData.mapCommonNameList(item[0]),
                    commonName = (commonNames['count'] > 0 && commonNames['en']) ? commonNames['en'] : '';
                if (item[1] && item[2]) {
                    var paths = item[1].split('|').map(function(item) { return item.trim(); }), pathList = [];
                    paths.forEach(function(pathPart) {
                        if (pathPart !== '') {
                            pathList.push(pathPart);
                        }
                    });
                    var ids = item[2].split('|').map(function(item) { return item.trim(); }), idList = [];
                    ids.forEach(function(idPart) {
                        if (idPart !== '') {
                            idList.push(idPart);
                        }
                    });
                    for (var i = 0, len = pathList.length; i < len; i++) {
                        if (idCache.indexOf(idList[i]) === -1 ) {
                            me._data.push({
                                'name': pathList[i],
                                'label': pathList[i] + ((i === len - 1) && (commonName !== '') ? ' (' + commonName + ')' : ''),
                                'value': idList[i]
                            });
                            idCache.push(idList[i]);
                        }
                    }
                }
            });
        }
    });

    function InteractionTypeSelector(settings) {
        this.settings = $.extend({
            options: [],
            change: {
                callback: function() {},
                context: this
            }
        }, settings);
        this.init();
    }

    $.extend(InteractionTypeSelector.prototype, {
        init: function() {
            var me = this;
            this.$element = $('<select class="eol-interaction-type-selector"/>').change($.proxy(this.onChange, this));
            this.clear();
            this.settings.options.forEach(function(option) {
                me.addOption(option.label, option.value);
            });
        },

        __EMPTY_OPTION_KEY__: '--',
        __EMPTY_OPTION_LABEL__: '--- choose ---',

        clear: function() {
            this.options = [];
            this.$element.empty();
            this.addOption(this.__EMPTY_OPTION_LABEL__, this.__EMPTY_OPTION_KEY__ );
        },

        disable: function(clear) {
            clear && this.clear();
            this.$element.prop('disabled', 'disabled');
            return this;
        },

        enable: function() {
            this.$element.prop('disabled', false);
            return this;
        },

        render: function() {
            var me = this;
            this.$element.empty();
            this.options.sort(this._compare);
            this.options.forEach(function(option) {
                var optionElement = $('<option value="' + option.value + '">' + option.label + '</option>' );
                me.$element.append(optionElement);
            });
            return this.$element;
        },

        addOption: function(label, value) {
            if (arguments.length === 1) {
                value = label
            }
            var isNew = true;
            this.options.forEach(function(option) {
                if (option.value === value) {
                    isNew = isNew && false;
                }
            });
            if (isNew) {
                this.options.push({ value: value, label: label });
                this.render();
            }
            return this;
        },

        removeOption: function(value) {
            value = value || '###';
            var tempOptions = [];
            this.options.forEach(function(option) {
                if (option.value !== value) {
                    tempOptions.push(option);
                }
            });
            this.options = tempOptions;
            this.render();
            return this;
        },

        onChange: function(event) {
            var chosenOption = $(event.target).val();
            if (chosenOption !== this.__EMPTY_OPTION_KEY__) {
                this.settings.change.callback.call(this.settings.change.context, chosenOption);
            }
        },

        _compare: function(a, b) {
            if (a.label < b.label) {
                return -1;
            }
            if (a.label > b.label) {
                return 1;
            }
            return 0;
        }
    });

    $.fn[pluginName] = function(options) {
        return this.each(function() {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
            }
        });
    };

})(globi.jQuery);


module.exports = globi;
