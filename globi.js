var d3 = require("d3");

var globi = {};
globi.d3 = d3;

var url_prefix = "http://trophicgraph.com:8080";

globi.add_taxon_info = function(scientific_name, div_id, on_click_scientific_name_callback) {
	img_callback = function(error, json) {
		if (!error) {
			if (json.thumbnailURL) {
				img_div = d3.select(div_id)
				.append("span")

				var table = img_div.append("table");

				
				if (json.commonName && json.scientificName && json.infoURL) {
					var img = table.append("tr").append("td")
					.append("img")
					.attr("src", json.thumbnailURL);	

					if (on_click_scientific_name_callback) {
						img
						.on("click", function(d) {
							on_click_scientific_name_callback(json.scientificName);
						});
					}

					table.append("tr").append("td")
					.text(json.commonName)
					.append("a")
					.attr("href", json.infoURL)
					.attr("target", "_blank")
					.text(" >");
					

					var scientific_name_td = table.append("tr").append("td")
					scientific_name_td.html("<i>" + json.scientificName + "</i>");
				}	
			} 
		} 
	};
	d3.json(url_for_taxon_image_query(scientific_name), img_callback);
};

globi.url_for_taxon_interaction_query = function (source_taxon_name, interaction_type, target_taxon_name) {
	var uri = url_prefix + "/taxon/" + encodeURIComponent(source_taxon_name) + "/" + interaction_type;
	if (target_taxon_name) {
		uri = uri + "/" + target_taxon_name;
	}
	return uri + '?type=json.v2';
};

globi.url_for_taxon_image_query = function(taxon_name) {
	return url_prefix + "/imagesForName/" + encodeURIComponent(scientific_name);
};

globi.view_interactions = function(div_id, interaction_type, source_target_name, interaction_description, on_click_scientific_name_callback) {
	var uri = url_for_taxon_interaction_query(source_target_name, interaction_type);

	d3.json(uri, function(error, json) {
		if (!error) {
			var html_text = "<b>" + interaction_description + "</b>";
			if (json && json.length == 0) {
				html_text += " <b> nothing</b>";
			}
			d3.select(div_id).html(html_text);

			for (var i = 0; json && i < json.length; i++) {
				globi.add_taxon_info(json[i].target.name, div_id, on_click_scientific_name_callback);
			};				
		}
	});
};

var matched_against_taxonomy = function(node) {
	return node.path && "no:match" != node.path;
}

var index_for_node = function(node) {
	return node.path + "_" + node.name;
};

var classname_for_node = function(node) {
	return node.name.replace(' ', '_');
};

var parse = function(response, interactions, nodes) {
	for (var i = response.length - 1; i >= 0; i--) {
		var inter = response[i];
		if (matched_against_taxonomy(inter.source) 
			&& matched_against_taxonomy(inter.target)) {

			var source = inter.source.name;

		var source_index = index_for_node(inter.source);
		nodes[source_index] = {"name": source, "id": inter.source.id, "path": inter.source.path};

		var target = inter.target.name;
		var target_index = index_for_node(inter.target);
		nodes[target_index]= {"name":target,"id":inter.target.id, "path":inter.target.path};

		var type = inter.interaction_type;
		var interact_id = source + '-' + type + '-' + target;
		interactions[interact_id] = {'source':nodes[source_index],'type':type,'target':nodes[target_index]};
	}					
}
};

var taxon_color_map = function() {
	var color_map = [];
	color_map['Arthropoda'] = 'red';
	color_map['Mammalia'] = 'lightblue';
	color_map['Aves'] = 'brown';
	color_map['Actinopterygii'] = 'blue';
	color_map['Arachnida'] = 'pink';
	color_map['Mollusca'] = 'orange';
	color_map['Plantae'] = 'green';
	color_map['Amphibia'] = 'violet';
	color_map['Reptilia'] = 'yellow';
	color_map['Bacteria'] = 'magenta';
	color_map['other'] = 'gray';
	return color_map;
};

var add_legend = function(legend_id, color_map, width, height) {
	var taxon_rank_colors = [];
	var i = 1;
	for (var taxon_rank in color_map) {
		taxon_rank_colors.push({"rank": taxon_rank, "color": color_map[taxon_rank], "id": i });
		i++;
	}
	
	var legend = d3.select("#" + legend_id).append("svg")
	.attr("width", width / 5)
	.attr("height", height);

	var radius = height / taxon_rank_colors.length / 4;
	var y_offset = (height - 2 * radius * taxon_rank_colors.length) / taxon_rank_colors.length / 2;
	var x_offset = width / 20;

	legend.selectAll('circle')
	.data(taxon_rank_colors)
	.enter()
	.append('circle')
	.attr("style", function(d) { return "fill:" + d.color; })
	.attr("cx", function(d) { return x_offset + radius; })
	.attr("cy", function(d) { return height/50 + radius + d.id * (y_offset + (radius * 2)); })
	.attr("r", function(d) { return radius; });

	legend.selectAll('text')
	.data(taxon_rank_colors)
	.enter()
	.append('text')
	.text(function(d) { return d.rank; })
	.style("font-size", function(d) { return height/30 + "px"; })
	.attr("x", function(d) { return x_offset * 1.4 + radius; })
	.attr("y", function(d) { return 1.2*height/50 + radius + d.id * (y_offset + (radius * 2)); });

}

var location_query = function(location) {
	var location_query = "";
	for (elem in location) {
		location_query += elem + "=" + location[elem] + "&";
	}
	return location_query;
}

var path_color = function(d) {
	color_map = taxon_color_map();
	var color = color_map['other'];
	for (var taxon_rank in color_map) {
		if (d.path && d.path.contains(taxon_rank)) {
			color = color_map[taxon_rank];
			break;
		}	
	}
	return color;
};

var node_style = function(d) {
	return "fill: " + path_color(d) + "; stroke: blue; opacity: 0.5;";
};

var line_style = function(d) { return "stroke:" + (d.type == 'ATE' ? "lightgreen" : "pink") + "; fill:none; opacity:0.1;"; };

var line_style_active = function(d) { return "stroke:" + (d.type == 'ATE' ? "green" : "red") + "; fill:none; opacity:0.9;"; };


var activate_taxa_and_links = function(svg, d, inter_dir) {
	svg.selectAll("." + inter_dir.start + "." + classname_for_node(d)).attr("style", "fill: red; stroke: blue; opacity: 1.0;"); 
	svg.selectAll(".link." + inter_dir.start + "-" + classname_for_node(d)).attr("style", line_style_active); 
	link_array = svg.selectAll(".link." + inter_dir.start + "-" + classname_for_node(d)).data();
	var target_names = '';
	if (link_array.length > 1) {
		target_names = link_array[0][inter_dir.finish].name;
	}
	for (i=1; i < link_array.length; i++) {
		target_names += ", ";
		target_names += link_array[i][inter_dir.finish].name;
	}
	svg.selectAll("#" + inter_dir.finish + "-names").append("span").text(target_names);
	svg.selectAll("#" + inter_dir.start + "-names").append("span").text(d.name);	
};

var add_source_taxa = function(svg, node_array, color_map) {
	var source_circle = svg.selectAll('.source')
	.data(node_array)
	.enter()
	.append("circle")
	.attr("class", function(d) { return "source " + classname_for_node(d); })
	.attr("style", node_style)
	.attr("cx", function(d) { return d.x; })
	.attr("cy", function(d) { return d.y; })
	.attr("r", function(d) { return d.radius; })
	.on("mouseover", function(d) { 
		activate_taxa_and_links(svg, d, {"start":"source","finish":"target"});
		return d.name; 
	})
	.on("mouseout", function(d) { 
		d3.selectAll(".source." + classname_for_node(d)).attr("style", node_style); 
		d3.selectAll(".link.source-" + classname_for_node(d)).attr("style", line_style); 
		d3.selectAll("#source-taxon").selectAll("span").remove();
		d3.selectAll("#source-names").selectAll("span").remove();	
		d3.selectAll("#target-names").selectAll("span").remove();	
		return d.name; 
	});	
};

var add_target_taxa = function(svg, node_array, color_map, height) {
	var target_circle = svg.selectAll('.target')
	.data(node_array)
	.enter()
	.append("circle")
	.attr("class", function(d) { return "target " + classname_for_node(d); })
	.attr("style", node_style)
	.attr("cx", function(d) { return d.x; })
	.attr("cy", function(d) {return d.y + height * 0.81; })
	.attr("r", function(d) { return d.radius; })
	.on("mouseover", function(d) { 
		activate_taxa_and_links(svg, d, {"start":"target","finish":"source"});
		return d.name; 
	})
	.on("mouseout", function(d) { 
		d3.selectAll(".target." + classname_for_node(d)).attr("style", node_style); 
		d3.selectAll(".link.target-" + classname_for_node(d)).attr("style", line_style); 
		d3.selectAll("#target-taxon").selectAll("span").remove();
		d3.selectAll("#target-names").selectAll("span").remove();	
		d3.selectAll("#source-names").selectAll("span").remove();	
		return d.name; 
	});
};

var add_interactions = function(svg, interactions_array) {
	svg.selectAll(".link")
	.data(interactions_array)
	.enter()
	.append("path")
	.attr("class", function(d) { 
		return "link " + "source-" + classname_for_node(d.source) + " target-" + classname_for_node(d.target); 
	} )
	.attr("style", line_style)
	.attr('d', function(d) { return "M" + d.source.x + " " + d.source.y + " Q" + d.source.x + " " + d.source.y  + " " + d.target.x + " " + d.target.y + 0.1; } );
};


globi.add_interaction_graph = function(location, div_ids, width, height) {
	var svg = d3.select("#" + div_ids.graph_id).append("svg")
	.attr("width", width)
	.attr("height", height);

	var color_map = taxon_color_map();

	add_legend(div_ids.legend_id, color_map, width, height);

	
	var json_local = true;
	var json_resource = json_local ? "interactions.json" : "http://trophicgraph.com:8080/interaction?type=json.v2&" + location_query(location);

	d3.json(json_resource, function(error, response) {
		if (!error) {

			var interactions = {};
			var nodes = {};

			parse(response, interactions, nodes);

			var node_array = [];

			var node_keys = [];

			var number_of_nodes = 0;
			for (var node_key in nodes) {
				number_of_nodes++; 
				node_keys.push(node_key);
			}

			node_keys.sort();

			var i = 0;
			for (var node_key in node_keys) {
				var key = node_keys[node_key];
				width_per_node = width / (number_of_nodes + 1);
				nodes[key].x = width_per_node + i * width_per_node;
				nodes[key].y = 45;
				nodes[key].radius = width_per_node;
				nodes[key].color = "pink";
				node_array.push(nodes[key]);
				i = i + 1;
			}

			interactions_array = [];
			for (var key in interactions) {
				interactions[key].source = nodes[index_for_node(interactions[key].source)];
				interactions[key].target = nodes[index_for_node(interactions[key].target)];
				interactions_array.push(interactions[key]);
			}

			add_source_taxa(svg, node_array, color_map);
			add_target_taxa(svg, node_array, color_map, height);
			add_interactions(svg, interactions_array);
		}
	});
};

module.exports = globi;



