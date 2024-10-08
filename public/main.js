// Global variables
let selected = [];

// Chart description to be sent along with the prompt
const chartDesc = ` 
    Chart Type: Scatterplot
    Data Source: Gapminder
    X-axis: Income
    Y-axis: Health
    Size: Population
    Color: Region
`;

// Load data and initialize the chart
d3.csv(
    "https://raw.githubusercontent.com/vega/vega/main/docs/data/gapminder-health-income.csv",
    d3.autoType
).then((data) => {
    // Convert strings to numbers
    // data = d3.autoType(data);
    data.sort((a, b) => b.population - a.population);
    console.log(data);
    // Margin convention
    const margin = {
        top: 50,
        right: 20,
        bottom: 50,
        left: 100,
    };
    const width = 600 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    // Brush
    const brush = d3
        .brush()
        .extent([
            [0, 0],
            [width, height],
        ])
        .on("brush end", brushed);
    // Set scales and axes
    const xScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d.income))
        .range([0, width]);

    const yScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d.health))
        .range([height, 0]);
    // Size scale
    const rScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.population)])
        .range([5, 20]);

    // Color scale
    const cScale = d3
        .scaleOrdinal()
        .domain(data.map((d) => d.region))
        .range(d3.schemeCategory10);
    const xAxis = d3.axisBottom(xScale);
    xAxis.ticks(7, "s");
    const yAxis = d3.axisLeft(yScale);

    // Move SVG by margins
    const chart = d3
        .select("#plot")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X axis
    chart.append("g").attr("transform", `translate(0,${height})`).call(xAxis);

    // Y axis
    chart.append("g").call(yAxis);

    // X axis title
    chart
        .append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .style("font-family", "Arial")
        .text("Income (USD)");

    // Y axis title
    chart
        .append("text")
        .attr("x", -height / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .style("font-family", "Arial")
        .attr("transform", "rotate(-90)")
        .text("Health (index)");

    // Points

    const circles = chart
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", (d) => xScale(d.income))
        .attr("cy", (d) => yScale(d.health))
        .attr("r", (d) => rScale(d.population))
        .style("stroke", "white")
        .style("opacity", 0.7)
        .style("fill", (d) => cScale(d.region));

    // brush
    chart.append("g").attr("class", "brush").call(brush);

    // Brush event handler
    function brushed(event) {
        const selection = event.selection;

        if (selection) {
            const filtered = circles
                .style("fill", "grey")
                .filter(function (d) {
                    return (
                        selection &&
                        selection[0][0] <= xScale(d.income) &&
                        selection[1][0] >= xScale(d.income) &&
                        selection[0][1] <= yScale(d.health) &&
                        selection[1][1] >= yScale(d.health)
                    );
                })
                .style("fill", (d) => cScale(d.region));

            if (event.type === "end") {
                selected = filtered.data(); // save to global variable
                console.log("final selection", selected);
            }
        } else {
            circles.style("fill", (d) => cScale(d.region));
        }
    }
});
// handle button click
document.querySelector("#btn").addEventListener("click", () => {
    // get the user input text from the input box
    const input = document.querySelector("#input").value;
    console.log("Input", input);

    const prompt = `You are a helpful data visualization literacy assistant. 
    
    Please answer the user question based on provided information including the chart description and the selected data points.

    # Chart Description:
    ${chartDesc}

    # Selected Data Points:
    ${selected.length === 0 ? "None" : JSON.stringify(selected, null, 2)}

    # User Question:
    ${input === "" ? "What can you tell me about the chart?" : input}

    `;
    console.log("Prompt", prompt);
    // print the prompt to HTML
    document.querySelector("#prompt").textContent = prompt;

    // ask ChatGPT without CSV agent
    fetch("/api/prompt", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: prompt }),
    })
    .then((response) => response.json())
    .then((response) => {
        // Handle the response data
        console.log("Response received", response);
        // print the response to HTML
        document.querySelector("#response").textContent = response.response;
        // speak the response
        // const utterance = new SpeechSynthesisUtterance(response.response);
        // window.speechSynthesis.speak(utterance);

    })
    .catch((error) => {
        // Handle any errors
        console.error(error);
    });

    // // ask ChatGPT with CSV agent that also have access to the underlying data
    // fetch("/api/prompt-agent", {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({ question: prompt }),
    // })
    //     .then((response) => response.json())
    //     .then((response) => {
    //         // Handle the response data
    //         console.log("Response received", response);
    //         // print the response to HTML
    //         document.querySelector("#response").textContent = response.response;
    //         // speak the response
    //         // const utterance = new SpeechSynthesisUtterance(response.response);
    //         // window.speechSynthesis.speak(utterance);
    //     })
    //     .catch((error) => {
    //         // Handle any errors
    //         console.error(error);
    //     });
});
