var d3 = require('d3');
var globiData = require('globi-data');
var EventEmitter = require('events').EventEmitter;


var globi = {};
globi.d3 = d3;
globi.globiData = globiData;

// comments from code workshop 1 Aug 2013
// substack - bin-fields to use app /utils
// matt - document function with comments
// jack - introduce auto-complete, provide feedbackafter submit a search, fuzzy search
// ryan - top 5 searches
// bemson - drop-down
// matt - provide example in readme.md 
// substack - populate full data in server replies to reduce round trips

globi.addTaxonInfo = function (scientificName, id, onClickScientificCallback) {
    var imageCallback = function (error, json) {
        if (!error) {
            if (json.thumbnailURL) {
                var imgId = d3.select(id)
                    .append("span")

                var table = imgId.append("table");


                if (json.commonName && json.scientificName && json.infoURL) {
                    var img = table.append("tr").append("td")
                        .append("img")
                        .attr("src", json.thumbnailURL);

                    if (onClickScientificCallback) {
                        img
                            .on("click", function (d) {
                                onClickScientificCallback(json.scientificName);
                            });
                    }

                    table.append("tr").append("td")
                        .text(json.commonName)
                        .append("a")
                        .attr("href", json.infoURL)
                        .attr("target", "_blank")
                        .text(" >");

                    var scientificNameCell = table.append("tr").append("td");
                    scientificNameCell.html("<i>" + json.scientificName + "</i>");
                }
            }
        }
    };
    globiData.findTaxonInfo(scientificName, imageCallback);
};

globi.viewInteractions = function (id, interactionType, sourceTaxonScientificName, interactionDescription, onClickScientificName) {


    var renderInteractions = function (error, json) {
        if (!error) {
            var htmlText = "<b>" + interactionDescription + "</b>";
            if (json && json.length == 0) {
                htmlText += " <b> nothing</b>";
            }
            d3.select(id).html(htmlText);

            for (var i = 0; json && i < json.length; i++) {
                globi.addTaxonInfo(json[i].target.name, id, onClickScientificName);
            }
        }
    };
    var search = {"sourceTaxonScientificName": sourceTaxonScientificName, "interactionType": interactionType};
    globiData.findSpeciesInteractions(search, renderInteractions);
};

var matchAgainstTaxonomy = function (node) {
    return node.path && "no:match" != node.path;
}

var indexForNode = function (node) {
    return node.path + "_" + node.name;
};

var classnameForNode = function (node) {
    return node.name.replace(' ', '_');
};

var parse = function (response, interactions, nodes) {
    for (var i = response.length - 1; i >= 0; i--) {
        var inter = response[i];
        if (matchAgainstTaxonomy(inter.source)
            && matchAgainstTaxonomy(inter.target)) {
            var source = inter.source.name;

            var sourceIndex = indexForNode(inter.source);
            nodes[sourceIndex] = {"name": source, "id": inter.source.id, "path": inter.source.path};

            var target = inter.target.name;
            var targetIndex = indexForNode(inter.target);
            nodes[targetIndex] = {"name": target, "id": inter.target.id, "path": inter.target.path};

            var type = inter.interaction_type;
            var interactionIndex = source + '-' + type + '-' + target;
            interactions[interactionIndex] = {'source': nodes[sourceIndex], 'type': type, 'target': nodes[targetIndex]};
        }
    }
};

var taxonColorMap = [];
taxonColorMap.Arthropoda = 'red';
taxonColorMap.Mammalia = 'lightblue';
taxonColorMap.Aves = 'brown';
taxonColorMap.Actinopterygii = 'blue';
taxonColorMap.Arachnida = 'pink';
taxonColorMap.Mollusca = 'orange';
taxonColorMap.Plantae = 'green';
taxonColorMap.Amphibia = 'violet';
taxonColorMap.Reptilia = 'yellow';
taxonColorMap.Bacteria = 'magenta';
taxonColorMap.other = 'gray';

var addLegend = function (legendDiv, colorMap, width, height) {
    var taxonRankColors = [];
    var i = 1;
    for (var taxon_rank in colorMap) {
        if (colorMap.hasOwnProperty(taxon_rank)) {
            taxonRankColors.push({"rank": taxon_rank, "color": colorMap[taxon_rank], "id": i });
            i++;
        }
    }

    var legend = d3.select(legendDiv).append("svg")
        .attr("width", width / 5)
        .attr("height", height);

    var radius = height / taxonRankColors.length / 4;
    var yOffset = (height - 2 * radius * taxonRankColors.length) / taxonRankColors.length / 2;
    var xOffset = width / 20;

    legend.selectAll('circle')
        .data(taxonRankColors)
        .enter()
        .append('circle')
        .attr("style", function (d) {
            return "fill:" + d.color;
        })
        .attr("cx", function (d) {
            return xOffset + radius;
        })
        .attr("cy", function (d) {
            return height / 50 + radius + d.id * (yOffset + (radius * 2));
        })
        .attr("r", function (d) {
            return radius;
        });

    legend.selectAll('text')
        .data(taxonRankColors)
        .enter()
        .append('text')
        .text(function (d) {
            return d.rank;
        })
        .style("font-size", function (d) {
            return height / 30 + "px";
        })
        .attr("x", function (d) {
            return xOffset * 1.4 + radius;
        })
        .attr("y", function (d) {
            return 1.2 * height / 50 + radius + d.id * (yOffset + (radius * 2));
        });

}

var pathColor = function (d) {
    var color = taxonColorMap['other'];
    for (var taxonRank in taxonColorMap) {
        if (taxonColorMap.hasOwnProperty(taxonRank)) {
            if (d.path && d.path.match(taxonRank)) {
                color = taxonColorMap[taxonRank];
                break;
            }
        }
    }
    return color;
};

var nodeStyle = function (d) {
    return "fill: " + pathColor(d) + "; stroke: blue; opacity: 0.5;";
};

var nodeStyleActive = function (d) {
    return "fill: " + pathColor(d) + "; stroke: blue; opacity: 1.0;";
};


var lineStyle = function (d) {
    return "stroke:" + (d.type == 'ATE' ? "lightgreen" : "pink") + "; fill:none; opacity:0.1;";
};

var lineStyleActive = function (d) {
    return "stroke:" + (d.type == 'ATE' ? "green" : "red") + "; fill:none; opacity:0.9;";
};


var activateTaxonNodesAndLinks = function (svg, d, interactionDirection) {
    svg.selectAll("." + interactionDirection.start + "." + classnameForNode(d))
        .attr("style", nodeStyleActive);
    svg.selectAll(".link." + interactionDirection.start + "-" + classnameForNode(d))
        .attr("style", lineStyleActive);

    var linkArray = svg.selectAll(".link." + interactionDirection.start + "-" + classnameForNode(d)).data();

    var targetNames = '';
    if (linkArray.length > 1) {
        targetNames = linkArray[0][interactionDirection.finish].name;
    }
    for (var i = 1; i < linkArray.length; i++) {
        targetNames += ", ";
        targetNames += linkArray[i][interactionDirection.finish].name;
    }

    d3.selectAll("#" + interactionDirection.finish + "-names").append("span").text(targetNames);
    d3.selectAll("#" + interactionDirection.start + "-names").append("span").text(d.name);
};

var addSourceTaxonNodes = function (svg, nodeArray) {
    svg.selectAll('.source')
        .data(nodeArray)
        .enter()
        .append("circle")
        .attr("class", function (d) {
            return "source " + classnameForNode(d);
        })
        .attr("style", nodeStyle)
        .attr("cx", function (d) {
            return d.x;
        })
        .attr("cy", function (d) {
            return d.y1;
        })
        .attr("r", function (d) {
            return d.radius;
        })
        .on("mouseover", function (d) {
            activateTaxonNodesAndLinks(svg, d, {"start": "source", "finish": "target"});
            return d.name;
        })
        .on("mouseout", function (d) {
            svg.selectAll(".source." + classnameForNode(d)).attr("style", nodeStyle);
            svg.selectAll(".link.source-" + classnameForNode(d)).attr("style", lineStyle);
            d3.selectAll("#source-taxon").selectAll("span").remove();
            d3.selectAll("#source-names").selectAll("span").remove();
            d3.selectAll("#target-names").selectAll("span").remove();
            return d.name;
        });
};

var addTargetTaxonNodes = function (svg, nodeArray, colorMap) {
    svg.selectAll('.target')
        .data(nodeArray)
        .enter()
        .append("circle")
        .attr("class", function (d) {
            return "target " + classnameForNode(d);
        })
        .attr("style", nodeStyle)
        .attr("cx", function (d) {
            return d.x;
        })
        .attr("cy", function (d) {
            return d.y2;
        })
        .attr("r", function (d) {
            return d.radius;
        })
        .on("mouseover", function (d) {
            activateTaxonNodesAndLinks(svg, d, {"start": "target", "finish": "source"});
            return d.name;
        })
        .on("mouseout", function (d) {
            svg.selectAll(".target." + classnameForNode(d)).attr("style", nodeStyle);
            svg.selectAll(".link.target-" + classnameForNode(d)).attr("style", lineStyle);
            d3.selectAll("#target-taxon").selectAll("span").remove();
            d3.selectAll("#target-names").selectAll("span").remove();
            d3.selectAll("#source-names").selectAll("span").remove();
            return d.name;
        });
};

var addInteraction = function (svg, interactionArray) {
    svg.selectAll(".link")
        .data(interactionArray)
        .enter()
        .append("path")
        .attr("class", function (d) {
            return "link " + "source-" + classnameForNode(d.source) + " target-" + classnameForNode(d.target);
        })
        .attr("style", lineStyle)
        .attr('d', function (d) {
            return "M" + d.source.x + " " + d.source.y1 + " L" + d.target.x + " " + d.target.y2;
        });
};


globi.addInteractionGraph = function (options) {
    var ee = new EventEmitter();

    var legendDiv = document.createElement('div');
    legendDiv.setAttribute('class', 'globi-interaction-graph-legend');
    addLegend(legendDiv, taxonColorMap, options.width, options.height);

    var graphDiv = document.createElement('div');
    graphDiv.setAttribute('class', 'globi-interaction-graph');

    var svg = d3.select(graphDiv).append('svg')
        .attr('width', options.width)
        .attr('height', options.height);


    var callback = function (error, response) {
        if (!error) {

            var interactions = {};
            var nodes = {};

            parse(response, interactions, nodes);

            var nodeKeys = [];

            var number_of_nodes = 0;
            for (var node_key in nodes) {
                number_of_nodes++;
                nodeKeys.push(node_key);
            }

            nodeKeys.sort();

            var i = 0;

            var taxonNodes = [];
            for (var nodeKey in nodeKeys) {
                var key = nodeKeys[nodeKey];
                var widthPerNode = options.width / (number_of_nodes + 1);
                nodes[key].x = widthPerNode + i * widthPerNode;
                /**
                 * @gb: Added a second ordinate to fix y-scale problem
                 * * Additionally this speeds up rendering because we don't need Bezier ploting in #addIteraction anymore
                 */
                nodes[key].y1 = widthPerNode;
                nodes[key].y2 = options.height - widthPerNode;
                nodes[key].radius = widthPerNode;
                nodes[key].color = "pink";
                taxonNodes.push(nodes[key]);
                i = i + 1;
            }

            var interactionsArray = [];
            for (var key in interactions) {
                interactions[key].source = nodes[indexForNode(interactions[key].source)];
                interactions[key].target = nodes[indexForNode(interactions[key].target)];
                interactionsArray.push(interactions[key]);
            }

            addSourceTaxonNodes(svg, taxonNodes);
            addTargetTaxonNodes(svg, taxonNodes, taxonColorMap);
            addInteraction(svg, interactionsArray);
        }
        ee.emit('ready');
    };

    var search = {"location": options.location}
    globiData.findSpeciesInteractions(search, callback);

    ee.appendGraphTo = function (target) {
        target.appendChild(graphDiv);
    };
    ee.appendLegendTo = function(target) {
        target.appendChild(legendDiv);
    }
    return ee;
};

module.exports = globi;



