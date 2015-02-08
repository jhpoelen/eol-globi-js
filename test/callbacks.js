var globi = require('../globi.js');
var test = require('tape');


test('Callbacks with empty option', function(t) {
    t.plan(12);

    var cbList = globi.Callbacks(''), output = 'X';

    t.strictEqual(cbList.locked(), false, '.locked() initial state: false');
    t.strictEqual(cbList.disabled(), false, '.disabled() initial state: false');
    t.strictEqual(cbList.fired(), false, '.fired() initial state: false');

    cbList.add(function(s) { output += s; });
    t.strictEqual(cbList.fired(), false, 'after .add .fired() state: false');

    cbList.fire('A');
    t.strictEqual(output, 'XA', 'output after firing');
    t.strictEqual(cbList.fired(), true, 'firing detected');

    output = 'X';
    cbList.disable();
    cbList.add(function(s) { output += s; });
    t.strictEqual(output, 'X', 'Adding after disabled()');
    cbList.fire('A');
    t.strictEqual(output, 'X', 'Firing after disabled()');
    t.strictEqual(cbList.disabled(), true, ".disabled() state: true" );
    t.strictEqual(cbList.locked(), true, "disabled() has locked it" );

    cbList = globi.Callbacks('');
    cbList.add(cbList.disable);
    cbList.add(function() { t.ok( false, 'not disabled'); });
    cbList.fire();

    output = 'X';
    cbList = globi.Callbacks('');
    cbList.add(function() {
        t.equal(this, window, 'Context');
        output += Array.prototype.join.call(arguments, '');
    });
    cbList.fireWith(window, ['A', 'B']);
    t.strictEqual(output, "XAB", "Firing (arguments)" );

});
