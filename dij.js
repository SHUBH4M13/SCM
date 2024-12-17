const mysql = require("mysql2");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Shubham13",
  database: "SCM",
  connectionLimit: 10, 
});

// Fetch node names from the database
async function getNodeNames() {
  return new Promise((resolve, reject) => {
    const query = 'SELECT n_id, n_name FROM node'; 
    pool.query(query, (err, results) => {
      if (err) return reject(err);

      // Create an object to map node IDs to their names
      const nodeNames = {};
      results.forEach(row => {
        nodeNames[row.n_id] = row.n_name;
      });

      resolve(nodeNames);
    });
  });
}

function dijkstra(graph, source) {
  const distances = {};
  const previous = {};
  const visited = new Set();
  const priorityQueue = [];

  // Initialize distances and priority queue
  for (let node in graph) {
    distances[node] = Infinity;
    previous[node] = null;
  }
  distances[source] = 0;

  priorityQueue.push({ node: source, distance: 0 });

  while (priorityQueue.length > 0) {
    // Get the node with the smallest distance
    priorityQueue.sort((a, b) => a.distance - b.distance);
    const { node: currentNode } = priorityQueue.shift();

    if (visited.has(currentNode)) continue;
    visited.add(currentNode);

    // Check neighbors
    for (let neighbor of graph[currentNode]) {
      const { to: neighborNode, weight } = neighbor;

      // Calculate distance
      const newDistance = distances[currentNode] + weight;

      if (newDistance < distances[neighborNode]) {
        distances[neighborNode] = newDistance;
        previous[neighborNode] = currentNode;

        // Push to queue
        priorityQueue.push({ node: neighborNode, distance: newDistance });
      }
    }
  }

  return { distances, previous };
}

// Find the closest distributor to customer
async function findClosestDistributor(graph, distributors, customer, nodeNames) {
  const { distances } = dijkstra(graph, customer);

  let closestDistributor = null;
  let minDistance = Infinity;

  for (let distributor of distributors) {
    if (distances[distributor] < minDistance) {
      minDistance = distances[distributor];
      closestDistributor = distributor;
    }
  }

  return {
    distributorId: closestDistributor,
    distributorName: nodeNames[closestDistributor],
    distance: minDistance
  };
}

// Find the closest supplier to distributor
async function findClosestSupplier(graph, suppliers, distributor, nodeNames) {
  const { distances } = dijkstra(graph, distributor);

  let closestSupplier = null;
  let minDistance = Infinity;

  for (let supplier of suppliers) {
    if (distances[supplier] < minDistance) {
      minDistance = distances[supplier];
      closestSupplier = supplier;
    }
  }

  return {
    supplierId: closestSupplier,
    supplierName: nodeNames[closestSupplier],
    distance: minDistance
  };
}

// Main function to find closest supply chain
async function findClosestSupplyChain(graph, suppliers, distributors, customer) {
  try {
    const nodeNames = await getNodeNames(); // Fetch node names

    // Step 1: Find closest distributor to customer
    const closestDistributor = await findClosestDistributor(graph, distributors, customer, nodeNames);

    // Step 2: Find closest supplier to the distributor
    const closestSupplier = await findClosestSupplier(graph, suppliers, closestDistributor.distributorId, nodeNames);

    // Return result
    return {
      supplier: closestSupplier,
      distributor: closestDistributor,
      customer: { customerId: customer, customerName: nodeNames[customer] }
    };
  } catch (err) {
    console.error("Error:", err);
  }
}

// Export the main function to be used in backend
module.exports = { findClosestSupplyChain };
