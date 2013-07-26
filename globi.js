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
	d3.json(url_prefix + "/imagesForName/" + encodeURIComponent(scientific_name), img_callback);
};

globi.view_interactions = function(div_id, interaction_type, source_target_name, interaction_description, on_click_scientific_name_callback) {
	var uri = url_prefix + "/taxon/" + encodeURIComponent(source_target_name) + "/" + interaction_type + "?type=json.v2";

	d3.json(uri, function(error, json) {
		if (!error) {
			var html_text = "<b>" + interaction_description + "</b>";
			if (json && json.length == 0) {
				html_text += " <b> nothing</b>";
			}
			d3.select(div_id).html(html_text);

			for (var i = 0; json && i < json.length; i++) {
				console.log(json[i]);
				globi.add_taxon_info(json[i].target.name, div_id, on_click_scientific_name_callback);
			};				
		}
	});
};

module.exports = globi;



