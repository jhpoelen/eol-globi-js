var globi = require('../');
var test = require('tape');

test('my first dom test', function (t) {
    t.plan(3);

    function addScript() {
        var scriptElem = document.createElement('script');
        scriptElem.setAttribute('charset', 'utf-8');
        scriptElem.setAttribute('type', 'text/javascript');
        scriptElem.innerHTML = "var elem = document.createElement('div'); elem.setAttribute('id', 'myFirst'); document.body.appendChild(elem);";
        document.head.appendChild(scriptElem);
    }

    addScript();
    var nodes = document.querySelectorAll('#myFirst');
    t.equal(nodes.length, 1);
    var node = document.getElementById('myFirst');
    t.equal(node.id, 'myFirst');
    addScript();
    nodes = document.querySelectorAll('#myFirst');
    t.equal(nodes.length, 2);

});

test('check interaction graph insertion', function (t) {
    t.plan(3);
    var location = { nw_lat: 41.574361, nw_lng: -125.533448, se_lat: 32.750323, se_lng: -114.744873};
    var options = { location: location, width: 1000, height: 400 };

    var ee = globi.addInteractionGraph(options);
    ee.appendGraphTo(document.body);
    ee.appendLegendTo(document.body);

    t.ok(document.querySelector('.globi-interaction-graph'));
    t.ok(document.querySelector('.globi-interaction-graph-legend'));

    ee.on('ready', function () {
        t.ok(true);
    });

});

test('render taxon info box', function (t) {
    t.plan(2);
    var ee = globi.createTaxonInfo('Ariopsis felis');
    ee.appendTaxonInfoTo(document.body);
    t.ok(document.querySelector('.globi-taxon-info'));
    ee.on('ready', function () {
        t.ok(true);
        ee.registerOnClick(function (scientificName) {
            console.log('clicked on [' + scientificName + ']');
        });
    });
});
