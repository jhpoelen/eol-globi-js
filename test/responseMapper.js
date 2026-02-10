var globi = require('../index.js');
var test = require('tape');

const arrayMock = [
    { 'column_one': 23, 'column_two': 42, 'column_three': 5 },
    { 'column_one': 7, 'column_two': null, 'column_three': 'foo' }
];

const objectMock = {
    columns: ['column_one', 'column_two', 'column_three'],
    data: [
        [23, 42, 5],
        [7, null, 'foo']
    ]
};

test('ResponseMapper: no Arguments should return the whole data set for array', function(t) {
    t.plan(1);

    var arrayResult = globi.ResponseMapper(arrayMock);
    t.looseEquals(arrayResult(), arrayMock);
});

test('ResponseMapper: no Arguments should return the whole data set for object', function(t) {
    t.plan(8);

    var objectResult = globi.ResponseMapper(objectMock);
    t.equals(objectResult().length, 2);
    t.equals(arrayMock.length, 2);
    t.equals(objectResult(0).column_one, arrayMock[0].column_one);
    t.equals(objectResult(0).column_two, arrayMock[0].column_two);
    t.equals(objectResult(0).column_three, arrayMock[0].column_three);
    t.equals(objectResult(1).column_one, arrayMock[1].column_one);
    t.equals(objectResult(1).column_two, arrayMock[1].column_two);
    t.equals(objectResult(1).column_three, arrayMock[1].column_three);
});

test('ResponseMapper: row argument should return data set row from needed row for array', function(t) {
    t.plan(1);

    var arrayResult = globi.ResponseMapper(arrayMock);
    t.looseEquals(arrayResult(2), arrayMock[2]);
});

test('ResponseMapper: row argument should return data set row from needed row for object', function(t) {
    t.plan(1);

    var objectResult = globi.ResponseMapper(objectMock);
    t.looseEquals(objectResult(2), arrayMock[2]);
});
