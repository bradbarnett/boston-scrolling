/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
var dataField = "metacategory";
var filterField = "metacategories";
var sortCategories = {
    neighborhoodNames: [],
    metacategories: []
};
var _totals = {};
var data;

var w = (document.getElementById('vis').clientWidth),
    h = 600,
    margin = {top: 20, right: 20, bottom: 20, left: 40},
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom,
    strictIsoParse = d3.utcParse("%Y-%m-%dT%H:%M:%S.%LZ"),
    timeFormat = d3.timeFormat("%a %I : %M");
var originalData;
var squareSize = 4;
var squarePad = 2;
var numPerRow = width / (squareSize + squarePad);
var categoriesColors = {
    'active': '#607d8b',
    'grocery': '#2ecc71',
    'health': '#f39c12',
    'nightlife': '#36D7B7',
    'publicservicesgovt': '#3498db',
    'religiousorgs': '#F4B350',
    'restaurants': '#9B59B6',
    'localservices,shopping': '#fa8072',
    'financialservices,professional': '#81c784'
}

var scrollVis = function () {
    // constants to define the size
    // and margins of the vis area.
    var w = (document.getElementById('vis').clientWidth),
        h = 600,
        margin = {top: 20, right: 20, bottom: 20, left: 40},
        width = w - margin.left - margin.right,
        height = h - margin.top - margin.bottom,
        strictIsoParse = d3.utcParse("%Y-%m-%dT%H:%M:%S.%LZ"),
        timeFormat = d3.timeFormat("%a %I : %M"),
        squaresData = originalData;


    // Keep track of which visualization
    // we are on and which was the last
    // index activated. When user scrolls
    // quickly, we want to call all the
    // activate functions that they pass.
    var lastIndex = -1;
    var activeIndex = 0;

    // Sizing for the grid visualization

    // main svg used for visualization
    var svg = null;

    // d3 selection that will be used
    // for displaying visualizations
    var g = null;

    // We will set the domain when the
    // data is processed.
    // @v4 using new scale names
    var xBarScale = d3.scaleLinear()
        .range([0, width]);

    var x = d3.scaleTime()
        .range([0, width]);


    var y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

    var colors = d3.scaleOrdinal(d3.schemeCategory20);


    var xAxisLine = d3.axisBottom(x).tickFormat(timeFormat).ticks(6);


    // When scrolling to a new section
    // the activation function for that
    // section is called.
    var activateFunctions = [];
    // If a section has an update function
    // then it is called while scrolling
    // through the section with the current
    // progress through the section.
    var updateFunctions = [];

    /**
     * setupVis - creates initial elements for all
     * sections of the visualization.
     *
     * @param wordData - data object for each word.
     * @param fillerCounts - nested data that includes
     *  element for each filler word type.
     * @param histData - binned histogram data
     */
    var setupVis = function (data) {
        console.log("setupVis");
        // count openvis title
        g.append('text')
            .attr('class', 'title openvis-title')
            .attr('x', width / 2)
            .attr('y', height / 3)
            .text("We're Open");

        g.append('text')
            .attr('class', 'sub-title openvis-title')
            .attr('x', width / 2)
            .attr('y', (height / 3) + (height / 10))
            .text("Business Hours in Boston");

        g.selectAll('.openvis-title')
            .attr('opacity', 0);


        var categoriesChartG = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("id", "categoriesChartG").attr("opacity", 0);
        var neighborhoodsChartG = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("id", "neighborhoodsChartG").attr("opacity", 0);
        var updateMoveBoxG = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("id", "updateMoveBoxG").attr("opacity", 0);
        var squareGridG = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("id", "squareGridG").attr("opacity", 1);

        var button = squareGridG.append('rect')
            .attr("class", "square-button")
            .attr("width", 100)
            .attr("height", 35)
            .attr("fill", "dimgray");

        button.append("text")
            .attr("x", 15)
            .attr("y", 15)
            .attr("dy", ".35em")
            .text("8:00am")
            .attr("value1", 1000);

        document.getElementById('start-hour').addEventListener('change', function() {
            var currentValue = this.value;
            console.log(currentValue);
            var closedSquares = squares.filter(function(d,i) {
                return +d.hours[0].start >= currentValue;
            })
            squares.transition()
            closedSquares.transition().duration(600).style("opacity", 0.25);
            // console.log(openSquares)

        });

        d3.select(".square-button").on("click", function() {
            // squares.attr("opacity", 0.25);
            var closedSquares = squares.filter(function(d,i) {
                return +d.hours[0].start >= 700;
            })
            closedSquares.transition().duration(600).style("opacity", 0.25);
            // console.log(openSquares)

        })

        var squares = g.selectAll('.square').data(squaresData);
        var squaresE = squares.enter()
            .append('rect')
            .classed('square', true);
        squares = squares.merge(squaresE)
            .attr('width', squareSize)
            .attr('height', squareSize)
            .attr('fill', function (d) {
                return categoriesColors[d.properties.metacategory];
            })
            .attr('x', function (d) {
                return d.x;
            })
            .attr('y', function (d) {
                return d.y;
            });


        // var box = svg.append('rect')
        //     .attr('x', -1 * width)
        //     .attr('y', -1 * height)
        //     .attr('height', height)
        //     .attr('width', width)
        //     .attr('class', 'box')
        //     .attr('transform', 'rotate(180)')
        //     .style('fill', '#ffffff')

        sortCategories[filterField].forEach(function (d, i, callback) {
            var name = d.replace(/\s+/g, '');
            var humanReadableName = d;
            var chartSetupObject = {};
            chartSetupObject.data = data[0].features[0][d];
            chartSetupObject.data.max = d3.max(chartSetupObject.data, function (d) {
                return d.total;
            });
            // chartSetupObject.average = data.features[0]["Average"];
            // chartSetupObject.div = d3.select("#line-charts").append("div").attr("id", name).attr("class", "chart-container"),
            // chartSetupObject.title = chartSetupObject.div.append("div").attr("class", "section-title").text(d),

            chartSetupObject.g = categoriesChartG.append("g").attr("id", name);
            createMultiChart(chartSetupObject, name, i);
            // createNeighborhoodLabels(name,i);
        })

        sortCategories.neighborhoodNames.forEach(function (d, i, callback) {
            var name = d.replace(/\s+/g, '');
            var humanReadableName = d;
            var chartSetupObject = {};
            chartSetupObject.data = data[1].features[0][d];
            chartSetupObject.data.max = d3.max(chartSetupObject.data, function (d) {
                return d.total;
            });
            // chartSetupObject.average = data.features[0]["Average"];
            // chartSetupObject.div = d3.select("#line-charts").append("div").attr("id", name).attr("class", "chart-container"),
            // chartSetupObject.title = chartSetupObject.div.append("div").attr("class", "section-title").text(d),

            chartSetupObject.g = neighborhoodsChartG.append("g").attr("id", name);
            createMultiChart(chartSetupObject, name, i);
            // createNeighborhoodLabels(name,i);
        })


        function createMultiChart(chartSetupObject, name, i) {

            var color = colors(i);
            var nameID = "#" + name,
                data = chartSetupObject.data,
                max = data.max;
            // average = chartSetupObject.average,
            var multichartG = d3.select(nameID);
            // x = d3.scaleLinear()
            //     .domain(d3.extent(data, function (d) {
            //         return strictIsoParse(d.dateTime);
            //     }))
            //     .range([0, chartSetupObject.width]),


            x = d3.scaleTime()
                .domain(d3.extent(data, function (d) {
                    return strictIsoParse(d.dateTime);
                }))
                .range([0, width]),


                y = d3.scaleLinear()
                    .domain([0, 100])
                    .range([height, 0]);


            var line = d3.line()
                .curve(d3.curveNatural)
                .x(function (d, i) {
                    return x(strictIsoParse(d.dateTime));
                })
                .y(function (d, i) {
                    var _percentOpen = (d.total / max) * 100;
                    if (_percentOpen > 100 || _percentOpen < 0) {
                        console.log(_percentOpen);
                    }
                    return y(_percentOpen);
                });


            multichartG.append("path")
                .attr("class", "line")
                .attr("id", name)
                .style("stroke", function (e) {
                    return color;
                })
                .style("fill", function (e) {
                    return color;
                })
                .style("fill-opacity", 0.05)
                .attr("d", line(data));

            if (i == 0) {
                chartSetupObject.g.append("g")
                    .attr("class", "axis axis--x")
                    .attr("transform", "translate(0," + y(0) + ")")
                    .call(d3.axisBottom(x).tickFormat(timeFormat).ticks(6)
                    );
                chartSetupObject.g.append("g")
                    .attr("class", "axis axis--y")
                    .call(d3.axisLeft(y).ticks(4));
            }


        }

        function createNeighborhoodLabels(name, i) {
            var color = colors(i);
            console.log(color);
            var _nameId = "#" + name;
            var _nameContainer = d3.select("#neighborhood-names");
            _nameContainer.append("div").attr("id", name).attr("class", "neighborhood-label");
            jQuery(_nameId).html(name);
            $("#" + name).css({"color": color});

        }


    };


    /**
     * chart
     *
     * @param selection - the current d3 selection(s)
     *  to draw the visualization in. For this
     *  example, we will be drawing it in #vis
     */
    var chart = function (selection) {
        selection.each(function (data) {
            // create svg and give it a width and height
            svg = d3.select(this).append('svg');
            // @v4 use merge to combine enter and existing selection
            svg.attr('width', width + margin.left + margin.right);
            svg.attr('height', height + margin.top + margin.bottom);

            svg.append('g');


            // this group element will be used to contain all
            // other elements.
            g = svg.select('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            x.domain(d3.extent(data, function (d) {
                return strictIsoParse(d.dateTime);
            }))

            setupVis(data);

            setupSections();
        });
    };

    /**
     * setupSections - each section is activated
     * by a separate function. Here we associate
     * these functions to the sections based on
     * the section's index.
     *
     */
    var setupSections = function () {
        // activateFunctions are called each
        // time the active section changes
        activateFunctions[0] = showTitle;
        activateFunctions[1] = showCategoriesChart;
        activateFunctions[2] = showNeighborhoodsChart;


        // updateFunctions are called while
        // in a particular section to update
        // the scroll progress in that section.
        // Most sections do not need to be updated
        // for all scrolling and so are set to
        // no-op functions.
        for (var i = 0; i < 9; i++) {
            updateFunctions[i] = function () {
            };
        }
        updateFunctions[2] = updateMoveBox;
    };

    /**
     * ACTIVATE FUNCTIONS
     *
     * These will be called their
     * section is scrolled to.
     *
     * General pattern is to ensure
     * all content for the current section
     * is transitioned in, while hiding
     * the content for the previous section
     * as well as the next section (as the
     * user may be scrolling up or down).
     *
     */

    /**
     * showTitle - initial title
     *
     * hides: count title
     * (no previous step to hide)
     * shows: intro title
     *
     */
    function showTitle() {
        svg.select('#categoriesChartG')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.selectAll('.openvis-title')
            .transition()
            .duration(600)
            .attr('opacity', 1.0);
    }

    function showCategoriesChart() {
        g.selectAll('.openvis-title')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        svg.select('#neighborhoodsChartG')
            .transition()
            .duration(0)
            .attr('opacity', 00);

        svg.select('#categoriesChartG')
            .transition()
            .duration(600)
            .attr('opacity', 1.0);
    }

    function showNeighborhoodsChart() {
        svg.select('#categoriesChartG')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        svg.select('#neighborhoodsChartG')
            .transition()
            .duration(600)
            .attr('opacity', 1.0);

        g.selectAll('.box').transition().duration(600).attr("opacity", 1.0);

    }

    /**
     * UPDATE FUNCTIONS
     *
     * These will be called within a section
     * as the user scrolls through it.
     *
     * We use an immediate transition to
     * update visual elements based on
     * how far the user has scrolled
     *
     */

    function updateMoveBox(progress) {
        var bizarroProgress = d3.scaleLinear().domain([0, 1]).range([1, 0]);
        console.log(bizarroProgress(progress));

        svg.selectAll(".box").transition()
            .duration(3000)
            .ease(d3.easeLinear)
            .attr('width', 0);

        // svg.select("#updateMoveBoxG").selectAll(".box")
        //     .transition()
        //     .duration(0)
        //     .attr('opacity', bizarroProgress(progress))
        //     .attr('transform','translate(0,' + (progress * 50) + ')');
    }


    /**
     * groupByWord - group words together
     * using nest. Used to get counts for
     * barcharts.
     *
     * @param words
     */
    function groupByWord(words) {
        return d3.nest()
            .key(function (d) {
                return d.word;
            })
            .rollup(function (v) {
                return v.length;
            })
            .entries(words)
            .sort(function (a, b) {
                return b.value - a.value;
            });
    }

    /**
     * activate -
     *
     * @param index - index of the activated section
     */
    chart.activate = function (index) {
        activeIndex = index;
        var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
        var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
        scrolledSections.forEach(function (i) {
            activateFunctions[i]();
        });
        lastIndex = activeIndex;
    };

    /**
     * update
     *
     * @param index
     * @param progress
     */
    chart.update = function (index, progress) {
        updateFunctions[index](progress);
    };

    // return chart function
    return chart;
};


/**
 * display - called once data
 * has been loaded.
 * sets up the scroller and
 * displays the visualization.
 *
 * @param data - loaded tsv data
 */
function display(error, categoriesData, neighborhoodsData) {
    if (error) throw error;
    // create a new plot and
    // display it


    var data = [categoriesData, neighborhoodsData];
    console.log(data);
    var plot = scrollVis();
    d3.select('#vis')
        .datum(data)
        .call(plot);

    // setup scroll functionality
    var scroll = scroller().container(d3.select('#graphic'));

    // pass in .step selection as the steps
    scroll(d3.selectAll('.step'));

    // setup event handling
    scroll.on('active', function (index) {
        // highlight current step text
        d3.selectAll('.step')
            .style('opacity', function (d, i) {
                return i === index ? 1 : 0.1;
            });

        // activate current section
        plot.activate(index);
    });

    scroll.on('progress', function (index, progress) {
        plot.update(index, progress);
    });
}


//get neighborhood names and categories from dataset, then run chart setup
function processData(error, points, callback) {
    if (error) throw error;

    points.features.sort(function (x, y) {
        return d3.ascending(x.properties.metacategory, y.properties.metacategory) || d3.ascending(+x.hours[0].start, +y.hours[0].start);

    })
    var squaresData = getSquares(points.features);

    function getSquares(dataset) {
        return dataset.map(function (d, i) {
            // positioning for square visual
            // stored here to make it easier
            // to keep track of.
            d.col = i % numPerRow;
            d.x = d.col * (squareSize + squarePad);
            d.row = Math.floor(i / numPerRow);
            d.y = d.row * (squareSize + squarePad);
            return d;
        });
    }


    originalData = squaresData;

    points.features.forEach(function (d) {
        //test for neighborhood in sortCategories.neighborhoodNames, then add to array if missing
        var neighborhood = d.properties.neighborhood;
        if (sortCategories.neighborhoodNames.indexOf(neighborhood) > -1) {
        }
        else if (neighborhood === null) {
        }
        else {
            sortCategories.neighborhoodNames.push(neighborhood);
            // if (dataField == "neighborhoodNames") {
            _totals[neighborhood] = []
            // }
            ;
        }
        //test for metacategory in array, then add if missing
        var metacategory = d.properties.metacategory;
        if (sortCategories.metacategories.indexOf(metacategory) > -1) {
        }
        else {
            sortCategories.metacategories.push(metacategory);
            // if (dataField == "metacategory") {
            _totals[metacategory] = []
            // }
            ;
        }
    })

    sortCategories.neighborhoodNames.sort();
    sortCategories.metacategories.sort();
    data = points.features;
    console.log(sortCategories);
    d3.queue()
        .defer(d3.json, "/scroll_demo/data/minutes-values-datetime-categories.json")
        .defer(d3.json, "/scroll_demo/data/minutes-values-datetime-neighborhoods.json")
        .await(display);
}

d3.queue()
    .defer(d3.json, "/scroll_demo/data/places-hours-neighborhoods.geojson")
    .await(processData);


// var lineChartData = [];
// var _totalActive = 0;

// var _averages = {};
// var time = 00;
// var previousTime;
// var date = new Date(2017, 2, 6, 0, 0, 0, 0);
//
// svgChart.attr("height", h).attr("width", w);
