// Dimensions and layout. Native dimensions of brain map svg are 587h x 447w
brain_h = 587; //brain map svg height
brain_w = 447; //brain map svg width
bar_h = 700; //bar plot height
bar_w = 400; //bar plot width
brain_bar_space = 125; //Distance between minimum bar plot value and brain edge
width = brain_w + bar_w + brain_bar_space; //total width of brain + bar plot
height = d3.max([brain_h, bar_h]); //total height of brain and bar plot
//Size of text displaying the name of the currently selected area
brain_area_label_textSize = 21;
//Text before brain area label
brain_area_label_prefix = "";
//brain map svg brain areas fill color
brainMap_fillColor = "white";
//brain map svg brain areas highlight
brainMap_highlightColor = "rgb(175,175,175)";
// Padding above bars (for axis)
barPlot_topPadding = 40;
bar_padding = .05; //padding between barplot bars
barPlot_areaLabel_textSize = 12; //barplot label text size
//fill color for barplot positive results
barPlot_positiveResults_fillColor = "red";
//fill color for barplot negative results
barPlot_negativeResults_fillColor = "rgb(0,176,240)";
//bar plot highlight color
barPlot_highlightColor = "rgb(175,175,175)";
defaultTransitionDuration = 250; //Default transition animation duration
//Default delay between sequential animations (used for animating the bar plot)
defaultTransitionDelay = 15;

//Add div #plots that contains brain map and bar plot
var plots_div = d3.selectAll("body")
.append("div")
.attr("id", "plots")
.attr("align", "center")
.style("border-style", "hidden");

var brainSVGNode ; //Node that will contain brain map svg

// Load svg
d3.xml("FlatBrainLateralMedial_2.svg", function(error, documentFragment) {
  if (error) {console.log(error); return;}
  // Load data csv containing findings from each area
  d3.csv("WM_AreaFindings_2.csv",function(resultsByAreaRaw){
    // Array that will contain data prased from resultsByAreaRaw
    resultsByArea = Array() ;
    // Parse rows from resultsByAreaRaw and add to resultsByArea
    resultsByAreaRaw.map(function(row){
      newRow = Object() ;
      newRow.area = row.area ;
      newRow.positive_findings = row.positive_findings;
      newRow.n_positive_findings =
        parse_CSV_finding_string(row.positive_findings).length ;
      newRow.n_negative_findings =
        parse_CSV_finding_string(row.negative_findings).length ;
      newRow.negative_findings = row.negative_findings;
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
    //Set brainMapSVG brain areas fill color
    brainMapSVG.selectAll("polygon").attr("fill",brainMap_fillColor);
    // Center brain map svg
    brainMapSVG.style("vertical-align",(bar_h-brain_h)/2+"px");

    // Array of area names from SVG
    window.svgAreaNames = Array() ;
    brainMapSVG.selectAll("g").each( function(d, i){
      svgAreaNames[i] = d3.select(this).attr("id").split(/_(.+)/)[1].replace("_"," ");
    }) ;

    // Add #barplots svg to #plots div
    window.barPlot = d3.select("#plots")
      .append("svg")
      .attr("id","barplots")
      .attr("width", bar_w + brain_bar_space)
      .attr("height", bar_h);

    //Scale for y data (this is going to be a vertically-oriented bar
    // plot, so independent variable (brain area) will be on the y-axis)
    window.yScale = d3.scaleBand()
      .domain(d3.range(resultsByArea.length))
      .rangeRound([barPlot_topPadding, bar_h])
      .padding([bar_padding]);

    // Maximum number of positive findings across all brain areas
    var max_n_pos_findings = d3.max(resultsByArea,
      function(d){
        return d.n_positive_findings;
      });
      // Maximum number of negative findings across all brain areas
    var max_n_neg_findings = d3.max(resultsByArea,
      function(d){
        return d.n_negative_findings;
      });
    // Scale x data by maximum number of positive + negative findings
    window.xScalePositive = d3.scaleLinear()
      .domain([0,max_n_pos_findings + max_n_neg_findings])
      .rangeRound([0, bar_w]);
    // x offset for positive findings (i.e. x position of 0 on bar plot x-axis)
    x_offset_positive_findings = xScalePositive(max_n_neg_findings);

    window.xScaleNegative = d3.scaleLinear()
      .domain([max_n_neg_findings, 0])
      .rangeRound([0, x_offset_positive_findings]);

    // Highlight selected brain area by drawing invisible bars that sit behind
    // each row of the bar plot, which will then be turned visible upon
    // mouseover of the corresponding area
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
      .attr("fill", barPlot_positiveResults_fillColor);
    // Update values for to make animate
    barPlot_positive_group.selectAll("rect")
      .data(resultsByArea, function(area){
        return area.area;
      })
      .transition()
      .duration(defaultTransitionDuration)
      .delay(function(d,i){return i * defaultTransitionDelay})
      .attr("width", function(d) {
        return xScalePositive(d.n_positive_findings);
      })

    //Create negative results bar plot
    barPlot_negative_group = barPlot.append("g")
      .attr("id","barPlot_negative_group");
    // Start with all bars having 0 x value, then update with true value for
    // dope animation
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
      .attr("fill",barPlot_negativeResults_fillColor);
    // Update/animate values
    barPlot_negative_group.selectAll("rect")
      .data(resultsByArea, function(area){
        return area.area;
      })
      .transition()
      .duration(defaultTransitionDuration)
      .delay(function(d,i){return i * defaultTransitionDelay})
      .attr("x", function(area){
        return brain_bar_space +
          xScaleNegative(area.n_negative_findings);
      })
      .attr("width", function(area) {
        return x_offset_positive_findings-xScaleNegative(area.n_negative_findings);
      });

    //"tick" lines from bar label to bar. Again, draw w/ zero width then update
    // to animate
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
    // Update/animate values
    bar_label_lines.selectAll("line")
      .data(resultsByArea, function(area){
        return area.area;
      })
      .transition()
      .duration(defaultTransitionDuration)
      .delay(function(d,i){return i * defaultTransitionDelay})
      .attr("x2",function(area){
        return brain_bar_space + x_offset_positive_findings -
          xScalePositive(area.n_negative_findings);
      });

    //Bar plot labels
    bar_labels_text = barPlot.append("g")
      .attr("id","bar_labels");
    bar_labels_text.selectAll("text")
      .data(resultsByArea, function(area){
        return area.area;
      })
      .enter()
      .append("text")
      .text(function(area){
        return area.area.replace(/_/g," ");
      })
      .attr("x",brain_bar_space - 5)
      .attr("y", function(area,i) {
        return yScale(i) + yScale.bandwidth()/2;
      })
      .attr("font-size",barPlot_areaLabel_textSize)
      .attr("text-anchor","end")
      .attr("alignment-baseline","central")

    // Define positive portion of x axis
    var xAxisPositive = d3.axisTop(xScalePositive).tickSizeOuter(0);
    barPlot.append("g")
      .attr("id","xAxisPositive")
      .attr("class","axis")
      .attr("transform","translate(" + (brain_bar_space + x_offset_positive_findings) +
        "," + barPlot_topPadding + ")")
      .call(xAxisPositive);

    //Define negative portion of x axis
    var xAxisNegative = d3.axisTop(xScaleNegative).ticks(1).tickSizeOuter(0);
    barPlot.append("g")
      .attr("id","xAxisNegative")
      .attr("class","axis")
      .attr("transform","translate(" + brain_bar_space +
        "," + barPlot_topPadding + ")")
      .call(xAxisNegative);

    // Remove zero tick on x axes
    d3.selectAll(".tick")
      .filter(function (d) { return d == 0;  }).remove()

    // Label axes
    positive_findings_axis_label = d3.select("#barplots")
      .append("text")
      .attr("id","barplot_positive_findings_label")
      .attr("class","axis_label positive");
      // .attr("font-size",10);
    positive_findings_axis_label.append("tspan")
      .text("results")
      .attr("x",brain_bar_space+x_offset_positive_findings+2)
      .attr("y",barPlot_topPadding-5);
    positive_findings_axis_label.append("tspan")
      .text("positive")
      .attr("x",brain_bar_space+x_offset_positive_findings+2)
      .attr("dy","-1em");

    negative_findings_axis_label = d3.select("#barplots")
      .append("text")
      .attr("id","barplot_negative_findings_label")
      .attr("class","axis_label negative");
    negative_findings_axis_label.append("tspan")
      .text("results")
      .attr("x",brain_bar_space+x_offset_positive_findings-2)
      .attr("y",barPlot_topPadding-5)
      .attr("text-anchor","end");
    negative_findings_axis_label.append("tspan")
      .text("negative")
      .attr("x",brain_bar_space+x_offset_positive_findings-2)
      .attr("dy","-1em")
      .attr("text-anchor","end");

    number_of_studies_axis_label = d3.select("#barplots")
      .append("text")
      .text("# studies reporting")
      .attr("id","number_of_studies_axis_label")
      .attr("text-anchor","middle")
      .attr("font-size",14)
      .attr("x",brain_bar_space+x_offset_positive_findings)
      .attr("y",barPlot_topPadding/4);

    brain_areas_axis_label = d3.select("#barplots")
      .append("text")
      .text("Brain area")
      .attr("id","Brain_areas_axis_label")
      .attr("text-anchor","end")
      .attr("font-size",14)
      .attr("x",brain_bar_space-20)
      .attr("y",barPlot_topPadding);

    // Draw invisible bars that will sit in front of each row of the results bar
    // plot, which will detect mouseovers and pass this information to the
    // highlight bar
    barPlot_mousecatcher_overlay_group = barPlot.append("g")
      .attr("id","barPlot_mousecatcher_overlay");
    barPlot_mousecatcher_overlay_group.selectAll("rect")
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
        return "barPlot_mousecatcher_overlay area_"+ area.area
      })
      .attr("id",function(area){
        return "barPlot_mousecatcher_overlay_area_"+area.area;
      });

    // <p> that will display name of current brain area being moused over
    var brainArea_label_p = d3.select("body")
      .append("p")
      .attr("align","center")
      .attr("id","brain_area_label")
      .style("font-size",brain_area_label_textSize+"px");
    // Mouseover/mouseout behavior for brain areas in brain map svg
    brainMapSVG.selectAll("g")
      .selectAll("polygon")
      .on("mouseover", function(){
        //Parent node of (i.e. group containing) current polygon being moused over
        var currentParentNode = d3.select(this).node().parentNode;
        //Get name of current area being moused over
        var current_mouseover_areaName = get_mouseover_areaName_from_brainMapSVG(currentParentNode);
        //Highlight brain area in brain map
        highlight_brainMapSVG_area(currentParentNode,brainMap_highlightColor,"on");
        //Highlight brain area in bar plot
        highlight_barPlot_area(current_mouseover_areaName,
          barPlot_highlightColor,"on");
        //Update brain area label text
        brainArea_label_p.text(brain_area_label_prefix +
          current_mouseover_areaName.replace(/_/g," "));
      })
      .on("mouseout", function() {
        //Parent node of (i.e. group containing) current polygon being moused over
        var currentParentNode = d3.select(this).node().parentNode;
        //Get name of current area being moused over
        var current_mouseover_areaName = get_mouseover_areaName_from_brainMapSVG(currentParentNode);
        //Unhighlight brain area in brain map
        highlight_brainMapSVG_area(currentParentNode,brainMap_fillColor,"off");
        //Unhighlight brain area in bar plot
        highlight_barPlot_area(current_mouseover_areaName,"white","off");
        //Clear brain area label text
        brainArea_label_p.text("");
      });

    // Mouseover/mouseout behavior for brain areas in bar plot
    barPlot_mousecatcher_overlay_group.selectAll("rect")
      .on("mouseover",function(){
        // Current barplot region being moused over
        var current_mouseover_bar = d3.select(this);
        // Get name of brain area in current moused over barplot region
        current_mouseover_areaName =
          current_mouseover_bar.attr("class").split("area_")[1];
        // Get parent node of corresponding area in brain map svg
        currentParentNode = brainMapSVG.selectAll("g")
          .filter("#Group_"+current_mouseover_areaName).node();
        //Highlight brain area in brain map
        highlight_brainMapSVG_area(currentParentNode,brainMap_highlightColor,"on");
        //Highlight brain area in bar plot
        highlight_barPlot_area(current_mouseover_areaName,
          barPlot_highlightColor,"on");
        //Update brain area label text
        brainArea_label_p.text(brain_area_label_prefix +
          current_mouseover_areaName.replace(/_/g," "));
      })
      .on("mouseout", function() {
        // Current barplot region being moused over
        var current_mouseover_bar = d3.select(this);
        // Get name of brain area in current moused over barplot region
        current_mouseover_areaName =
          current_mouseover_bar.attr("class").split("area_")[1];
        // Get parent node of corresponding area in brain map svg
        currentParentNode = brainMapSVG.selectAll("g")
          .filter("#Group_"+current_mouseover_areaName).node();
        //Highlight brain area in brain map
        highlight_brainMapSVG_area(currentParentNode,brainMap_fillColor,"off");
        //Highlight brain area in bar plot
        highlight_barPlot_area(current_mouseover_areaName,"white","off");
        //Clear brain area label text
        brainArea_label_p.text("");
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

function get_mouseover_areaName_from_brainMapSVG(currentParentNode){
  current_mouseover_areaName = currentParentNode
    .getAttribute("id")
    .split(/_(.+)/)[1];
  return current_mouseover_areaName;
}

// Highlights/changes color in brain area svg of current moused over
// brain area
function highlight_brainMapSVG_area(currentParentNode,color,onOff) {
  // Make sure it's legit
  if ("undefined" != typeof(currentParentNode)){
    // Select all polygons in current group
    brainArea_polygons = d3.select(currentParentNode)
    .selectAll("polygon");
    // If on, no transition. If off, transition.
    if (onOff == "on"){
      brainArea_polygons.attr("fill",color) ;
    } else if (onOff == "off"){
      brainArea_polygons.transition()
        .duration(defaultTransitionDuration)
        .attr("fill",color) ;
    }
  }
}

// Highlights/changes color in bar plot of current moused over
// brain area
function highlight_barPlot_area(current_mouseover_areaName,color,onOff) {
  // Select bar plot bar
  barPlot_bar = d3.selectAll(".barPlot_highlight")
    .filter(".area_"+current_mouseover_areaName.toLowerCase());
  // If on, no transition. If off, transition.
  if (onOff == "on"){
    barPlot_bar.style("fill",color);
  } else if (onOff == "off"){
  barPlot_bar.transition()
    .duration(defaultTransitionDuration)
    .style("fill","white");
  }
}
