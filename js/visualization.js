// Set the dimensions and margins of the graph
var margin = { top: 30, right: 30, bottom: 70, left: 60 },
    width = 800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

// Append the SVG object to the body of the page
var svg = d3
    .select("#d3-object")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var data, x, y;

// Load and parse the data
d3.csv("../assets/country_data.csv").then(function (loadedData) {
    data = loadedData;

    // Initialize X and Y axes
    x = d3.scaleBand().range([0, width]).padding(0.2);
    y = d3.scaleLinear().range([height, 0]);

    // Render the initial chart for 2024 with preselected countries
    updateChart();

    // Event listener for year change
    d3.select("#year").on("change", updateChart);

    // Attach event listener to checkboxes for country selection
    d3.selectAll(".checkboxelement input").on("change", updateChart);

    // Event listener for metric change
    d3.select("#metric").on("change", updateChart);

    // Function to update the chart
    function updateChart() {
        var selectedYear = d3.select("#year").node().value;
        var selectedMetric = d3.select("#metric").node().value;
        var selectedCountries = [];

        d3.selectAll(".checkboxelement input:checked").each(function () {
            selectedCountries.push(this.parentNode.querySelector("label").innerText.trim());
        });

        var filteredData = data.filter(function (d) {
            return d.year === selectedYear && selectedCountries.includes(d.country);
        });

        filteredData.sort(function (a, b) {
            return b[selectedMetric] - a[selectedMetric];
        });

        // Update the X domain based on filtered data
        x.domain(filteredData.map(function (d) {
            return d.country;
        }));

        // Update the Y domain based on the selected metric
        y.domain([0, d3.max(filteredData, function (d) {
            return +d[selectedMetric];
        })]);

        svg.selectAll(".x-axis").remove();
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        svg.selectAll(".x-label").remove();
        svg.append("text")
            .attr("class", "x-label")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .attr("text-anchor", "middle")
            .text("Countries");

        svg.selectAll(".y-axis").remove();
        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        svg.selectAll(".y-label").remove();
        svg.append("text")
            .attr("class", "y-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 13)
            .attr("text-anchor", "middle")
            .text(formatMetric(selectedMetric));

        // Bind country data to bars
        var bars = svg.selectAll("rect").data(filteredData, function(d) {
            return d.country;
        });

        // Create new bars for new data
        bars.enter()
            .append("rect")
            .each(function(d, i) {
                console.log("Binding data to rect:", d, "Index:", i); // Debugging
            })
            .merge(bars)
            .attr("x", function(d) { return x(d.country); })
            .attr("y", function(d) { return y(d[selectedMetric]); })
            .attr("width", x.bandwidth())
            .attr("height", function(d) { return height - y(d[selectedMetric]); })
            .attr("fill", "#69b3a2")
            .on("click", barClickHandler);


        // Remove bars that are no longer in the filtered data
        bars.exit().remove();

        // Add text elements for values on the bars
        var labels = svg.selectAll(".bar-label").data(filteredData, function (d) {
            return d.country;
        });

        labels.enter()
            .append("text")
            .attr("class", "bar-label")
            .merge(labels)
            .attr("x", function (d) { return x(d.country) + x.bandwidth() / 2; })
            .attr("y", function (d) { return y(d[selectedMetric]) + 15; })
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", "#000")
            .text(function (d) { return formatNumber(d[selectedMetric]); });

// Remove labels that are no longer in the filtered data
        labels.exit().remove();
    }
});

function clearMosaic(){
    const comparisonContainer = d3.select("#comparisonContainer");
    comparisonContainer.html("");
}

function barClickHandler(event, d) {
    const data = d3.select(this).datum();
    const selectedYear = d3.select("#year").node().value;
    const selectedMetric = d3.select("#metric").node().value;
    const selectedCountry = data.country;
    
    // Clear the comparison container
    const comparisonContainer = d3.select("#comparisonContainer");
    comparisonContainer.html(""); // Clear previous visualization

    // Call the top player comparison logic
    topPlayerComparison(selectedYear, selectedMetric, selectedCountry, comparisonContainer);
    
}

function toggleOptionalCountries(){
    const optionalCheckboxes = document.getElementById('optionalCheckboxes');
    const toggleButton = document.getElementById('toggleCheckboxesButton');
    const currentDisplay = window.getComputedStyle(optionalCheckboxes).display;

    if (currentDisplay === 'none') {
        optionalCheckboxes.style.display = 'grid';
        toggleButton.textContent = 'Show Less Countries';
    } else {
        optionalCheckboxes.style.display = 'none';
        toggleButton.textContent = 'Show More Countries';
    }
}


function formatMetric(metricId) {
    return metricId
        .replace(/_/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}