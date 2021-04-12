$(document).ready(function() {
	loadData();
	// $.getJSON( "data/uni_gender_ethnicity.jsonld", function(data) {
	// 	console.log(data);
	// })
});

///////////////////////////////////////////////////////////////////////////
////////////////////////////// Generate data //////////////////////////////
///////////////////////////////////////////////////////////////////////////
function loadData() {

    d3.queue()   // queue function loads all external data files asynchronously 
      .defer(d3.json, 'data/uni_gender_ethnicity.jsonld')  
      .await(processData);  

    function processData(error, json) {
    	if (error) throw error;
		var data = json;
		var newRegion1 = "EAST"
		var newRegion2 = "EAST"
		stackedBarChart(newRegion1, json);
		stackedBarChart2(newRegion2, json);
		var dropdown1 = d3.select(".uk_region_ddl_gender")
                .insert("select", "svg")
                .on("change", function() {
                	// Handler for dropdown value change (filter by regions)
                	newRegion1 = d3.select(this).property('value')
                	d3.select("#my_dataviz_gender svg").remove(); 
                	stackedBarChart(newRegion1, json)
                })
        dropdown1.selectAll("option")
                .data(["EAST", "EMID", "LOND", "NEAS", "NIRE", "NWES", "SCOT", "SEAS", "SWES", "WMID", "WALE", "YORH"])
              .enter().append("option")
                .attr("value", function (d) { return d })
                .text(function (d) { return d })
                .property("selected", function(d){ return d === newRegion1 })

        var dropdown2 = d3.select(".uk_region_ddl_ethnicity")
                .insert("select", "svg")
                .on("change", function() {
                	// Handler for dropdown value change (filter by regions)
                	newRegion2 = d3.select(this).property('value')
                	d3.select("#my_dataviz_ethnicity svg").remove(); 
                	stackedBarChart2(newRegion2, json)
                })
        dropdown2.selectAll("option")
                .data(["EAST", "EMID", "LOND", "NEAS", "NIRE", "NWES", "SCOT", "SEAS", "SWES", "WMID", "WALE", "YORH"])
              .enter().append("option")
                .attr("value", function (d) { return d })
                .text(function (d) { return d })
                .property("selected", function(d){ return d === newRegion2 })
	}
}

function hide (elements) {
  elements = elements.length ? elements : [elements];
  for (var index = 0; index < elements.length; index++) {
    elements[index].style.display = 'none';
  }
}

function show (elements, specifiedDisplay) {
  elements = elements.length ? elements : [elements];
  for (var index = 0; index < elements.length; index++) {
    elements[index].style.display = specifiedDisplay || 'block';
  }
}

function update(showpage, hidepage) {
	hide(document.getElementById(hidepage));
	show(document.getElementById(showpage));
}

function stackedBarChart(region, data) {
	// set the dimensions and margins of the graph
	var margin = {top: 50, right: 20, bottom: 230, left: 100},
	    width = 800 - margin.left - margin.right,
	    height = 500 - margin.top - margin.bottom;
	// append the svg object to the body of the page
	var svg = d3.select("#my_dataviz_gender")
				.append("svg")
					.attr("width", width + margin.left + margin.right)
				    .attr("height", height + margin.top + margin.bottom)
				    .attr("overflow", "visible")
				.append("g")
				    .attr("transform",
				          "translate(" + margin.left + "," + margin.top + ")");

	// Filter data from different region: EAST, EMID, LOND, NEAS
	var data = data["@graph"].filter(function(d) { return d["scovo:dimension"] == region;});
	// List of subgroups 
	//if (column == "gender") {
	var subgroups = ["Female", "Male", "Other"];
	// List of groups = species here = value of the first column called group -> I show them on the X axis	
	var groups = d3.map(data, function(d) { return(d["foaf:name"]) }).keys();
	var num_subgroups = data.map(function(obj) {
		var dObj = {};
		dObj["name"] = obj["foaf:name"];
		dObj["Female"] = obj["http://www.semanticweb.org/user/ontologies/2020/2/opendata-ontology.owl#Female"];
		dObj["Male"] = obj["http://www.semanticweb.org/user/ontologies/2020/2/opendata-ontology.owl#Male"];
		dObj["Other"] = obj["http://www.semanticweb.org/user/ontologies/2020/2/opendata-ontology.owl#Other"];
		dObj["total"] = parseInt(dObj["Female"])+parseInt(dObj["Male"])+parseInt(dObj["Other"]);
		return dObj;
	});
    //}
	// Add X axis
	var x = d3.scaleBand()
	      .domain(groups)
	      .range([0, width])
	      .padding([0.5])
	svg.append("g")
	   .attr("transform", "translate(0," + height + ")")
	   .call(d3.axisBottom(x).tickSizeOuter(0))
	   	.selectAll("text")  
     	.style("text-anchor", "end")
     	.attr("dx", "-.8em")
     	.attr("dy", ".15em")
     	.attr("transform", "rotate(-65)");

	// Add Y axis
	var y = d3.scaleLinear()
	    .domain([0, d3.max(num_subgroups, function(d) { return d.total; })])
	    .range([ height, 0 ]);
	svg.append("g")
	   .call(d3.axisLeft(y));
	// color palette = one color per subgroup
	var color = d3.scaleOrdinal()
	   .domain(subgroups)
	   .range(['#FF5959','#6490D3','#F58D0f'])
	//stack the data? --> stack per subgroup
	var stackedData = d3.stack()
	    .keys(subgroups)
	    (num_subgroups)
	// ----------------
	// Create a tooltip
	// ----------------
	var tooltip = d3.select("#my_dataviz_gender")
	    .append("div")
	    .style("opacity", 0)
	    .attr("class", "tooltip")
	    .style("background-color", "white")
	    .style("border", "solid")
	    .style("border-width", "1px")
	    .style("border-radius", "5px")
	    .style("padding", "10px")
	    .style("position", "absolute")

	// Three function that change the tooltip when user hover / move / leave a cell
	var mouseover = function(d) {
	    var subgroupName = d3.select(this.parentNode).datum().key;
	    var subgroupValue = d.data[subgroupName];
	    tooltip
	        .html("subgroup: " + subgroupName + "<br>" + "Value: " + subgroupValue)
	        .style("opacity", 1)
	    //     .style("left", d3.select(this).attr("x") + "px")     
  			// .style("top", d3.select(this).attr("y") + "px")
	}
	var mousemove = function(d) {
	    tooltip
	      .style("left", (d3.mouse(this)[0]+90) + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
	      .style("top", (d3.mouse(this)[1]) + "px")
	}
	var mouseleave = function(d) {
	    tooltip
	      .style("opacity", 0)
	}

	var u = svg.selectAll("rect")
	           .data(stackedData)
	// Show the bars
	svg.append("g")
	    .selectAll("g")
	    // Enter in the stack data = loop key per key = group per group
	    .data(stackedData)
	    .enter().append("g")
	      .attr("fill", function(d) { return color(d.key); })
	      .selectAll("rect")
	      // enter a second time = loop subgroup per subgroup to add all rectangles
	      .data(function(d) { return d; })
	      .enter().append("rect")
	      .merge(u) //get the already existing elements as well 0408
	      //.transition() //0408
	      //.duration(1000) //0408
	        .attr("x", function(d) { return x(d.data.name); })
	        .attr("y", function(d) { return y(d[1]); })
	        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
	        .attr("width",x.bandwidth())
	        .attr("stroke", "grey")
	      .on("mouseover", mouseover)
	      .on("mousemove", mousemove)
	      .on("mouseleave", mouseleave)
}

function stackedBarChart2(region, data) {
	// set the dimensions and margins of the graph
	var margin = {top: 50, right: 20, bottom: 230, left: 100},
	    width = 800 - margin.left - margin.right,
	    height = 500 - margin.top - margin.bottom;
	// append the svg object to the body of the page
	var svg = d3.select("#my_dataviz_ethnicity")
				.append("svg")
					.attr("width", width + margin.left + margin.right)
				    .attr("height", height + margin.top + margin.bottom)
				    .attr("overflow", "visible")
				.append("g")
				    .attr("transform",
				          "translate(" + margin.left + "," + margin.top + ")");

	// Filter data from different region: EAST, EMID, LOND, NEAS
	var data = data["@graph"].filter(function(d) { return d["scovo:dimension"] == region;});
	// List of subgroups 
	var subgroups = ["White", "Black", "Asian", "Mixed", "Not_known"];
	// List of groups = species here = value of the first column called group -> I show them on the X axis	
	var groups = d3.map(data, function(d) { return(d["foaf:name"]) }).keys();
	var num_subgroups = data.map(function(obj) {
		var dObj = {};
		dObj["name"] = obj["foaf:name"];
		dObj["White"] = obj["http://www.semanticweb.org/user/ontologies/2020/2/opendata-ontology.owl#White"];
		dObj["Black"] = obj["http://www.semanticweb.org/user/ontologies/2020/2/opendata-ontology.owl#Black"];
		dObj["Asian"] = obj["http://www.semanticweb.org/user/ontologies/2020/2/opendata-ontology.owl#Asian"];
		dObj["Mixed"] = obj["http://www.semanticweb.org/user/ontologies/2020/2/opendata-ontology.owl#Mixed"];
		dObj["Not_known"] = obj["http://www.semanticweb.org/user/ontologies/2020/2/opendata-ontology.owl#Not_known"];
		dObj["total"] = parseInt(dObj["White"])+parseInt(dObj["Black"])+parseInt(dObj["Asian"])+parseInt(dObj["Mixed"])+parseInt(dObj["Not_known"]);
		return dObj;
	});
    //}
	// Add X axis
	var x = d3.scaleBand()
	      .domain(groups)
	      .range([0, width])
	      .padding([0.5])
	svg.append("g")
	   .attr("transform", "translate(0," + height + ")")
	   .call(d3.axisBottom(x).tickSizeOuter(0))
	   	.selectAll("text")  
     	.style("text-anchor", "end")
     	.attr("dx", "-.8em")
     	.attr("dy", ".15em")
     	.attr("transform", "rotate(-65)");

	// Add Y axis
	var y = d3.scaleLinear()
	    .domain([0, d3.max(num_subgroups, function(d) { return d.total; })])
	    .range([ height, 0 ]);
	svg.append("g")
	   .call(d3.axisLeft(y));
	// color palette = one color per subgroup
	var color = d3.scaleOrdinal()
			   .domain(subgroups)
			   .range(['#FFA07A','#A52A2A','#FF8C00', '#87CEFA', '#D3D3D3'])
	//stack the data? --> stack per subgroup
	var stackedData = d3.stack()
	    .keys(subgroups)
	    (num_subgroups)
	// ----------------
	// Create a tooltip
	// ----------------
	var tooltip = d3.select("#my_dataviz_ethnicity")
	    .append("div")
	    .style("opacity", 0)
	    .attr("class", "tooltip")
	    .style("background-color", "white")
	    .style("border", "solid")
	    .style("border-width", "1px")
	    .style("border-radius", "5px")
	    .style("padding", "10px")
	    .style("position", "absolute")

	// Three function that change the tooltip when user hover / move / leave a cell
	var mouseover = function(d) {
	    var subgroupName = d3.select(this.parentNode).datum().key;
	    var subgroupValue = d.data[subgroupName];
	    tooltip
	        .html("subgroup: " + subgroupName + "<br>" + "Value: " + subgroupValue)
	        .style("opacity", 1)
	    //     .style("left", d3.select(this).attr("x") + "px")     
  			// .style("top", d3.select(this).attr("y") + "px")
	}
	var mousemove = function(d) {
	    tooltip
	      .style("left", (d3.mouse(this)[0]+90) + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
	      .style("top", (d3.mouse(this)[1]) + "px")
	}
	var mouseleave = function(d) {
	    tooltip
	      .style("opacity", 0)
	}

	var u = svg.selectAll("rect")
	           .data(stackedData)
	// Show the bars
	svg.append("g")
	    .selectAll("g")
	    // Enter in the stack data = loop key per key = group per group
	    .data(stackedData)
	    .enter().append("g")
	      .attr("fill", function(d) { return color(d.key); })
	      .selectAll("rect")
	      // enter a second time = loop subgroup per subgroup to add all rectangles
	      .data(function(d) { return d; })
	      .enter().append("rect")
	      .merge(u) //get the already existing elements as well 0408
	      //.transition() //0408
	      //.duration(1000) //0408
	        .attr("x", function(d) { return x(d.data.name); })
	        .attr("y", function(d) { return y(d[1]); })
	        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
	        .attr("width",x.bandwidth())
	        .attr("stroke", "grey")
	      .on("mouseover", mouseover)
	      .on("mousemove", mousemove)
	      .on("mouseleave", mouseleave)
}