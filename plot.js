
// Dimensions and layout. Native dimensions of brain map are 587h x 447w
brain_h = 587;
brain_w = 447;
bar_h = 700;
bar_w = 400; // Distance from minimum to maximum bar plot value
brain_bar_space = 125; // Distance between minimum bar plot value and brain edge
width = brain_w + bar_w + brain_bar_space; // usable width of plot
height = d3.max([brain_h, bar_h]);
bar_padding = .1;
barPlot_areaLabel_textSize = 12;
barPlot_highlightColor = [230, 230, 230];
defaultTransitionDuration = 750;
defaultTransitionDelay = 10;
// bar_xOffset = brain_w+brain_bar_space;

var plots_div = d3.selectAll("body")
  .append("div")
  .attr("id", "plots")
  .attr("align", "center")
  .style("border-style", "hidden");

var brainSVGNode ;

// Load svg
d3.xml("FlatBrainLateralMedial_2.svg", function(error, documentFragment) {
  if (error) {console.log(error); return;}
  // Load data for findings from each area
  d3.csv("WM_AreaFindings_2.csv",function(resultsByAreaRaw){
    window.resultsByAreaRaw = resultsByAreaRaw;
    window.resultsByArea = Array() ;
    resultsByAreaRaw.map(function(row){
      newRow = Object() ;
      newRow.area = row.area ;
      newRow.n_positive_findings = parse_CSV_finding_string(row.positive_finding).length ;
      newRow.n_negative_findings = parse_CSV_finding_string(row.negative_finding).length ;
      resultsByArea.push(newRow) ;
    }) ;


    //Assign svg node to variable
    brainSVGNode = documentFragment
    .getElementsByTagName("svg")[0];
    brainSVGNode.id = "brain_map";
    // Append svg node to plots_div
    plots_div.node().appendChild(brainSVGNode);
    // Assign selected brain map svg to variable
    window.brainMapSVG = plots_div.select("#brain_map") ;
    // Center brain map svg
    brainMapSVG.style("vertical-align",(bar_h-brain_h)/2+"px");
    // Add top padding
    // brainMapSVG.attr("transform","translate(0,"+padding_top+")");
    // // Original dimensions
    // brain_baseline_h = brainSVGNode.height.baseVal.value;
    // brain_baseline_w = brainSVGNode.width.baseVal.value;

    //b.split(',').map(e => parseInt(e))

    // Array of area names from SVG
    window.svgAreaNames = Array() ;
    brainMapSVG.selectAll("g").each( function(d, i){
      svgAreaNames[i] = d3.select(this).attr("id").split(/_(.+)/)[1].replace("_"," ");
    }) ;

    window.barPlot = d3.select("#plots")
          .append("svg")
          .attr("id","barplots")
          .attr("width", bar_w + brain_bar_space)
          .attr("height", bar_h);

    //Scales for y and x data (this is going to be a vertically-oriented bar
    // plot, so independent variable will be on the x-axis)
    window.yScale = d3.scaleBand()
    .domain(d3.range(resultsByArea.length))
    .rangeRound([0, bar_h])
    .padding([bar_padding]);

    // Maximum number of positive and negative findings
    var max_n_pos_findings = d3.max(resultsByArea,
      function(d){return d.n_positive_findings;});
    var max_n_neg_findings = d3.max(resultsByArea,
      function(d){return d.n_negative_findings;});

    window.xScale = d3.scaleLinear()
    .domain([0,max_n_pos_findings + max_n_neg_findings])
    .rangeRound([0, bar_w]);

    x_offset_positive_findings = xScale(max_n_neg_findings);

    // Draw invisible bars that will sit behind each row of the results bar
    // plot, which will then be turned visible upon mouseover of the
    // corresponding area
    barPlot_highlight_group = barPlot.append("g")
    .attr("id","barPlot_highlight");
    barPlot_highlight_group.selectAll("rect")
    .data(resultsByArea)
    .enter()
    .append("rect")
    .attr("x",0)
    .attr("y", function(area,i){
      return yScale(i);
    })
    .attr("height", yScale.bandwidth())
    .attr("width", bar_w+brain_bar_space)
    .attr("class", function(area){
      return "barPlot_highlight area_"+ area.area.toLowerCase()
    });

    // Create positive result bar plot
    barPlot_positive_group = barPlot.append("g")
    .attr("id","barPlot_positive_group");
    // Start with all bars having 0 x value, then update with true value for
    // dope animation
    barPlot_positive_group.selectAll("rect")
    .data(resultsByArea, function(area){
      return area.area;
    })
    .enter()
    .append("rect")
    .attr("x", brain_bar_space + x_offset_positive_findings)
    .attr("y", function(area,i) {
      return yScale(i);
    })
    .attr("height", yScale.bandwidth())
    .attr("fill", function(d) {
        return "red";
    });

    // Update values
    barPlot_positive_group.selectAll("rect")
    .data(resultsByArea, function(area){
      return area.area;
    })
    .transition()
    .duration(defaultTransitionDuration)
    .delay(function(d,i){return i * defaultTransitionDelay})
    .attr("width", function(d) {
      return xScale(d.n_positive_findings);
    })


    //Create negative results bar plot
    barPlot_negative_group = barPlot.append("g")
    .attr("id","barPlot_negative_group");
    barPlot_negative_group.selectAll("rect")
    .data(resultsByArea, function(area){
      return area.area;
    })
    .enter()
    .append("rect")
    .attr("x", brain_bar_space + x_offset_positive_findings)
    .attr("y", function(area,i) {
      return yScale(i);
    })
    .attr("height", yScale.bandwidth())
    .attr("fill", function(d) {
        return "rgb(0,176,240)";
    });

    barPlot_negative_group.selectAll("rect")
    .data(resultsByArea, function(area){
      return area.area;
    })
    .transition()
    .duration(defaultTransitionDuration)
    .delay(function(d,i){return i * defaultTransitionDelay})
    .attr("x", function(area){
      return brain_bar_space + x_offset_positive_findings -
        xScale(area.n_negative_findings);
    })
    .attr("width", function(d) {
      return xScale(d.n_negative_findings);
    });


    // .transition()
    // .duration(defaultTransitionDuration)
    // .attr("x", function(area){
    //   return brain_bar_space + x_offset_positive_findings -
    //     xScale(area.n_negative_findings);
    // })
    // .attr("y", function(area,i) {
    //   return yScale(i);
    // })
    // .attr("height", yScale.bandwidth())
    // .attr("width", function(d) {
    //   return xScale(d.n_negative_findings);
    // })
    // .attr("fill", function(d) {
    // 		return "rgb(0,176,240)";
    // });

    //"tick" lines from bar label to bar
    bar_label_lines = barPlot.append("g")
      .attr("id","bar_label_lines");
    bar_label_lines.selectAll("line")
      .data(resultsByArea, function(area){
        return area.area;
      })
      .enter()
      .append("line")
      .attr("x1",brain_bar_space)
      .attr("x2",brain_bar_space)
      .attr("y1",function(area,i) {
        return yScale(i) + yScale.bandwidth()/2;
      })
      .attr("y2",function(area,i) {
        return yScale(i) + yScale.bandwidth()/2;
      })
      .attr("stroke-width",1)
      .attr("stroke","rgb(198,198,198)");

      bar_label_lines.selectAll("line")
        .data(resultsByArea, function(area){
          return area.area;
      })
      .transition()
      .duration(defaultTransitionDuration)
      .delay(function(d,i){return i * defaultTransitionDelay})
      .attr("x2",function(area){
        return brain_bar_space + x_offset_positive_findings -
          xScale(area.n_negative_findings);
      });

    //"Bar labels"
    bar_labels_text = barPlot.append("g")
      .attr("id","bar_labels");
    bar_labels_text.selectAll("text")
      .data(resultsByArea, function(area){
        return area.area;
      })
      .enter()
      .append("text")
      .text(function(area){
        return area.area;
      })
      .attr("x",brain_bar_space - 3)
      .attr("y", function(area,i) {
        return yScale(i) + yScale.bandwidth()/2;
      })
      .attr("font-size",barPlot_areaLabel_textSize)
      .attr("text-anchor","end")
      .attr("alignment-baseline","central")

    /*
    Code for d3 version 3
    window.yScale = d3.scale.ordinal()
    .domain(d3.range(resultsByArea.length))
    .rangeRoundBands([0, bar_h]);

    window.xScale = d3.scale.linear()
    .domain([-1.*d3.max(resultsByArea, function(d) { return d.n_negative_findings; }),
    d3.max(resultsByArea, function(d) { return d.n_positive_findings; })])
    .range([0, bar_w]);
    */

    // Change color of area on mouseover and display name of area. Area might be represented in multiple
    // polygons within a single group, thus behavior should be applied to all
    // group
    // <p> that will display area name
    var current_mouseover_highlight = Object() ;
    areaID_display_p = d3.select("body").append("p").attr("align","center") ;
    brainMapSVG.selectAll("g") // Select all groups (areas)
    .selectAll("polygon")
    .on("mouseover", function() {
      // Parent node [ie group] of current polygon
      currentParentNode = d3.select(this).node().parentNode ;
      // Select all polygons in current group and apply fill change
      d3.select(currentParentNode)
      .selectAll("polygon")
      .attr("fill","blue") ;

      mouseover_area_name = currentParentNode.getAttribute("id")
        .split(/_(.+)/)[1]
        .replace("_"," ");

      current_mouseover_highlight = d3.selectAll(".barPlot_highlight")
        .filter(".area_"+mouseover_area_name.toLowerCase())
        .style("fill","rgb("+barPlot_highlightColor+")")
        // .style("stroke","gray");

      areaID_display_p.text(mouseover_area_name);
    })
    .on("mouseout", function(d) {
      current_mouseover_highlight
      .transition()
      .duration(250)
      .style("fill","white")
      // .style("stroke","none");

      currentParentNode = d3.select(this).node().parentNode ;
      // Select all polygons in current group and apply fill change
      d3.select(currentParentNode)
      .selectAll("polygon")
      .transition()
      .duration(250)
      .attr("fill", "#C4C4C4");
      areaID_display_p.text("") ;
    });
  });
});

function parse_CSV_finding_string(finding_string){
  finding_array = finding_string.split(",");
  for(var i=0; i<finding_array.length; i++){
    finding_array[i] = parseInt(finding_array[i], 10);
  }
  if (isNaN(finding_array[0])) {
    finding_array = [] ;
  }
  return finding_array ;
}

// function scale_and_translate_in_bounds(original_height,original_width,new_height,
// new_width){
//
// }
