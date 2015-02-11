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