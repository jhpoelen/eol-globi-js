// @todo switch with requested ones
var mockData = {
    availableInteractionTypes: [
        { value: "preysOn", 'label': 'preys on' },
        { value: "preyedUponBy", 'label': 'is preyed upon by' },
        { value: "parasiteOf", 'label': 'is parasite of' },
        { value: "hasParasite", 'label': 'has parasite' },
        { value: "pollinates", 'label': 'pollinates' },
        { value: "pollinatedBy", 'label': 'is pollinated by' },
        { value: "pathogenOf", 'label': 'is pathogen Of' },
        { value: "hasPathogen", 'label': 'has patogen' },
        { value: "symbiontOf", 'label': 'is symbiont of' },
        { value: "interactsWith", 'label': 'interacts with' }
    ]
};

(function($, window, document, undefined) {
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
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function() {
            this.createInteractionTypesSelector();
        },

        createInteractionTypesSelector: function() {
            var me = this;
            this.typeSelector = new InteractionTypeSelector();
            // @todo switch with requested ones
            mockData.availableInteractionTypes.forEach(function(option) {
                me.typeSelector.addOption(option.label, option.value);
            });

            this.$element.append(this.typeSelector.$element);
        }

    });

    function InteractionTypeSelector() {
        this.$element = $('<select class="eol-interaction-type-selector"/>');
        this.options = [];
        this.init();
    }

    $.extend(InteractionTypeSelector.prototype, {
        init: function() {
        },

        clear: function() {
            this.$element.empty();
        },

        disable: function(clear) {
            if( clear ) {
                this.clear();
                this.options = [];
            }
            this.$element.prop('disabled', 'disabled');
            return this;
        },

        enable: function() {
            this.$element.prop('disabled', false);
            return this;
        },

        render: function() {
            var me = this;
            this.clear();
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
})(jQuery, window, document);