
/* =========================================
   SHORTEST PATH ROUTE SIMULATOR
   File: js/graph.js

   Responsibilities:
   1. Store network nodes and connections.
   2. Draw the graph using SVG.
   3. Allow edge costs to be edited.
   4. Allow connections to be broken/restored.
   5. Support adding a new node.
   ========================================= */

const Graph = (() => {
    const SVG_NS = "http://www.w3.org/2000/svg";

    // Default network from the project report.
    const DEFAULT_NODES = [
        { id: "A", x: 90,  y: 95 },
        { id: "B", x: 300, y: 65 },
        { id: "C", x: 150, y: 285 },
        { id: "D", x: 440, y: 205 }
    ];

    const DEFAULT_EDGES = [
        { from: "A", to: "B", cost: 2, broken: false },
        { from: "A", to: "C", cost: 4, broken: false },
        { from: "B", to: "D", cost: 3, broken: false },
        { from: "C", to: "D", cost: 1, broken: false }
    ];

    let nodes = [];
    let edges = [];

    // ---------- Graph State ----------

    function reset() {
        nodes = DEFAULT_NODES.map(node => ({ ...node }));
        edges = DEFAULT_EDGES.map(edge => ({ ...edge }));
        render();
    }

    function getNodes() {
        return nodes.map(node => ({ ...node }));
    }

    function getEdges() {
        return edges.map(edge => ({ ...edge }));
    }

    function getNode(id) {
        return nodes.find(node => node.id === id);
    }

    function getEdge(from, to) {
        return edges.find(edge =>
            (edge.from === from && edge.to === to) ||
            (edge.from === to && edge.to === from)
        );
    }

    // ---------- SVG Helpers ----------

    function createSvgElement(tag, attributes = {}) {
        const element = document.createElementNS(SVG_NS, tag);

        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });

        return element;
    }

    function addText(parent, x, y, text, className) {
        const element = createSvgElement("text", {
            x,
            y,
            class: className
        });

        element.textContent = text;
        parent.appendChild(element);

        return element;
    }

    // ---------- Graph Rendering ----------

    function render(state = {}) {
        const svg = document.getElementById("networkGraph");

        if (!svg) return;

        // Remove the previous drawing.
        svg.replaceChildren();

        const {
            source = "",
            destination = "",
            visited = [],
            current = "",
            path = [],
            packetProgress = -1
        } = state;

        // Draw edges first so nodes appear on top.
        edges.forEach(edge => {
            const fromNode = getNode(edge.from);
            const toNode = getNode(edge.to);

            if (!fromNode || !toNode) return;

            const isPathEdge = path.some((node, index) =>
                index < path.length - 1 &&
                (
                    (path[index] === edge.from &&
                     path[index + 1] === edge.to) ||
                    (path[index] === edge.to &&
                     path[index + 1] === edge.from)
                )
            );

            const group = createSvgElement("g");

            const line = createSvgElement("line", {
                x1: fromNode.x,
                y1: fromNode.y,
                x2: toNode.x,
                y2: toNode.y,
                class: [
                    "graph-edge",
                    edge.broken ? "broken-edge" : "",
                    isPathEdge ? "shortest-path" : ""
                ].filter(Boolean).join(" "),
                tabindex: "0",
                role: "button",
                "aria-label": `${edge.from} to ${edge.to}, cost ${edge.cost}${edge.broken ? ", connection broken" : ""}`
            });

            // Click or keyboard activation edits this connection.
            line.addEventListener("click", () => {
                editEdge(edge.from, edge.to);
            });

            line.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    editEdge(edge.from, edge.to);
                }
            });

            group.appendChild(line);

            // Put the cost label near the middle of the edge.
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;

            const label = String(edge.broken ? "×" : edge.cost);
            const labelWidth = label.length > 1 ? 30 : 24;

            group.appendChild(createSvgElement("rect", {
                x: midX - labelWidth / 2,
                y: midY - 12,
                width: labelWidth,
                height: 24,
                rx: 7,
                class: "graph-edge-label-bg"
            }));

            addText(
                group,
                midX,
                midY + 1,
                label,
                "graph-edge-label"
            );

            svg.appendChild(group);
        });

        // Draw the nodes.
        nodes.forEach(node => {
            const isSource = node.id === source;
            const isDestination = node.id === destination;
            const isVisited = visited.includes(node.id);
            const isCurrent = node.id === current;

            const group = createSvgElement("g", {
                "data-node": node.id
            });

            const circle = createSvgElement("circle", {
                cx: node.x,
                cy: node.y,
                r: 23,
                class: [
                    "graph-node",
                    isSource ? "source-node" : "",
                    isDestination ? "destination-node" : "",
                    isVisited ? "visited-node" : "",
                    isCurrent ? "current-node" : ""
                ].filter(Boolean).join(" ")
            });

            group.appendChild(circle);

            addText(
                group,
                node.x,
                node.y + 1,
                node.id,
                "graph-node-label"
            );

            const description = [
                `Node ${node.id}`,
                isSource ? "source" : "",
                isDestination ? "destination" : "",
                isVisited ? "visited" : ""
            ].filter(Boolean).join(", ");

            group.setAttribute("role", "img");
            group.setAttribute("aria-label", description);

            svg.appendChild(group);
        });

        // Animate a packet along the selected route.
        if (
            path.length > 1 &&
            packetProgress >= 0 &&
            packetProgress < path.length - 1
        ) {
            const fromNode = getNode(path[packetProgress]);
            const toNode = getNode(path[packetProgress + 1]);

            if (fromNode && toNode) {
                const packet = createSvgElement("circle", {
                    cx: (fromNode.x + toNode.x) / 2,
                    cy: (fromNode.y + toNode.y) / 2,
                    r: 8,
                    class: "packet"
                });

                packet.setAttribute("aria-label", "Packet on shortest path");
                svg.appendChild(packet);
            }
        }
    }

    // ---------- Edit Connection ----------

    function editEdge(from, to) {
        const edge = getEdge(from, to);

        if (!edge) return;

        const action = prompt(
            `Connection ${edge.from} — ${edge.to}\n` +
            `Current cost: ${edge.cost}\n` +
            `Status: ${edge.broken ? "Broken" : "Active"}\n\n` +
            `Enter a new positive cost, or type B to ` +
            `${edge.broken ? "restore" : "break"} the connection.\n` +
            `Press Cancel to keep the current settings.`
        );

        if (action === null) return;

        const value = action.trim();

        if (value.toUpperCase() === "B") {
            edge.broken = !edge.broken;
        } else {
            const newCost = Number(value);

            if (value === "" || !Number.isFinite(newCost) || newCost <= 0) {
                alert("Please enter a positive numeric cost, or B to break/restore the connection.");
                return;
            }

            edge.cost = newCost;
            edge.broken = false;
        }

        render();

        // Notify main.js that the graph has changed.
        document.dispatchEvent(new CustomEvent("graphChanged"));
    }

    // ---------- Add Node ----------

    function addNode() {
        if (nodes.length >= 26) {
            alert("The simulator supports up to 26 nodes (A–Z).");
            return null;
        }

        const usedIds = new Set(nodes.map(node => node.id));
        let id = "";

        for (let code = 65; code <= 90; code++) {
            const candidate = String.fromCharCode(code);

            if (!usedIds.has(candidate)) {
                id = candidate;
                break;
            }
        }

        if (!id) return null;

        // Place new nodes around the graph in a simple grid.
        const index = nodes.length;
        const columns = 4;
        const x = 80 + (index % columns) * 140;
        const y = 65 + Math.floor(index / columns) * 95;

        nodes.push({ id, x, y });

        render();

        document.dispatchEvent(new CustomEvent("graphChanged"));

        return id;
    }

    // ---------- Public Interface ----------

    return {
        reset,
        render,
        getNodes,
        getEdges,
        getNode,
        getEdge,
        addNode
    };
})();

// Initialize the report's default network.
Graph.reset();
