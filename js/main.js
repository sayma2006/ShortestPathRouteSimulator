
document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. GET HTML ELEMENTS
    // ==========================================

    const sourceSelect = document.getElementById("sourceNode");
    const destinationSelect = document.getElementById("destinationNode");

    const runBtn = document.getElementById("runBtn");
    const stepBtn = document.getElementById("stepBtn");
    const resetBtn = document.getElementById("resetBtn");
    const resetGraphBtn = document.getElementById("resetGraphBtn");
    const addNodeBtn = document.getElementById("addNodeBtn");
    const themeToggle = document.getElementById("themeToggle");

    const shortestPath = document.getElementById("shortestPath");
    const totalCost = document.getElementById("totalCost");
    const nodesVisited = document.getElementById("nodesVisited");

    const graphStatus = document.getElementById("graphStatus");
    const simulationMessage = document.getElementById("simulationMessage");
    const resultStatus = document.getElementById("resultStatus");

    const stepCounter = document.getElementById("stepCounter");
    const progressBar = document.getElementById("progressBar");
    const stepExplanation = document.getElementById("stepExplanation");
    const distanceTable = document.getElementById("distanceTable");

    // ==========================================
    // 2. SIMULATION STATE
    // ==========================================

    let result = null;
    let currentStepIndex = 0;
    let animationTimer = null;

    let visualState = {
        source: "A",
        destination: "D",
        visited: [],
        current: null,
        path: [],
        packetProgress: -1
    };

    // ==========================================
    // 3. POPULATE SOURCE AND DESTINATION MENUS
    // ==========================================

    function populateNodeMenus() {
        const nodes = Graph.getNodes();

        const oldSource = sourceSelect.value || "A";
        const oldDestination = destinationSelect.value || "D";

        sourceSelect.innerHTML = "";
        destinationSelect.innerHTML = "";

        nodes.forEach((node) => {
            const sourceOption = document.createElement("option");
            sourceOption.value = node.id;
            sourceOption.textContent = node.id;
            sourceSelect.appendChild(sourceOption);

            const destinationOption = document.createElement("option");
            destinationOption.value = node.id;
            destinationOption.textContent = node.id;
            destinationSelect.appendChild(destinationOption);
        });

        sourceSelect.value = nodes.some(n => n.id === oldSource)
            ? oldSource
            : (nodes[0]?.id || "");

        destinationSelect.value = nodes.some(n => n.id === oldDestination)
            ? oldDestination
            : (nodes[nodes.length - 1]?.id || "");
    }

    // ==========================================
    // 4. UPDATE GRAPH
    // ==========================================

    function renderGraph() {
        Graph.render(visualState);
    }

    function stopAnimation() {
        if (animationTimer !== null) {
            clearInterval(animationTimer);
            animationTimer = null;
        }
    }

    // ==========================================
    // 5. RESET RESULTS
    // ==========================================

    function clearResults(message = "Choose a source and destination, then run the algorithm.") {
        stopAnimation();

        result = null;
        currentStepIndex = 0;

        visualState = {
            source: sourceSelect.value,
            destination: destinationSelect.value,
            visited: [],
            current: null,
            path: [],
            packetProgress: -1
        };

        if (shortestPath) shortestPath.textContent = "—";
        if (totalCost) totalCost.textContent = "—";
        if (nodesVisited) nodesVisited.textContent = "0";

        if (simulationMessage) simulationMessage.textContent = message;
        if (resultStatus) resultStatus.textContent = "Ready";
        if (graphStatus) graphStatus.textContent = "Ready";

        if (stepCounter) stepCounter.textContent = "0 / 0";
        if (progressBar) progressBar.style.width = "0%";

        if (stepExplanation) {
            stepExplanation.textContent =
                "The algorithm's explanation will appear here.";
        }

        if (distanceTable) {
            distanceTable.innerHTML =
                "<tr><td colspan='3'>Run the algorithm to see distances.</td></tr>";
        }

        renderGraph();
    }

    // ==========================================
    // 6. UPDATE DISTANCE TABLE
    // ==========================================

    function updateDistanceTable(step) {
        if (!distanceTable || !step) return;

        distanceTable.innerHTML = "";

        Graph.getNodes().forEach((node) => {
            const id = node.id;
            const distance = step.distances[id];
            const previous = step.previous[id];

            const row = document.createElement("tr");

            const nodeCell = document.createElement("td");
            nodeCell.textContent = id;

            const distanceCell = document.createElement("td");
            distanceCell.textContent =
                distance === Infinity ? "∞" : distance;

            const previousCell = document.createElement("td");
            previousCell.textContent = previous ?? "—";

            row.appendChild(nodeCell);
            row.appendChild(distanceCell);
            row.appendChild(previousCell);

            distanceTable.appendChild(row);
        });
    }

    // ==========================================
    // 7. DISPLAY ONE ALGORITHM STEP
    // ==========================================

    function displayStep(index) {
        if (!result || !result.steps.length) return;

        currentStepIndex = Math.max(
            0,
            Math.min(index, result.steps.length - 1)
        );

        const step = result.steps[currentStepIndex];

        visualState = {
            source: result.source,
            destination: result.destination,
            visited: step.visited || [],
            current: step.current,
            path: step.path || [],
            packetProgress: -1
        };

        renderGraph();
        updateDistanceTable(step);

        if (stepExplanation) {
            stepExplanation.textContent = step.explanation;
        }

        if (stepCounter) {
            stepCounter.textContent =
                `${currentStepIndex + 1} / ${result.steps.length}`;
        }

        if (progressBar) {
            const percentage = result.steps.length > 1
                ? (currentStepIndex / (result.steps.length - 1)) * 100
                : 100;

            progressBar.style.width = `${percentage}%`;
        }

        if (nodesVisited) {
            nodesVisited.textContent = step.visited.length;
        }

        if (currentStepIndex === result.steps.length - 1) {
            showFinalResult();
        } else {
            if (resultStatus) resultStatus.textContent = "In progress";
            if (graphStatus) graphStatus.textContent = "Algorithm running";
        }
    }

    // ==========================================
    // 8. SHOW FINAL RESULT
    // ==========================================

    function showFinalResult() {
        if (!result) return;

        const finalStep = result.steps[result.steps.length - 1];

        visualState = {
            source: result.source,
            destination: result.destination,
            visited: result.visited,
            current: result.reachable ? result.destination : null,
            path: result.path,
            packetProgress: -1
        };

        renderGraph();

        if (shortestPath) {
            shortestPath.textContent = result.reachable
                ? result.path.join(" → ")
                : "No route found";
        }

        if (totalCost) {
            totalCost.textContent = result.reachable
                ? result.cost
                : "∞";
        }

        if (nodesVisited) {
            nodesVisited.textContent = result.visited.length;
        }

        if (simulationMessage) {
            simulationMessage.textContent = result.reachable
                ? `Shortest route found with a total cost of ${result.cost}.`
                : `No route connects ${result.source} to ${result.destination}.`;
        }

        if (resultStatus) {
            resultStatus.textContent = result.reachable
                ? "Route found"
                : "Unreachable";
        }

        if (graphStatus) {
            graphStatus.textContent = result.reachable
                ? "Simulation complete"
                : "No route available";
        }

        if (stepExplanation && finalStep) {
            stepExplanation.textContent = finalStep.explanation;
        }
    }

    // ==========================================
    // 9. RUN THE COMPLETE ALGORITHM
    // ==========================================

    function runAlgorithm() {
        stopAnimation();

        const source = sourceSelect.value;
        const destination = destinationSelect.value;

        if (!source || !destination) {
            alert("Please select a source and destination.");
            return;
        }

        if (source === destination) {
            // Dijkstra correctly returns a zero-cost route to itself.
        }

        result = Dijkstra.calculate(
            Graph.getNodes(),
            Graph.getEdges(),
            source,
            destination
        );

        displayStep(result.steps.length - 1);
    }

    // ==========================================
    // 10. STEP-BY-STEP EXECUTION
    // ==========================================

    function nextStep() {
        stopAnimation();

        const source = sourceSelect.value;
        const destination = destinationSelect.value;

        if (!source || !destination) {
            alert("Please select a source and destination.");
            return;
        }

        if (
            !result ||
            result.source !== source ||
            result.destination !== destination
        ) {
            result = Dijkstra.calculate(
                Graph.getNodes(),
                Graph.getEdges(),
                source,
                destination
            );

            currentStepIndex = -1;
        }

        if (currentStepIndex >= result.steps.length - 1) {
            clearResults("The simulation has finished. Run it again to restart.");
            return;
        }

        displayStep(currentStepIndex + 1);
    }

    // ==========================================
    // 11. ANIMATE ROUTE
    // ==========================================

    function animateRoute() {
        if (!result || !result.reachable || result.path.length < 2) {
            return;
        }

        stopAnimation();

        let progress = 0;
        const lastEdgeIndex = result.path.length - 2;

        visualState.path = result.path;
        visualState.visited = result.visited;

        animationTimer = setInterval(() => {
            visualState.packetProgress = progress;
            renderGraph();

            progress++;

            if (progress > lastEdgeIndex) {
                stopAnimation();
                visualState.packetProgress = -1;
                renderGraph();
            }
        }, 650);
    }

    // ==========================================
    // 12. BUTTON EVENTS
    // ==========================================

    if (runBtn) {
        runBtn.addEventListener("click", () => {
            runAlgorithm();

            if (result && result.reachable) {
                animateRoute();
            }
        });
    }

    if (stepBtn) {
        stepBtn.addEventListener("click", nextStep);
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            clearResults();
        });
    }

    if (resetGraphBtn) {
        resetGraphBtn.addEventListener("click", () => {
            stopAnimation();
            Graph.reset();
            populateNodeMenus();
            clearResults("The default network has been restored.");
        });
    }

    if (addNodeBtn) {
        addNodeBtn.addEventListener("click", () => {
            stopAnimation();

            const node = Graph.addNode();

            if (node) {
                populateNodeMenus();
                destinationSelect.value = node.id;
                clearResults(`Node ${node.id} added. Connect it to other nodes to create a route.`);
            }
        });
    }

    // Recalculate after an edge is edited or broken.
    document.addEventListener("graphChanged", () => {
        clearResults("Network changed. Run Dijkstra again.");
    });

    sourceSelect.addEventListener("change", () => {
        clearResults("Source changed. Run the algorithm again.");
    });

    destinationSelect.addEventListener("change", () => {
        clearResults("Destination changed. Run the algorithm again.");
    });

    // ==========================================
    // 13. DARK / LIGHT THEME
    // ==========================================

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-theme");

            themeToggle.textContent =
                document.body.classList.contains("dark-theme")
                    ? "☀️"
                    : "🌙";
        });
    }

    // ==========================================
    // 14. INITIALIZE WEBSITE
    // ==========================================

    populateNodeMenus();
    clearResults();

});
