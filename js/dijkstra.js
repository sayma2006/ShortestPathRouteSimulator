
const Dijkstra = (() => {

    // Find the node with the smallest distance
    // that has not yet been visited.
    function getMinimumDistanceNode(nodes, distances, visited) {
        let minimumDistance = Infinity;
        let minimumNode = null;

        // Check nodes in their original order.
        // This makes tie handling deterministic.
        for (const node of nodes) {
            const id = node.id;

            if (
                !visited.includes(id) &&
                distances[id] < minimumDistance
            ) {
                minimumDistance = distances[id];
                minimumNode = id;
            }
        }

        return minimumNode;
    }

    // Create a copy of an object for storing each step.
    function copyObject(object) {
        return { ...object };
    }

    // Main Dijkstra algorithm
    function calculate(nodes, edges, source, destination) {

        const distances = {};
        const previous = {};
        const visited = [];
        const steps = [];

        // STEP 1: Initialize distances.
        for (const node of nodes) {
            distances[node.id] = Infinity;
            previous[node.id] = null;
        }

        // Distance from source to itself is zero.
        distances[source] = 0;

        // Save the initial state.
        steps.push({
            type: "initialize",
            current: null,
            visited: [...visited],
            distances: copyObject(distances),
            previous: copyObject(previous),
            explanation:
                `Initialized all distances. ` +
                `Distance from ${source} to itself is 0.`
        });

        // STEP 2: Process nodes one by one.
        while (true) {

            const current = getMinimumDistanceNode(
                nodes,
                distances,
                visited
            );

            // No reachable unvisited node remains.
            if (current === null) {
                break;
            }

            // Mark current node as visited.
            visited.push(current);

            steps.push({
                type: "visit",
                current: current,
                visited: [...visited],
                distances: copyObject(distances),
                previous: copyObject(previous),
                explanation:
                    `Selected node ${current}, ` +
                    `whose current distance is ${distances[current]}.`
            });

            // Stop when the destination is reached.
            if (current === destination) {
                break;
            }

            // STEP 3: Check all edges from the current node.
            for (const edge of edges) {

                // Ignore broken connections.
                if (edge.broken) {
                    continue;
                }

                let neighbor = null;

                // The graph is undirected.
                if (edge.from === current) {
                    neighbor = edge.to;
                } else if (edge.to === current) {
                    neighbor = edge.from;
                }

                // This edge is not connected to current.
                if (neighbor === null) {
                    continue;
                }

                // Do not revisit completed nodes.
                if (visited.includes(neighbor)) {
                    continue;
                }

                // Calculate the new possible distance.
                const newDistance =
                    distances[current] + Number(edge.cost);

                // STEP 4: Update if the route is shorter.
                if (newDistance < distances[neighbor]) {

                    distances[neighbor] = newDistance;
                    previous[neighbor] = current;

                    steps.push({
                        type: "update",
                        current: current,
                        visited: [...visited],
                        distances: copyObject(distances),
                        previous: copyObject(previous),
                        explanation:
                            `Updated distance to ${neighbor} ` +
                            `to ${newDistance} through ${current}.`
                    });

                } else {

                    steps.push({
                        type: "check",
                        current: current,
                        visited: [...visited],
                        distances: copyObject(distances),
                        previous: copyObject(previous),
                        explanation:
                            `Checked ${current} → ${neighbor}. ` +
                            `The existing distance to ${neighbor} ` +
                            `is not improved.`
                    });
                }
            }
        }

        // STEP 5: Reconstruct the shortest route.
        const path = [];

        if (distances[destination] !== Infinity) {

            let current = destination;

            while (current !== null) {
                path.unshift(current);
                current = previous[current];
            }
        }

        const reachable = path.length > 0;

        const cost = reachable
            ? distances[destination]
            : Infinity;

        // Save the final result.
        steps.push({
            type: "complete",
            current: reachable ? destination : null,
            visited: [...visited],
            distances: copyObject(distances),
            previous: copyObject(previous),
            path: [...path],
            cost: cost,
            reachable: reachable,
            explanation: reachable
                ? `Shortest route found: ${path.join(" → ")}. ` +
                  `Total cost: ${cost}.`
                : `No route exists from ${source} to ${destination}.`
        });

        return {
            source: source,
            destination: destination,
            distances: distances,
            previous: previous,
            visited: visited,
            path: path,
            cost: cost,
            reachable: reachable,
            steps: steps
        };
    }

    // Make calculate() available to main.js.
    return {
        calculate: calculate
    };

})();
