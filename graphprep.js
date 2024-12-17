const mysql = require("mysql2");
const { findClosestSupplyChain } = require('./Dij');

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Shubham13",
  database: "SCM",
  connectionLimit: 10,
});

async function main() {
  try {
    const graph = await getGraph(); // Await the result from getGraph

    const distributors = [3,7,8,9];
    const suppliers = [1,2,4,5,6];
    const customer = 11;

    // Await the result of findClosestSupplyChain
    const result = await findClosestSupplyChain(graph, suppliers, distributors, customer);

    return(result);
  } catch (err) {
    console.error("Error:", err);
  }
}


async function getGraph() {
  const query = 'SELECT r_Source_id, r_Destination_id, r_weight FROM routes';
  
  // Return a promise that resolves with the graph or rejects on error
  return new Promise((resolve, reject) => {
    pool.query(query, (err, results) => {
      if (err) {
        return reject(err);
      }

      const graph = {};

      results.forEach(route => {
        const { r_Source_id, r_Destination_id, r_weight } = route;

        if (!graph[r_Source_id]) {
          graph[r_Source_id] = [];
        }
        graph[r_Source_id].push({ to: r_Destination_id, weight: r_weight });

        if (!graph[r_Destination_id]) {
          graph[r_Destination_id] = [];
        }
        graph[r_Destination_id].push({ to: r_Source_id, weight: r_weight });
      });

      resolve(graph);  
    });
  });
}

module.exports = {main};
