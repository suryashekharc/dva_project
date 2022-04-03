   // Citation: https://eric.clst.org/tech/usgeojson/
        // For geojson file of US
        /* Initialize tooltip */
        tip = d3.tip().attr("id", "tooltip").attr('class', 'd3-tip');

        // Define SVG/Margins/Yada Yada
        const margin = {top: 100, right: 50, bottom: 100, left: 50};
        const width = 1000 - margin.left - margin.right;
        const height = 550 - margin.top - margin.bottom;
        const padding = 50;
        const adj = 80;

        svg_map = d3.select("div").append("svg")
        .attr("id", "svg_map")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "-"
            + adj + " -"
            + adj + " "
            + (width + adj*3) + " "
            + (height + adj*3))
        .attr("width", width)
        .style("padding", padding)
        .style("margin", margin)
        .classed("svg-content", true);

        svg_graph = d3
            .select("body")
            .append("div")
            .attr("id", "container2")
            .attr("class", "svg-container")
            .append("svg")
            .attr("id", "bar_chart")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "-"
                + adj*2 + " -"
                + adj + " "
                + (width + adj*4) + " "
                + (height + adj*4))
            .attr("width", width)
            .style("padding", padding + 050)
            .style("margin", margin)
            .classed("svg-content", true)
            .append("g")
            .attr("id", "container_2");

        var projection = d3.geoAlbersUsa().translate([width/2, height/2])
            .scale(600);
        var path = d3.geoPath().projection(projection);
        var colors = d3.scaleQuantile().range(d3.schemeReds[9]);

        // Read our data in a promise
        // TODO 1: Hook this up with some sort of web service? Idk. Feeding latest data might be nice but we could stick with csvs.
        Promise.all([
            d3.csv("./output_clean.csv"),
            d3.json("./us_map.json")
        ]).then(d => { ready(d[0], d[1])});
        function ready(stateData, usMap) {
            var inputs = d3.select("form#sundae");
            inputs.on('change', function(d){
                createMapAndLegend(stateData, usMap);
                createNationalGraph(stateData)
            });
            createMapAndLegend(stateData, usMap);
            createNationalGraph(stateData)
        }

        function createMapAndLegend(keys, usMap){
            svg_map.remove();

            svg_map = d3.select("div").append("svg")
            .attr("id", "svg_map")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "-"
                + adj + " -"
                + adj + " "
                + (width + adj*3) + " "
                + (height + adj*3))
            .attr("width", width)
            .style("padding", padding)
            .style("margin", margin)
            .classed("svg-content", true);
            var arr = [];
            const weighting = ReturnWeights();
            // TODO 2: expand weighting to be more dynamic or specify what exactly we plan to have for our toxicity fields.
            for(i = 0; i<keys.length; i++){
                var weightedState = [parseFloat(keys[i].TOXICITY)*weighting[0], parseFloat(keys[i].SEVERE_TOXICITY)*weighting[1],
                    parseFloat(keys[i].IDENTITY_ATTACK)*weighting[2], parseFloat(keys[i].INSULT)*weighting[3],
                    parseFloat(keys[i].PROFANITY)*weighting[4], parseFloat(keys[i].THREAT)*weighting[5],
                    parseFloat(keys[i].SEXUALLY_EXPLICIT)*weighting[6]];
                weightedState = weightedState[0] + weightedState[1] + weightedState[2] + weightedState[3] + weightedState[4] + weightedState[5] + weightedState[6];
                arr.push(weightedState)
                keys[i].t_score= weightedState;
            }
            
            colors.domain(arr);
            // draw states map
            countries = svg_map.append("g").attr("id", "states");
            countries.selectAll("paths")
                .data(usMap.features)
                .enter().append("path")
                .attr("class", "state")
                .attr("d", path).attr("fill", function (d){
                    var name = d.properties.NAME;
                    for(i = 0; i < keys.length; i++)
                    {
                        if (keys[i].location_name.toLowerCase() == name.toLowerCase())
                        {
                            var toxicity = keys[i].t_score;
                            return colors(toxicity);
                        }
                    }
                    return "#ccc";
            }).on("mouseover", tip.show).on("mouseout", tip.hide);
            console.log(height)
            var legend = svg_map.append("g")
                .attr("id", "legend")
                .attr("class", "legendaryFail").attr("transform", "translate(" + (50) + ")");
            
            var legends = d3.legendColor().scale(colors).labelFormat(d3.format(".2f"));

            svg_map.select(".legendaryFail").call(legends);

            // TODO 2: Update tip in-line with weights update (once we narrow down what fields we'd like to use to establish toxicity).
            tip.html(function (d){
                var t_score = "";
                var stateName = "";
                var TOXICITY = "";
                var SEVERE_TOXICITY = "";
                var IDENTITY_ATTACK = "";
                var INSULT = "";
                var PROFANITY = "";
                var THREAT = "";
                var SEXUALLY_EXPLICIT = "";
                var name = d.properties.NAME;
                for(i = 0; i < keys.length; i++)
                {
                    if (keys[i].location_name.toLowerCase() == name.toLowerCase())
                    {
                        t_score = keys[i].t_score.toFixed(2);
                        TOXICITY = parseFloat(keys[i].TOXICITY).toFixed(2);
                        SEVERE_TOXICITY = parseFloat(keys[i].SEVERE_TOXICITY).toFixed(2);
                        IDENTITY_ATTACK = parseFloat(keys[i].IDENTITY_ATTACK).toFixed(2);
                        INSULT = parseFloat(keys[i].INSULT).toFixed(2);
                        PROFANITY = parseFloat(keys[i].PROFANITY).toFixed(2);
                        THREAT = parseFloat(keys[i].THREAT).toFixed(2);
                        SEXUALLY_EXPLICIT = parseFloat(keys[i].SEXUALLY_EXPLICIT).toFixed(2);
                        stateName = name;
                        break;
                    }
                }
                return_string = "State: " + stateName + "<br>" + "Score: " + t_score + "<br>" + "Toxicity: " + TOXICITY + "<br>"
                + "Severe Toxicity: " + SEVERE_TOXICITY + "<br>" + "Identity Attack: " + IDENTITY_ATTACK
                + "<br>" + "Insult: " + INSULT + "<br>" + "Profanity: " + PROFANITY + "<br>" + "Threat: " + THREAT
                + "<br>" + "Sexually Explicit: " + SEXUALLY_EXPLICIT;
                return return_string;
            })

            svg_map.call(tip)
        }

        function createNationalGraph(stateData)
        {
            d3.select('#container2').remove();
            svg_graph = d3
                .select("body")
                .append("div")
                .attr("id", "container2")
                .attr("class", "svg-container")
                .append("svg")
                .attr("id", "bar_chart")
                .attr("preserveAspectRatio", "xMinYMin meet")
                .attr("viewBox", "-"
                    + adj*2 + " -"
                    + adj + " "
                    + (width + adj*4) + " "
                    + (height + adj*4))
                .attr("width", width)
                .style("padding", padding + 050)
                .style("margin", margin)
                .classed("svg-content", true)
                .append("g")
                .attr("id", "container_2");

            var weighting = ReturnWeights();
            var arr = [];
            // TODO 2: expand weighting to be more dynamic or specify what exactly we plan to have for our toxicity fields.
            for(i = 0; i<stateData.length; i++){
                var weightedState = [parseFloat(stateData[i].TOXICITY)*weighting[0], parseFloat(stateData[i].SEVERE_TOXICITY)*weighting[1],
                    parseFloat(stateData[i].IDENTITY_ATTACK)*weighting[2], parseFloat(stateData[i].INSULT)*weighting[3],
                    parseFloat(stateData[i].PROFANITY)*weighting[4], parseFloat(stateData[i].THREAT)*weighting[5],
                    parseFloat(stateData[i].SEXUALLY_EXPLICIT)*weighting[6]];
                weightedState = weightedState[0] + weightedState[1] + weightedState[2] + weightedState[3] + weightedState[4] + weightedState[5] + weightedState[6];
                arr.push(weightedState)
                stateData[i].t_score= weightedState;
            }

            var sortedStateData = stateData.sort(function(a, b){
                return b.t_score - a.t_score;
            });

            var xBarScale = d3.scaleLinear()
                    .range([0, width])
                    .domain([0, d3.max(sortedStateData, function(d){
                        return d.t_score;
                    })]);
            
            var yBarScale = d3.scaleBand()
                    .range([0, height])
                    .domain(sortedStateData.map(function(d){console.log(d);return d.location_name}));

            let xbar_axis = d3.axisBottom(xBarScale)
            .tickSize(-height);

            let container2 = d3.select("#container_2");

            container2.select("#bars").remove();
            console.log(sortedStateData)
            container2.append("g")
                    .attr("id", "bars")
                    .selectAll("chart_bars")
                    .data(sortedStateData)
                    .enter()
                    .append("rect")
                    .attr("x", xBarScale(0))
                    .attr("y", function(d){ 
                        return yBarScale(d.location_name)
                    })
                    .attr("width", function(d){
                        return xBarScale(d.t_score) - xBarScale(0)
                    })
                    .attr("height", ((height)/sortedStateData.length - 2))
                    .attr("fill", "#ff1493");
            
            container2.append("g")
                    .attr("class", "axis")
                    .attr("transform", "translate(0," + (height) + ")")
                    .attr("id","x-axis-bars")
                    .call(xbar_axis);

            container2.append("text")
                    .attr("id", "bar_x_axis_label")
                    .attr("x", (width-50)/2)
                    .attr("y", height + 50)
                    .attr("fill", "black")
                    .attr("font-weight", "normal")
                    .attr("font-size", "14px")
                    .attr("font-family", "Arial Black")
                    .text("Toxicity Score");

            let ybar_axis = d3.axisLeft()
                    .scale(yBarScale);

            container2.append("g")
                    .attr("class", "axis")
                    .attr("transform", 'translate(0,0)')
                    .attr("id", "y-axis-bars")
                    .call(ybar_axis);

            container2.append("text")
                    .attr("id", "bar_y_axis_label")
                    .attr("transform", "rotate(-90)")
                    .attr("x", -(height - 50)/2)
                    .attr("y", -150)
                    .attr("text-anchor", "end")
                    .attr("fill", "black")
                    .attr("font-weight", "normal")
                    .attr("font-size", "14px")
                    .attr("font-family", "Arial Black")
                    .text("States"); 
        }

        function WeightScores(weights, data)
        {
            var arr = [];
            for(i = 0; i<data.length; i++){
                var weightedState = [parseFloat(data[i].TOXICITY)*weighting[0], parseFloat(data[i].SEVERE_TOXICITY)*weighting[1],
                    parseFloat(data[i].IDENTITY_ATTACK)*weighting[2], parseFloat(data[i].INSULT)*weighting[3],
                    parseFloat(data[i].PROFANITY)*weighting[4], parseFloat(data[i].THREAT)*weighting[5],
                    parseFloat(data[i].SEXUALLY_EXPLICIT)*weighting[6]];
                weightedState = weightedState[0] + weightedState[1] + weightedState[2] + weightedState[3] + weightedState[4] + weightedState[5] + weightedState[6];
                arr.push(weightedState)
                data[i].t_score= weightedState;
            }
            return data, arr;
        }

        function ReturnWeights()
        {
            var arrs = d3.select("form#sundae");
            arrs = arrs.selectAll("input");
            var ret_arrs = [];
            for(let i = 0; i < arrs._groups[0].length; i++)
            {
                const consider = arrs._groups[0][i];
                const min = parseFloat(consider.min)
                const value = parseFloat(consider.value)
                if (isNaN(value)) {
                    weight = min
                } else {
                    weight = min > value ? min : value
                }
                d3.select("form#sundae").select("input#field" + i)._groups[0][0].value = weight;
                ret_arrs.push(weight)
            }
            return ret_arrs;
        }

