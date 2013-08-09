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
    t.plan(4);
    var graphElement = document.createElement('div');
    var graphId = 'interaction-graph';
    graphElement.id = graphId;
    document.body.appendChild(graphElement);
    document.body.appendChild(document.createElement('legend'));
    t.equal(graphElement.children.length, 0);
    t.notEqual(globi, null);
    var location = { "nw_lat": 41.574361, "nw_lng": -125.533448, "se_lat": 32.750323, "se_lng": -114.744873};
    globi.addInteractionGraph(location, {"graphId": graphId, "legendId": "legend"},  1000, 400);
    t.equal(graphElement.children.length, 1);
});