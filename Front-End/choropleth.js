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

        var selectedStates = []

        let svg_map = d3.select("div").append("svg")
        .attr("id", "svg_map")
        //.attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "-"
            + adj + " -"
            + adj + " "
            + (width + adj*3) + " "
            + (height/3 + adj*2))
        .attr("width", width)
        .style("padding", padding)
        .style("margin", margin)
        .classed("svg-content", true)
        // .append("p")

        

        let svg_info = d3
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
            .attr("id", "container2_2");

        var projection = d3.geoAlbersUsa().translate([width/2, height/2])
            .scale(900);
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
                selectedStates = []
                createMapAndLegend(stateData, usMap);
                var graph_type = parseInt(document.querySelector("#pickyourpoison").value)
                switch(graph_type){
                    case 0:
                        createNationalGraph(stateData);
                        break;
                    case 1:
                        drawStateGraph(stateData)
                        break;
                    case 2:
                        createTopFiveGraphs(stateData);
                        break;
                    case 3:
                        writeInformation();
                        break;
                    default:
                        // nothing
                    }
            });
            createMapAndLegend(stateData, usMap);
            var graph_type = parseInt(document.querySelector("#pickyourpoison").value)
            switch(graph_type){
                case 0:
                    createCheckBox(stateData);
                    createNationalGraph(stateData);                    
                    break;
                case 1:
                    drawStateGraph(stateData)
                    break;
                case 2:
                    createTopFiveGraphs(stateData);
                    break;
                case 3:
                    writeInformation();
                    break;
                default:
                    // nothing
            }
            var screen_select = d3.select("#pickyourpoison");
            screen_select.on('change', function(d){
                var graph_type = parseInt(document.querySelector("#pickyourpoison").value)
                switch(graph_type){
                    case 0:
                        createCheckBox(stateData);
                        createNationalGraph(stateData);                        
                        break;
                    case 1:
                        drawStateGraph(stateData)
                        break;
                    case 2:
                        createTopFiveGraphs(stateData);
                        break;
                    case 3:
                        writeInformation();
                        break;
                    default:
                        // nothing
                    }
            })            
        }

        function createCheckBox(stateData){
            dropdown = d3.selectAll("#states").on("change",function(){
                var fil = d3.select(this)
                .selectAll("option")
                .filter(function (d, i) { 
                    return this.selected; 
                });
                // console.log(fil._groups[0].map(a => {
                //     return a.__data__
                // }))
                filtered_states = fil._groups[0].map(a => {
                    return a.__data__
                })
                createNationalGraph(filtered_states)
            })
            
            dropdown
                    .selectAll("option")
                    .data(stateData)
                    .enter()
                    .append("option")
                    .attr("value", function(d) { return d.location_name })
                    .text(function(d) { return d.location_name; })
        }

        function createMapAndLegend(keys, usMap){
            svg_map.remove();

            svg_map = d3.select("div").attr("width", width*2)
            .append("svg")
            .attr("id", "svg_map")
            //.attr("preserveAspectRatio", "xMinYMin meet")
            // .attr("viewBox", "-"
            //     + adj + " -"
            //     + adj + " "
            //     + (width + adj*3) + " "
            //     + (height*2 + adj*3))
            .attr("width", 2*width)
            .attr("height", 1.5 * height)
            .style("padding", padding)
            .style("margin", margin)
            .classed("svg-content", true);

            var arr = [];
            const weighting = ReturnWeights();
            // TODO 2: expand weighting to be more dynamic or specify what exactly we plan to have for our toxicity fields.
            for(i = 0; i<keys.length; i++){
                var weightedState = [
                    parseFloat(keys[i].IDENTITY_ATTACK)*weighting[0], parseFloat(keys[i].INSULT)*weighting[1],
                    parseFloat(keys[i].PROFANITY)*weighting[2], parseFloat(keys[i].THREAT)*weighting[3],
                    parseFloat(keys[i].SEXUALLY_EXPLICIT)*weighting[4]
                    ];
                weightedState = weightedState[0] + weightedState[1] + weightedState[2] + weightedState[3] + weightedState[4];
                arr.push(weightedState)
                keys[i].t_score= weightedState;
            }
            
            colors.domain(arr);
            // draw states map
            countries = svg_map.append("g").attr("id", "states").attr("width", width).attr("transform", "translate(" + (0) + ","+ (50) + ")");
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
            }).on("mouseover", tip.show).on("mouseout", tip.hide).on('click', function(selectedState){
                if(selectedStates.length == 0){
                    selectedStates.push(selectedState.properties.NAME)
                }
                else if(selectedStates[0] == selectedState.properties.NAME){
                    // do nothing
                }
                else if(selectedStates.length == 1){
                    selectedStates.push(selectedStates[0])
                    selectedStates[0] = selectedState.properties.NAME
                }
                else{
                    selectedStates[1] = selectedStates[0]
                    selectedStates[0] = selectedState.properties.NAME
                }
                if(document.querySelector("#pickyourpoison").value == '1'){drawStateGraph(keys)}
            });
            var legend = svg_map.append("g")
                .attr("id", "legend")
                .attr("class", "legendaryFail")
                .attr("transform", "translate(" + (50) + ","+ (0)+ ")");
            
            var legends = d3.legendColor()
                .scale(colors)
                .labels(["A", "A-", "B", "B-", "C", "C-", "D", "D-", "F"]);//.labelFormat(d3.format(".2f"));

            svg_map.select(".legendaryFail").call(legends);

            // TODO 2: Update tip in-line with weights update (once we narrow down what fields we'd like to use to establish toxicity).
            tip.html(function (d){
                var t_score = "";
                var stateName = "";
                var IDENTITY_ATTACK = "";
                var INSULT = "";
                var PROFANITY = "";
                var THREAT = "";
                var SEXUALLY_EXPLICIT = "";
                var name = d.properties.NAME;
                // mins and maxes for our letter grading
                min_id_attack = "1000.0";
                min_insult = "1000.0";
                min_threat = "1000.0";
                min_sexy = "1000.0";
                min_profanity = "1000.0";
                max_id_attack = "-1000.0";
                max_insult = "-1000.0";
                max_threat = "-1000.0";
                max_sexy = "-1000.0";
                max_profanity = "-1000.0";
                for(i = 0; i < keys.length; i++)
                {
                    id_atk = parseFloat(keys[i].IDENTITY_ATTACK).toFixed(4);
                    insult = parseFloat(keys[i].INSULT).toFixed(4);
                    profanity = parseFloat(keys[i].PROFANITY).toFixed(4);
                    threat = parseFloat(keys[i].THREAT).toFixed(4);
                    sexy = parseFloat(keys[i].SEXUALLY_EXPLICIT).toFixed(4);

                    min_id_attack = Math.min(min_id_attack, id_atk);
                    min_insult = Math.min(min_insult, insult);
                    min_profanity = Math.min(min_profanity, profanity);
                    min_threat = Math.min(min_threat, threat);
                    min_sexy = Math.min(min_sexy, sexy);

                    max_id_attack = Math.max(max_id_attack, id_atk);
                    max_insult = Math.max(max_insult, insult);
                    max_profanity = Math.max(max_profanity, profanity);
                    max_threat = Math.max(max_threat, threat);
                    max_sexy = Math.max(max_sexy, sexy);
                }
                for(i = 0; i < keys.length; i++)
                {
                    if (keys[i].location_name.toLowerCase() == name.toLowerCase())
                    {
                        IDENTITY_ATTACK = parseFloat(keys[i].IDENTITY_ATTACK).toFixed(4);
                        INSULT = parseFloat(keys[i].INSULT).toFixed(4);
                        PROFANITY = parseFloat(keys[i].PROFANITY).toFixed(4);
                        THREAT = parseFloat(keys[i].THREAT).toFixed(4);
                        SEXUALLY_EXPLICIT = parseFloat(keys[i].SEXUALLY_EXPLICIT).toFixed(4);
                        // scale
                        // (xi – min(x)) / (max(x) – min(x)) * 100
                        IDENTITY_ATTACK = (IDENTITY_ATTACK - min_id_attack)/(max_id_attack - min_id_attack)*100
                        IDENTITY_ATTACK = letterGrade(IDENTITY_ATTACK)

                        INSULT = (INSULT - min_insult)/(max_insult - min_insult)*100
                        INSULT = letterGrade(INSULT)

                        PROFANITY = (PROFANITY - min_profanity)/(max_profanity - min_profanity)*100
                        PROFANITY = letterGrade(PROFANITY)

                        SEXUALLY_EXPLICIT = (SEXUALLY_EXPLICIT - min_sexy)/(max_sexy - min_sexy)*100
                        SEXUALLY_EXPLICIT = letterGrade(SEXUALLY_EXPLICIT)

                        THREAT = (THREAT - min_threat)/(max_threat - min_threat)*100
                        THREAT = letterGrade(THREAT)

                        stateName = name;
                        break;
                    }
                }
                // d3.select("form#happyPanda").select("input#State")._groups[0][0].value = stateName;
                // d3.select("form#happyPanda").select("input#ID_Attack")._groups[0][0].value = IDENTITY_ATTACK;
                // d3.select("form#happyPanda").select("input#Insult")._groups[0][0].value = INSULT;
                // d3.select("form#happyPanda").select("input#Profanity")._groups[0][0].value = PROFANITY;
                // d3.select("form#happyPanda").select("input#Threat")._groups[0][0].value = THREAT;
                // d3.select("form#happyPanda").select("input#Sexy")._groups[0][0].value = SEXUALLY_EXPLICIT;

                return "<div><p>State: " + stateName + "</p>"+
                        "<p>Identity Attack: "+ IDENTITY_ATTACK + "</p>"+
                        "<p>Insult: "+ INSULT + "</p>"+
                        "<p>Profanity: "+ PROFANITY + "</p>"+
                        "<p>Threat: "+ THREAT + "</p>"+
                        "<p>Sexually Explicit: "+ SEXUALLY_EXPLICIT + "</p>"+
                        "</div>";
            })

            svg_map.call(tip)
        }

        function letterGrade(value)
        {
            if (value >= 89.0)
            {
                return "F";
            }
            else if (value < 89.0 && value >= 78.0)
            {
                return "D-";
            }
            else if (value < 78.0 && value >= 67.0)
            {
                return "D";
            }
            else if (value < 67.0 && value >= 56.0)
            {
                return "C-";
            }
            else if (value < 56.0 && value >= 45.0)
            {
                return "C";
            }
            else if (value < 45.0 && value >= 34.0)
            {
                return "B-";
            }
            else if (value < 34.0 && value >= 23.0)
            {
                return "B";
            }
            else if (value < 23.0 && value >= 12.0)
            {
                return "A-";
            }
            else
            {
                return "A";
            }

        }

        function createNationalGraph(stateData)
        {
            console.log(stateData.map(o=>{return o.location_name}))
            d3.select("body").select('#container2').remove();
            svg_graph_all = d3
                .select("body")
                .append("div")
                .attr("id", "container2")
                .attr("class", "svg-container")
                ;

            var height = 75 + (stateData.length * 10)
            

            svg_graph_all    
                .append("svg")
                .attr("id", "bar_chart")
                .attr("preserveAspectRatio", "xMinYMin meet")
                .attr("viewBox", "-"
                    + adj*2 + " -"
                    + 0 + " "
                    + (width + adj*4) + " "
                    + (height + adj*4))
                .attr("width", width)
                .attr("height", 2*height)
                .style("padding", padding + 050)
                .style("margin", margin)
                .classed("svg-content", true)
                .append("g")
                .attr("id", "container2_2");

            var weighting = ReturnWeights();
            var arr = [];
            // TODO 2: expand weighting to be more dynamic or specify what exactly we plan to have for our toxicity fields.
            for(i = 0; i<stateData.length; i++){
                var weightedState = [
                    parseFloat(stateData[i].IDENTITY_ATTACK)*weighting[0], parseFloat(stateData[i].INSULT)*weighting[1],
                    parseFloat(stateData[i].PROFANITY)*weighting[2], parseFloat(stateData[i].THREAT)*weighting[3],
                    parseFloat(stateData[i].SEXUALLY_EXPLICIT)*weighting[4]
                    ];
                weightedState = weightedState[0] + weightedState[1] + weightedState[2] + weightedState[3] + weightedState[4];
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
                    .range([0, 2*height])
                    .domain(sortedStateData.map(function(d){return d.location_name}));

            let xbar_axis = d3.axisBottom(xBarScale)
            .tickSize(-2*height);

            let container2 = d3.select("#container2_2");

            container2.select("#bars").remove();
            container2.append("g")
                    .attr("id", "bars")
                    .selectAll("chart_bars")
                    .data(sortedStateData)
                    .enter()
                    .append("rect") 
                    .attr("id", function(d){
                        return d.location_name
                    })
                    .attr("x", xBarScale(0))
                    .attr("y", function(d){ 
                        return yBarScale(d.location_name)
                    })
                    .attr("width", function(d){
                        return xBarScale(d.t_score) - xBarScale(0)
                    })
                    .attr("height", ((2*height)/sortedStateData.length - 5))
                    .attr("fill", "#ff1493")
                    .attr("transform", "translate(100," + (0) + ")");

            container2.append("g")
                    .attr("class", "axis")
                    .attr("transform", "translate(100," + (2*height) + ")")
                    .attr("id","x-axis-bars")
                    .call(xbar_axis);

            container2.append("text")
                    .attr("id", "bar_x_axis_label")
                    .attr("x", (width)/2-100)
                    .attr("y", 2*height + 100)
                    .attr("fill", "black")
                    .attr("font-weight", "normal")
                    .attr("font-size", "35px")
                    .attr("font-family", "Arial Black")
                    .text("Toxicity Score");

            let ybar_axis = d3.axisLeft()
                    .scale(yBarScale);

            container2.append("g")
                    .attr("class", "axis")
                    .attr("transform", 'translate(100,0)')
                    .attr("id", "y-axis-bars")
                    .call(ybar_axis);

            container2.append("text")
                    .attr("id", "bar_y_axis_label")
                    .attr("transform", "rotate(-90)")
                    .attr("x", -(height - 50)/2)
                    .attr("y", -100)
                    .attr("text-anchor", "end")
                    .attr("fill", "black")
                    .attr("font-weight", "normal")
                    .attr("font-size", "35px")
                    .attr("font-family", "Arial Black")
                    .text("States"); 
        }

        function createTopFiveGraphs(stateData)
        {
            d3.select("body").select('#container2').remove();
            let graphDiv = d3
                .select("body")
                .append("div")
                .attr("id", "container2")
                .attr("class", "svg-container");

            var IDENTITY_ATTACK_TOP_5 = stateData.sort(function(a, b){return b.IDENTITY_ATTACK - a.IDENTITY_ATTACK}).slice(0,5);
            var IDENTITY_ATTACK_BOTTOM_5 = stateData.sort(function(a, b){return a.IDENTITY_ATTACK - b.IDENTITY_ATTACK}).slice(0,5);
            var INSULT_TOP_5 = stateData.sort(function(a, b){return b.INSULT - a.INSULT}).slice(0,5);
            var INSULT_BOTTOM_5 = stateData.sort(function(a, b){return a.INSULT - b.INSULT}).slice(0,5);
            var PROFANITY_TOP_5 = stateData.sort(function(a, b){return b.PROFANITY - a.PROFANITY}).slice(0,5);
            var PROFANITY_BOTTOM_5 = stateData.sort(function(a, b){return a.PROFANITY - b.PROFANITY}).slice(0,5);
            var THREAT_TOP_5 = stateData.sort(function(a, b){return b.THREAT - a.THREAT}).slice(0,5);
            var THREAT_BOTTOM_5 = stateData.sort(function(a, b){return a.THREAT - b.THREAT}).slice(0,5);
            var SEXUALLY_EXPLICIT_TOP_5 = stateData.sort(function(a, b){return b.SEXUALLY_EXPLICIT - a.SEXUALLY_EXPLICIT}).slice(0,5);
            var SEXUALLY_EXPLICIT_BOTTOM_5 = stateData.sort(function(a, b){return a.SEXUALLY_EXPLICIT - b.SEXUALLY_EXPLICIT}).slice(0,5);

            var graphData = [IDENTITY_ATTACK_TOP_5, IDENTITY_ATTACK_BOTTOM_5, INSULT_TOP_5, INSULT_BOTTOM_5, PROFANITY_TOP_5, PROFANITY_BOTTOM_5, THREAT_TOP_5, THREAT_BOTTOM_5, SEXUALLY_EXPLICIT_TOP_5, SEXUALLY_EXPLICIT_BOTTOM_5]

            var graphDataKeys = ['IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT', 'SEXUALLY_EXPLICIT']

            for(let i = 0; i < graphData.length; i++){
                graphWidth = width/3;
                graphHeight = height/10;
                graphPadding = 50
                graphMargin = 10
                horGap = 10
                

                graphDiv.append("svg")
                    .attr("id", "bar_chart")
                    .attr("preserveAspectRatio", "xMinYMin meet")
                    .attr("viewBox", "-"
                        + adj + " -"
                        + adj/2 + " "
                        + (graphWidth + adj*2) + " "
                        + (graphHeight + adj*4))
                    .attr("width", graphWidth)
                    .attr("height", graphHeight*10)
                    .style("padding", graphPadding)
                    .style("margin", graphMargin)
                    .classed("svg-content", true)
                    .append("g")
                    .attr("id", "container2_" + i)

                var xBarScale = d3.scaleLinear()
                    .range([0, graphWidth])
                    .domain([0, d3.max(graphData[i], function(d){
                        return d[graphDataKeys[Math.floor(i/2)]];
                    })]);

                var yBarScale = d3.scaleBand()
                    .range([0, graphHeight*2])
                    .domain(graphData[i].map(function(d){return d.location_name}));

                let xbar_axis = d3.axisBottom(xBarScale)
                    .tickSize(-graphHeight*2);

                let container = graphDiv.select("#container2_" + i);

                container.select("#bars").remove();

                container.append("g")
                        .attr("id", "bars")
                        .selectAll("chart_bars")
                        .data(graphData[i])
                        .enter()
                        .append("rect")
                        .attr("x", xBarScale(0))
                        .attr("y", function(d){ 
                            return yBarScale(d.location_name)
                        })
                        .attr("width", function(d){
                            return xBarScale(d[graphDataKeys[Math.floor(i/2)]]) - xBarScale(0)
                        })
                        .attr("height", (graphHeight * 2 / 5) - 10)
                        .attr("fill", "#ff1493");
                
                container.append("g")
                        .attr("class", "axis")
                        .attr("transform", "translate(0," + (graphHeight*2) + ")")
                        .attr("id","x-axis-bars")
                        .call(xbar_axis);

                let title = ""
                if(i % 2 == 0){
                    title = "Top 5 " + [graphDataKeys[Math.floor(i/2)]] + " States"
                }
                else{
                    title = "Bottom 5 " + [graphDataKeys[Math.floor(i/2)]] + " States"
                }

                container.append("text")
                        .attr("id", "bar_x_axis_label")
                        .attr("x", (graphWidth / 2) - 100)
                        .attr("y", -20)
                        .attr("fill", "black")
                        .attr("font-weight", "normal")
                        .attr("font-size", "14px")
                        .attr("font-family", "Arial Black")
                        .text(title);

                container.append("text")
                        .attr("id", "bar_x_axis_label")
                        .attr("x", (graphWidth / 2) - 50)
                        .attr("y", graphHeight + 70)
                        .attr("fill", "black")
                        .attr("font-weight", "normal")
                        .attr("font-size", "14px")
                        .attr("font-family", "Arial Black")
                        .text('Toxicity Units');

                let ybar_axis = d3.axisLeft()
                        .scale(yBarScale);

                container.append("g")
                        .attr("class", "axis")
                        .attr("transform", 'translate(0,0)')
                        .attr("id", "y-axis-bars")
                        .call(ybar_axis);

                container.append("text")
                        .attr("id", "bar_y_axis_label")
                        .attr("transform", "rotate(-90)")
                        .attr("x", -(graphHeight*2) + 50)
                        .attr("y", -70)
                        .attr("text-anchor", "end")
                        .attr("fill", "black")
                        .attr("font-weight", "normal")
                        .attr("font-size", "14px")
                        .attr("font-family", "Arial Black")
                        .text("States"); 
            }
        }

        function drawStateGraph(stateData){
            d3.select("body").select('#container2').remove();
            var svg_info = d3
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
                .attr("id", "container2_1");
            
            svg_info.append("text")
                .text("CLICK ON ANY STATE TO SHOW DETAILED BREAKDOWN OF TOXICITY")
                .attr("class", "random")
                .attr("x", 5)
                .attr("y", height+padding*2);
            var tempData = {}
            var isOneState = true
            var labels = ['IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'SEXUALLY_EXPLICIT', 'THREAT']
            graphDataDict = []
            if(selectedStates.length == 1){
                tempData = stateData.filter(function(d){
                    return d.location_name == selectedStates[0]
                })[0]
                var graphData = [[labels],[parseFloat(tempData.IDENTITY_ATTACK).toFixed(2),parseFloat(tempData.INSULT).toFixed(2),parseFloat(tempData.PROFANITY).toFixed(2),parseFloat(tempData.SEXUALLY_EXPLICIT).toFixed(2),parseFloat(tempData.THREAT).toFixed(2)]]
                for(var i = 0; i < labels.length; i++){
                    graphDataDict.push({label: labels[i], value: graphData[1][i]})
                }
            }
            else if(selectedStates.length == 0){
                return; // no data to show
            }
            else if(selectedStates.length == 2){
                tempData = stateData.filter(function(d){
                    return d.location_name == selectedStates[0]
                })
                tempData.push(stateData.filter(function(d){
                    return d.location_name == selectedStates[1]
                })[0])
                var graphData = [[labels],[parseFloat(tempData[0].IDENTITY_ATTACK).toFixed(2),parseFloat(tempData[0].INSULT).toFixed(2),parseFloat(tempData[0].PROFANITY).toFixed(2),parseFloat(tempData[0].SEXUALLY_EXPLICIT).toFixed(2),parseFloat(tempData[0].THREAT).toFixed(2)], [parseFloat(tempData[1].IDENTITY_ATTACK).toFixed(2),parseFloat(tempData[1].INSULT).toFixed(2),parseFloat(tempData[1].PROFANITY).toFixed(2),parseFloat(tempData[1].SEXUALLY_EXPLICIT).toFixed(2),parseFloat(tempData[1].THREAT).toFixed(2)]]
                for(var i = 0; i < labels.length; i++){
                    graphDataDict.push({label: labels[i], value1: graphData[1][i], value2: graphData[2][i]})
                }
                isOneState = false
            }
            else{
                tempData = stateData.filter(function(d){
                    return d.location_name == selectedStates[0]
                })
                tempData.push(stateData.filter(function(d){
                    return d.location_name == selectedStates[1]
                })[0])
                var graphData = [[labels],[parseFloat(tempData[0].IDENTITY_ATTACK).toFixed(2),parseFloat(tempData[0].INSULT).toFixed(2),parseFloat(tempData[0].PROFANITY).toFixed(2),parseFloat(tempData[0].SEXUALLY_EXPLICIT).toFixed(2),parseFloat(tempData[0].THREAT).toFixed(2)], [parseFloat(tempData[1].IDENTITY_ATTACK).toFixed(2),parseFloat(tempData[1].INSULT).toFixed(2),parseFloat(tempData[1].PROFANITY).toFixed(2),parseFloat(tempData[1].SEXUALLY_EXPLICIT).toFixed(2),parseFloat(tempData[1].THREAT).toFixed(2)]]
                for(var i = 0; i < labels.length; i++){
                    graphDataDict.push({label: labels[i], value1: graphData[1][i], value2: graphData[2][i]})
                }
                isOneState = false
            }            

            if(isOneState){
                var xBarScale = d3.scaleLinear()
                    .range([0, width-20])
                    .domain([0, d3.max(graphData[1])]);

                var yBarScale = d3.scaleBand()
                    .range([0, height])
                    .domain(graphDataDict.map(function(d){return d.label}));

                let xbar_axis = d3.axisBottom(xBarScale)
                    .tickSize(-height);

                svg_info.append("g")
                    .attr("id", "bars")
                    .selectAll("chart_bars")
                    .data(graphDataDict)
                    .enter()
                    .append("rect")
                    .attr("x", xBarScale(0))
                    .attr("y", function(d){ 
                        return yBarScale(d.label)
                    })
                    .attr("width", function(d){
                        return xBarScale(d.value) - xBarScale(0)
                    })
                    .attr("height", (height / 5) - 10)
                    .attr("fill", "#ff1493");

                let container = d3.select("#container2_1");

                container.append("g")
                        .attr("class", "axis")
                        .attr("transform", "translate(0," + (height) + ")")
                        .attr("id","x-axis-bars")
                        .call(xbar_axis);

                let title = selectedStates[0] + " Toxicity Breakdown"

                container.append("text")
                        .attr("id", "bar_x_axis_label")
                        .attr("x", (width)/2 - 100)
                        .attr("y", height + 30)
                        .attr("fill", "black")
                        .attr("font-weight", "normal")
                        .attr("font-size", "14px")
                        .attr("font-family", "Arial Black")
                        .text('Toxicity Units');

                container.append("text")
                        .attr("id", "title")
                        .attr("x", (width)/2 - 100)
                        .attr("y", -20)
                        .attr("fill", "black")
                        .attr("font-weight", "normal")
                        .attr("font-size", "14px")
                        .attr("font-family", "Arial Black")
                        .text(title);

                let ybar_axis = d3.axisLeft()
                        .scale(yBarScale);

                container.append("g")
                        .attr("class", "axis")
                        .attr("transform", 'translate(0,0)')
                        .attr("id", "y-axis-bars")
                        .call(ybar_axis);

                container.append("text")
                        .attr("id", "bar_y_axis_label")
                        .attr("transform", "rotate(-90)")
                        .attr("x", -(height) / 2)
                        .attr("y", -135)
                        .attr("text-anchor", "end")
                        .attr("fill", "black")
                        .attr("font-weight", "normal")
                        .attr("font-size", "14px")
                        .attr("font-family", "Arial Black")
                        .text("Categories"); 
            }
            else{
                var xBarScale = d3.scaleLinear()
                    .range([0, width-20])
                    .domain([0, d3.max(graphData[1].concat(graphData[2]))]);

                var yBarScale = d3.scaleBand()
                    .range([0, height])
                    .domain(graphDataDict.map(function(d){return d.label}));

                let xbar_axis = d3.axisBottom(xBarScale)
                    .tickSize(-height);

                svg_info.append("g")
                    .attr("id", "bars1")
                    .selectAll("chart_bars1")
                    .data(graphDataDict)
                    .enter()
                    .append("rect")
                    .attr("x", xBarScale(0))
                    .attr("y", function(d){ 
                        return yBarScale(d.label)
                    })
                    .attr("width", function(d){
                        return xBarScale(d.value1) - xBarScale(0)
                    })
                    .attr("height", ((height / 5) - 10)/2)
                    .attr("fill", "#0E16E9");

                svg_info.append("g")
                    .attr("id", "bars2")
                    .selectAll("chart_bars2")
                    .data(graphDataDict)
                    .enter()
                    .append("rect")
                    .attr("x", xBarScale(0))
                    .attr("y", function(d){ 
                        return yBarScale(d.label) + ((height / 5) - 10) / 2
                    })
                    .attr("width", function(d){
                        return xBarScale(d.value2) - xBarScale(0)
                    })
                    .attr("height", ((height / 5) - 10) / 2)
                    .attr("fill", "#FF0101");

                let container = d3.select("#container2_1");

                container.append("g")
                        .attr("class", "axis")
                        .attr("transform", "translate(0," + (height) + ")")
                        .attr("id","x-axis-bars")
                        .call(xbar_axis);

                let title = selectedStates[0] + " vs. " + selectedStates[1] + " Toxicity Breakdown"

                container.append("text")
                        .attr("id", "bar_x_axis_label")
                        .attr("x", (width)/2 - 100)
                        .attr("y", height + 30)
                        .attr("fill", "black")
                        .attr("font-weight", "normal")
                        .attr("font-size", "14px")
                        .attr("font-family", "Arial Black")
                        .text('Toxicity Units');

                container.append("text")
                        .attr("id", "title")
                        .attr("x", (width)/2 - 100)
                        .attr("y", -20)
                        .attr("fill", "black")
                        .attr("font-weight", "normal")
                        .attr("font-size", "14px")
                        .attr("font-family", "Arial Black")
                        .text(title);

                let ybar_axis = d3.axisLeft()
                        .scale(yBarScale);

                container.append("g")
                        .attr("class", "axis")
                        .attr("transform", 'translate(0,0)')
                        .attr("id", "y-axis-bars")
                        .call(ybar_axis);

                container.append("text")
                        .attr("id", "bar_y_axis_label")
                        .attr("transform", "rotate(-90)")
                        .attr("x", -(height) / 2)
                        .attr("y", -135)
                        .attr("text-anchor", "end")
                        .attr("fill", "black")
                        .attr("font-weight", "normal")
                        .attr("font-size", "14px")
                        .attr("font-family", "Arial Black")
                        .text("Categories"); 

                var ordinal = d3.scaleOrdinal()
                        .domain([selectedStates[0], selectedStates[1]])
                        .range(["#0E16E9", "#FF0101"]);
                
                svg_info.append("g")
                        .attr("class", "legendOrdinal")
                        .attr("transform", "translate(" + (width + 25) + "," + height/2 + ")")
                        .attr("x", width + 25)
                        .attr("y", height / 2);
                
                var legendOrdinal = d3.legendColor()
                        .shape("path", d3.symbol().size(150)())
                        .shapePadding(10)
                        .cellFilter(function(d){ return d.label !== "e" })
                        .scale(ordinal);
                
                svg_info.select(".legendOrdinal")
                        .call(legendOrdinal);
            }
        }

        function WeightScores(weights, data)
        {
            var arr = [];
            for(i = 0; i<data.length; i++){
                var weightedState = [
                    parseFloat(data[i].IDENTITY_ATTACK)*weighting[0], parseFloat(data[i].INSULT)*weiSEVEREghting[1],
                    parseFloat(data[i].PROFANITY)*weighting[2], parseFloat(data[i].THREAT)*weighting[3],
                    parseFloat(data[i].SEXUALLY_EXPLICIT)*weighting[4]
                    ];
                weightedState = weightedState[0] + weightedState[1] + weightedState[2] + weightedState[3] + weightedState[4];
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

        function writeInformation(){
            d3.select("body").select('#container2').remove();
            var svg_info = d3
                .select("body")
                .append("div")
                .attr("id", "container2")
                .html("This application is meant to analyze and visualize toxicity of state's pages within the Reddit online community.<br/><br/> \
                    Each of the state pages are analyzed through the comments mined from them and are given toxicity scores in five categories: \
                    Identity Attack, Insult, Profanity, Threat, and Sexually Explicit.<br/><br/> \
                    In order to quantify the toxicity we are using \'Toxicity Units\'. These units identity the probability of a comment in that state's page \
                    being that form of toxic.<br/><br/> \
                    The National Graph which shows all states in order of their overall toxicity score as well as the choropleth US map take the toxicity components and \
                    add them together based on weights the user can provide from the sliders. The choropleth converts the sum of weights into letter grades to be \
                    more easily digestable for the user. The National Graph shows the sum in order to allow the user to understand the differences between the state scores.")
        }

