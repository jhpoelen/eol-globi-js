var globi = require('../');
var test = require('tape');

test('transformPipedCommonNameList with standard format', function (t) {
    t.plan(4);

    var mock1 = 'foo @en | bar @de';
    var mock2 = 'foo @en';
    var result1 = globi.transformPipedCommonNameList(mock1);
    var result2 = globi.transformPipedCommonNameList(mock2);

    t.equal(typeof result1, 'object');
    t.deepEqual(result1, {en: 'foo', de: 'bar'});

    t.equal(typeof result2, 'object');
    t.deepEqual(result2, {en: 'foo'});
});

test('transformPipedCommonNameList with trailing signs', function (t) {
    t.plan(6);

    var mock1 = 'foo @en | bar @de ';
    var mock2 = 'foo @en | bar @de |';
    var mock3 = 'foo @en | bar @de | ';
    var result1 = globi.transformPipedCommonNameList(mock1);
    var result2 = globi.transformPipedCommonNameList(mock2);
    var result3 = globi.transformPipedCommonNameList(mock3);

    t.equal(typeof result1, 'object');
    t.deepEqual(result1, {en: 'foo', de: 'bar'});

    t.equal(typeof result2, 'object');
    t.deepEqual(result2, {en: 'foo', de: 'bar'});

    t.equal(typeof result3, 'object');
    t.deepEqual(result3, {en: 'foo', de: 'bar'});
});

test('transformPipedCommonNameList heading signs', function (t) {
    t.plan(6);

    var mock1 = ' foo @en | bar @de';
    var mock2 = '| foo @en | bar @de';
    var mock3 = ' | foo @en | bar @de';
    var result1 = globi.transformPipedCommonNameList(mock1);
    var result2 = globi.transformPipedCommonNameList(mock2);
    var result3 = globi.transformPipedCommonNameList(mock3);

    t.equal(typeof result1, 'object');
    t.deepEqual(result1, {en: 'foo', de: 'bar'});

    t.equal(typeof result2, 'object');
    t.deepEqual(result2, {en: 'foo', de: 'bar'});

    t.equal(typeof result3, 'object');
    t.deepEqual(result3, {en: 'foo', de: 'bar'});
});

test('transformPipedCommonNameList override', function (t) {
    t.plan(3);

    var mock = ' foo @en | bar @de | baz @en';

    var result1 = globi.transformPipedCommonNameList(mock);
    var result2 = globi.transformPipedCommonNameList(mock, true);
    var result3 = globi.transformPipedCommonNameList(mock, false);

    t.deepEqual(result1, {en: 'baz', de: 'bar'});
    t.deepEqual(result2, {en: 'baz', de: 'bar'});
    t.deepEqual(result3, {en: 'foo', de: 'bar'});
});