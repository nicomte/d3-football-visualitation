function topPlayerComparison(selectedYear, selectedMetric, selectedCountry, container) {
    const dataSource = "../assets/individual_data/full_career_topplayers.csv";

    const width = 928;
    const height = width;
    const marginTop = 30;
    const marginRight = -1;
    const marginBottom = -1;
    const marginLeft = 1;

    d3.csv(dataSource).then(function (data) {
        // Filter data by country
        const countryData = data.filter((d) => d.country === selectedCountry);
        // console.log(countryData);

        // Parse yearParam to number
        const selectedYearNum = +selectedYear;

        const yearRange = [...new Set(countryData.map((d) => +d.year))].sort((a, b) => a - b);

        let filteredYears;
        if (selectedYearNum - Math.min(...yearRange) < 3) {
            // Use future years if fewer than 3 previous years are available
            filteredYears = yearRange.filter((year) => year >= selectedYearNum && year <= selectedYearNum + 3);
        } else {
            // Use past years
            filteredYears = yearRange.filter((year) => year <= selectedYearNum && year >= selectedYearNum - 3);
        }

        // Filter data for selected years and top players
        const filteredData = countryData.filter((d) => filteredYears.includes(+d.year));
        const topPlayers = filteredData
            .filter((d) => d.year == selectedYearNum)
            .sort((a, b) => b[selectedMetric] - a[selectedMetric])
            .slice(0, 10);

        const topPlayerIds = new Set(topPlayers.map((d) => d.player_id));

        // Create adjusted data for all years
        const adjustedData = filteredData
            .filter((d) => topPlayerIds.has(d.player_id))
            .map((d) => ({
                player_id: d.player_id,
                player_name: d.player_name,
                country: d.country,
                year: +d.year,
                metric: +d[selectedMetric] || 0
            }));

        // Group data by year and player name
        const groupedData = d3.group(
            adjustedData,
            (d) => d.year,
            (d) => d.player_name
        );

        // Create color scale
        const color = d3
            .scaleOrdinal(d3.schemeCategory10)
            .domain(Array.from(new Set(adjustedData.map((d) => d.player_name))));

        // Define treemap layout
        const treemap = (data) =>
            d3
                .treemap()
                .round(true)
                .tile(d3.treemapSliceDice)
                .size([width - marginLeft - marginRight, height - marginTop - marginBottom])(
                    d3
                        .hierarchy({
                            children: Array.from(groupedData.entries()).map(([year, players]) => ({
                                year: year,
                                children: Array.from(players.entries()).map(([player_name, values]) => ({
                                    player_name: player_name,
                                    metric: d3.sum(values, (d) => d.metric)
                                }))
                            }))
                        })
                        .sum((d) => d.metric)
                )
                .each((d) => {
                    d.x0 += marginLeft;
                    d.x1 += marginLeft;
                    d.y0 += marginTop;
                    d.y1 += marginTop;
                });

        const root = treemap(adjustedData);

        // Create the SVG container
        const svg = container
            .append("svg")
            .attr("viewBox", [0, 0, width, height])
            .attr("width", width)
            .attr("height", height)
            .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

        // Formatting function
        const format = (d) => d.toLocaleString();

        // Render player nodes (leaves)
        const node = svg
            .selectAll("g")
            .data(root.descendants().filter((d) => d.depth === 2))
            .join("g")
            .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

        node.append("rect")
            .attr("fill", (d) => color(d.data.player_name))
            .attr("fill-opacity", (d) => d.value / d.parent.value * 2.5)
            .attr("width", (d) => Math.max(d.x1 - d.x0 - 1, 1))
            .attr("height", (d) => Math.max(d.y1 - d.y0 - 1, 1));

        // Add text labels only if value >= 3% of the total
        node.filter((d) => d.value / d.parent.value >= 0.03)
            .append("text")
            .attr("x", 3)
            .attr("y", "1.1em")
            .text((d) => d.data.player_name);

        // Add text labels with special handling for values < 3% and skipping 0 values
        node.filter((d) => d.value > 0) // Only include nodes with value > 0
            .append("text")
            .attr("x", 3)
            .attr("y", "1.1em")
            .text((d) => {
                const percentage = d.value / d.parent.value;
                if (percentage >= 0.03) {
                } else {
                    return `${d.data.player_name} ${d.value}`; // Name with value for values < 3%
                }
            });


        node.filter((d) => d.value / d.parent.value >= 0.03)
            .append("text")
            .attr("x", 3)
            .attr("y", "2.3em")
            .attr("fill-opacity", 1)
            .text((d) => format(d.value));

        // Render year columns
        const column = svg
            .selectAll(".column")
            .data(root.descendants().filter((d) => d.depth === 1))
            .join("g")
            .attr("class", "column")
            .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

        column
            .append("text")
            .attr("x", 3)
            .attr("y", "-1.7em")
            .style("font-weight", "bold")
            .style("font-size", "11.5px")
            .text((d) => d.data.year);

        column
            .append("text")
            .attr("x", 3)
            .attr("y", "-0.5em")
            .attr("fill-opacity", 0.7)
            .text((d) => format(d.value));
    });
}
