var globiData = require('globi-data');
var EventEmitter = require('events').EventEmitter;
var jQuery = require('jquery');
var taxaprisma = require('taxaprisma');

var globi = {};
globi.globiData = globiData;
globi.jQuery = jQuery;

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
        var div = document.createElement('div');
        div.className = 'result-source';
        div.innerHTML = globi.getTaxonTemplate(taxonInfo);
        taxonInfoDiv.appendChild(div);
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

/**
 * Callback list handling (incl. trigger control)
 *
 * inspired by jQuery#Callbacks
 *
 * @param {String|Object} options
 * @returns {Object}
 * @constructor
 */
globi.Callbacks = function (options) {
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
        fire = function () {
            locked = options.once;

            fired = firing = true;
            for (; queue.length; firingIndex = -1) {
                memory = queue.shift();
                while (++firingIndex < list.length) {
                    if (list[firingIndex].apply(memory[0], memory[1]) === false &&
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
            add: function () {
                if (list) {
                    if (memory && !firing) {
                        firingIndex = list.length - 1;
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

            remove: function () {
                for (var i = 0, arg; arg = arguments[i]; i++) {
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

            has: function (fn) {
                return fn ?
                    list.indexOf(fn) > -1 :
                    list.length > 0;
            },

            empty: function () {
                if (list) {
                    list = [];
                }
                return this;
            },

            disable: function () {
                locked = queue = [];
                list = memory = '';
                return this;
            },

            disabled: function () {
                return !list;
            },

            lock: function () {
                locked = queue = [];
                if (!memory && !firing) {
                    list = memory = '';
                }
                return this;
            },

            locked: function () {
                return !!locked;
            },

            fireWith: function (context, args) {
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

            fire: function () {
                self.fireWith(this, arguments);
                return this;
            },

            fired: function () {
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
globi.Deferred = function (func) {
    var tuples = [
            [ 'resolve', 'done', globi.Callbacks('once memory'), 'resolved' ],
            [ 'reject', 'fail', globi.Callbacks('once memory'), 'rejected' ],
            [ 'notify', 'progress', globi.Callbacks('memory') ]
        ],
        state = 'pending',
        promise = {
            state: function () {
                return state;
            },
            always: function () {
                deferred.done(arguments).fail(arguments);
                return this;
            },
            then: function () {
                var fns = arguments;
                return globi.Deferred(function (newDefer) {
                    tuples.forEach(function (tuple, i) {
                        var fn = typeof fns[i] === 'function' && fns[i];
                        deferred[tuple[1]](function () {
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
            promise: function (obj) {
                return obj != null ? globi.extend(obj, promise) : promise;
            }
        },
        deferred = {};

    tuples.forEach(function (tuple, i) {
        var list = tuple[2],
            stateString = tuple[3];

        promise[tuple[1]] = list.add;

        if (stateString) {
            list.add(function () {
                state = stateString;
            }, tuples[i ^ 1][2].disable, tuples[2][2].lock);
        }

        deferred[tuple[0]] = function () {
            deferred[tuple[0] + "With"](this === deferred ? promise : this, arguments);
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
globi.extend = function (target, source) {
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
globi.PaginatedDataFetcher = function (settings) {
    this.settings = globi.extend({
        offset: 0,
        limit: 1024,
        url: '',
        maximumRequestCount: 2,
        requestCount: 0
    }, settings);
    this._initialOffset = this.settings.offset;
    this.init();
};

globi.extend(globi.PaginatedDataFetcher.prototype, {
    init: function () {
        this._data = [];
        this._columns = [];
    },

    setUrl: function (url) {
        this.url = url;
    },

    fetchChunk: function (offset) {
        var me = this, settings = me.settings;
        var d = globi.Deferred();
        jQuery.ajax(settings.url + '&limit=' + settings.limit + '&offset=' + offset, {
            dataType: 'json'
        }).done(function (response) {
            d.resolve(response);
        });
        return d.promise();
    },

    poll: function () {
        var me = this, settings = me.settings;
        return me.fetchChunk(settings.offset).then(function (reponse) {
            me._data = me._data.concat(reponse.data);
            me._columns = reponse.columns;
            if (reponse.data.length < settings.limit) {
                return me._data;
            }

            settings.offset = settings.offset + settings.limit;

            settings.requestCount = settings.requestCount + 1;
            if (settings.maximumRequestCount <= settings.requestCount) {
                return me._data;
            }
            return me.poll();
        });
    },

    fetch: function (callback, reset) {
        var me = this;
        reset = reset ? !!reset : true;
        if (reset) {
            me.settings.offset = me._initialOffset;
        }
        me.init();
        me.poll().then(function () {
            return true;
        }).done(function () {
            callback({ columns: me._columns, data: me._data });
        });
    }
});

globi.ResponseMapper = function () {
    var rawData = arguments.length === 1 ? arguments[0] : {},
        isArray = Array.isArray(rawData),
        rowNames = rawData['columns'] ? rawData['columns'] : [],
        data = rawData['data'] ? rawData['data'] : [],
        dataLength = isArray ? rawData.length : data.length;

    return function () {
        if (arguments.length === 0) {
            if (isArray) {
                return rawData;
            }
            return data.map(function (item) {
                return RowMapper(item, rowNames)
            });
        }
        if (arguments.length === 1 && typeof arguments[0] === 'number' && arguments[0] < dataLength) {
            if (isArray) {
                return rawData[arguments[0]];
            }
            return RowMapper(data[arguments[0]], rowNames);
        }
    };

    function RowMapper(data, names) {
        var row = {}, value;
        for (var i = 0, name; name = names[i]; i++) {
            value = data[i] ? data[i] : null;
            row[name] = value;
        }
        return row;
    }
};

globi.getTaxonTemplate = function(taxon) {
    var commonName = taxon['commonName'] ? taxon['commonName'] : '',
        scientificName = taxon['scientificName'] ? taxon['scientificName'] : '',
        path = taxon['taxonPath'] ? taxon['taxonPath'] : '',
        thumbnailURL = taxon['thumbnailURL'] ? taxon['thumbnailURL'] : '../img/no-image-available.png',
        infoURL = taxon['infoURL'] ? taxon['infoURL'] : '';

    return [
        '<div class="source-data">',
        '<div class="scientific-name" style="color: ' + taxaprisma.colorFor(path) + ';">' + scientificName + '</div>',
        '<a target="_blank" href="' + infoURL + '">',
        '<div class="taxon-image">',
        '<table style="width: 100%;"><tbody style="background-color: transparent;"><tr>',
        '<td style="width: 50%;vertical-align: middle;"><img height="50px" src="' + thumbnailURL + '" /></td>',
        '<td style="width: 50%;vertical-align: middle; text-align: right;"><img height="35px" src="' + taxaprisma.imageDataUrlFor(path) + '" /></td>',
        '</tr></tbody></table>',
        '</div>',
        '</a>',
        '<div class="common-name">' + commonName + '</div>',
        '</div>'
    ].join('');
};

module.exports = globi;
