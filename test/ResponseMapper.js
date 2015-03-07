var globi = require('../globi.js');
var test = require('tape');

var arrayMock = [
    { 'column_one': 23, 'column_two': 42, 'column_three': 5 },
    { 'column_one': 7, 'column_two': null, 'column_three': 'foo' }
];

var objectMock = {
    columns: ['column_one', 'column_two', 'column_three'],
    data: [
        [23, 42, 5],
        [7, null, 'foo']
    ]
};

test('ResponseMapper: no Arguments should return the whole data set', function(t) {
    t.plan(2);

    var arrayResult = globi.ResponseMapper(arrayMock);
    var objectResult = globi.ResponseMapper(objectMock);
    t.looseEquals(arrayResult(), arrayMock);
    t.looseEquals(objectResult(), arrayMock);
});

test('ResponseMapper: row argument should return data set row from needed row', function(t) {
    t.plan(2);

    var arrayResult = globi.ResponseMapper(arrayMock);
    var objectResult = globi.ResponseMapper(objectMock);
    t.looseEquals(arrayResult(2), arrayMock[2]);
    t.looseEquals(objectResult(2), arrayMock[2]);
});
