var globi = require('../globi.js');
var test = require('tape');

test('getNormalizeAreaCoordinates with 0 arguments should use defaultArea', function(t) {
    t.plan(2);

    var result = globi.getNormalizeAreaCoordinates();
    t.equal(typeof result, 'object');
    t.deepEqual(result, globi.DEFAULT_AREA);
});

test('getNormalizeAreaCoordinates with 1 argument should use this as an area object', function(t) {
    t.plan(2);

    var result = globi.getNormalizeAreaCoordinates({ north: 23, west: 42, south: -4, east: 3 });
    t.equal(typeof result, 'object');
    t.deepEqual(result, { "north": 23,"west": 3,"south": -4,"east": 42 });
});

test('getNormalizeAreaCoordinates with 1 non-sense argument should use defaultArea', function(t) {
    t.plan(4);

    var result1 = globi.getNormalizeAreaCoordinates({ no: 23, way: 42, to: -4, parse: 3 });
    var result2 = globi.getNormalizeAreaCoordinates(5);

    t.equal(typeof result1, 'object');
    t.deepEqual(result1, globi.getNormalizeAreaCoordinates());
    t.equal(typeof result2, 'object');
    t.deepEqual(result2, globi.getNormalizeAreaCoordinates());
});

test('getNormalizeAreaCoordinates with 2 arguments should use these as point and create an 4% wide/tall area', function(t) {
    t.plan(8);

    var result1 = globi.getNormalizeAreaCoordinates(100, 50);
    var result2 = globi.getNormalizeAreaCoordinates(-100, 50);
    var result3 = globi.getNormalizeAreaCoordinates(100, -50);
    var result4 = globi.getNormalizeAreaCoordinates(-100, -50);

    t.equal(typeof result1, 'object');
    t.deepEqual(result1, { "north": 51,"west": 98,"south": 49,"east": 102 });

    t.equal(typeof result2, 'object');
    t.deepEqual(result2, { "north": 51,"west": -102,"south": 49,"east": -98 });

    t.equal(typeof result3, 'object');
    t.deepEqual(result3, { "north": -49,"west": 98,"south": -51,"east": 102 });

    t.equal(typeof result4, 'object');
    t.deepEqual(result4, { "north": -49,"west": -102,"south": -51,"east": -98 });
});

test('getNormalizeAreaCoordinates with 3 arguments should use defaultArea', function(t) {
    t.plan(2);

    var result = globi.getNormalizeAreaCoordinates(23, 42, -5);
    t.equal(typeof result, 'object');
    t.deepEqual(result, globi.getNormalizeAreaCoordinates());
});

test('getNormalizeAreaCoordinates with 4 arguments should only take ordering into account', function(t) {
    t.plan(4);

    var result1 = globi.getNormalizeAreaCoordinates(-20, 10, 20, -10);
    var result2 = globi.getNormalizeAreaCoordinates(-20, 10, 20, -10);

    t.equal(typeof result1, 'object');
    t.deepEqual(result1, { "north": 10,"west": -20,"south": -10,"east": 20 });


    t.equal(typeof result2, 'object');
    t.deepEqual(result2, { "north": 10,"west": -20,"south": -10,"east": 20 });
});

test('getNormalizeAreaCoordinates with 5 or more argument should use defaultArea', function(t) {
    t.plan(2);

    var result = globi.getNormalizeAreaCoordinates(1, 2, 3, 4, 5);
    t.equal(typeof result, 'object');
    t.deepEqual(result, globi.getNormalizeAreaCoordinates());
});