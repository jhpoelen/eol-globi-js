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