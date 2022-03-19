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
        var svg = d3.select("div").append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "-"
                + adj + " -"
                + adj + " "
                + (width + adj *3) + " "
                + (height + adj*3))
            .style("padding", padding)
            .style("margin", margin)
            .classed("svg-content", true);

        var projection = d3.geoAlbersUsa().translate([width/2, height/2])
            .scale(600);
        var path = d3.geoPath().projection(projection);
        var colors = d3.scaleQuantile().range(d3.schemeBlues[9]);

        // Read our data in a promise
        // TODO 1: Hook this up with some sort of web service? Idk. Feeding latest data might be nice but we could stick with csvs.
        Promise.all([
            d3.csv("./state_data.csv"),
            d3.json("./us_map.json")
        ]).then(d => { ready(d[0], d[1])});
        function ready(stateData, usMap) {
            var inputs = d3.select("form#sundae");
            inputs.on('change', function(d){
                createMapAndLegend(stateData, usMap);
            });
            createMapAndLegend(stateData, usMap);
        }

        function createMapAndLegend(keys, usMap){
            svg.remove();

            svg = d3.select("div").append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "-"
                + adj + " -"
                + adj + " "
                + (width + adj *3) + " "
                + (height + adj*3))
            .style("padding", padding)
            .style("margin", margin)
            .classed("svg-content", true);
            var arr = [];
            const weighting = ReturnWeights();
            // TODO 2: expand weighting to be more dynamic or specify what exactly we plan to have for our toxicity fields.
            for(i = 0; i<keys.length; i++){
                var weightedState = [parseFloat(keys[i].racism)*weighting[0], parseFloat(keys[i].sexism)*weighting[1], parseFloat(keys[i].adhominem)*weighting[2]];
                weightedState = weightedState[0] + weightedState[1] + weightedState[2];
                arr.push(weightedState)
                keys[i].t_score= weightedState;
            }

            colors.domain(arr);
            // draw states map
            countries = svg.append("g").attr("id", "states");
            countries.selectAll("paths")
                .data(usMap.features)
                .enter().append("path")
                .attr("class", "state")
                .attr("d", path).attr("fill", function (d){
                    var name = d.properties.NAME;
                    for(i = 0; i < keys.length; i++)
                    {
                        if (keys[i].state.toLowerCase() == name.toLowerCase())
                        {
                            var toxicity = keys[i].t_score;
                            return colors(toxicity);
                        }
                    }
                    return "#ccc";
            }).on("mouseover", tip.show).on("mouseout", tip.hide);

            var legend = svg.append("g")
                .attr("id", "legend")
                .attr("class", "legendaryFail").attr("transform", "translate(" +height-10+")");

            var legends = d3.legendColor().scale(colors).labelFormat(d3.format(".2f"));

            svg.select(".legendaryFail").call(legends);

            // TODO 2: Update tip in-line with weights update (once we narrow down what fields we'd like to use to establish toxicity).
            tip.html(function (d){
                var toxicity = "";
                var racism = "";
                var sexism = "";
                var adhominem = "";
                var stateName = "";
                var name = d.properties.NAME;
                for(i = 0; i < keys.length; i++)
                {
                    if (keys[i].state.toLowerCase() == name.toLowerCase())
                    {
                        toxicity = keys[i].t_score.toFixed(2);
                        racism = parseFloat(keys[i].racism).toFixed(2);
                        sexism = parseFloat(keys[i].sexism).toFixed(2);
                        adhominem = parseFloat(keys[i].adhominem).toFixed(2);
                        stateName = name;
                        break;
                    }
                }
                return_string = "State: " + stateName + "<br>" + "Toxicity: " + toxicity + "<br>" + "Racism: " + racism + "<br>" + "Sexism: " + sexism + "<br>" + "Ad Hominem: " + adhominem;
                return return_string;
            })

            svg.call(tip)
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