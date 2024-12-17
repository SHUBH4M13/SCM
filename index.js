const PORT = 8011;
const express = require("express");
const app = express();
const mysql = require("mysql2");
const {main} = require('./graphPrep');
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Shubham13",
    database: "SCM",
    connectionLimit: 10, 
});

//middleware
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//login Backend
app.get( '/' , (req,res) => {
    res.render("login.ejs")
})
app.post('/' , (req,res) => {
    const { phoneno , password } = req.body;
    const query = `SELECT u_phone , u_password FROM USER WHERE u_phone = '${phoneno}' AND u_password = '${password}'`;
    pool.query(query , (err , result) => {
        if(err){
            console.log("Error not find user");
            res.send(404).send("User not found");
        }
        res.redirect("/nodes");
    })
})

app.get('/home', (req, res) => {
  const q1 = 'SELECT n_id, n_name, n_type FROM node';
  const q2 = 'SELECT r_id, r_Source, r_Destination, r_weight FROM routes';

  pool.query(q1, (err, result1) => {
    if (err) {
      console.log('Error in fetching nodes');
      return res.status(500).send('Error fetching nodes');
    }

    pool.query(q2, (err, result2) => {
      if (err) {
        console.log('Error in fetching routes');
        return res.status(500).send('Error fetching routes');
      }

      main().then(result3 => {
        res.render('home.ejs', { nodes: result1, routes: result2, result3 });
      }).catch(err => {
        console.log('Error in fetching supply chain result');
        res.status(500).send('Error fetching supply chain result');
      });
    });
  });
});

  


app.get('/nodes', (req, res) => {
    const query = 'SELECT * FROM node'; 
    pool.query(query, (err, result) => {
        if (err) {
            console.log("Error fetching nodes", err);
            return res.status(500).send("Error fetching nodes");
        }
        res.render("nodes.ejs", { nodes: result }); 
    });
});
app.post('/nodes', (req, res) => {
    const { name, type, location, contact } = req.body;
    const query = `INSERT INTO NODE (n_name, n_type, n_Location, n_contact) 
                    VALUES ('${name}', '${type}', '${location}', '${contact}');`;

    pool.query(query, (err, result) => {
        if (err) {
            console.log("Can't add node", err);
            return res.status(404).send("Can't add the node");
        }
        res.redirect("/routes");
    });
});


app.get('/routes', (req, res) => {
    const query = `SELECT n_name FROM node;`;
    const q2 = 'SELECT * FROM routes;';

    pool.query(query, (err, result1) => {
        if (err) {
            console.error("Can't find nodes", err);
            return res.status(500).send("Database query failed");
        }

        pool.query(q2, (err, result2) => {
            if (err) {
                console.error("Can't find routes", err);
                return res.status(500).send("Database query failed");
            }

            res.render('routes.ejs', { nodes: result1, routes: result2 });
        });
    });
});

app.post('/routes' , (req,res) => {
    const {source_node , destination_node , weight } = req.body;
    const query = `INSERT INTO routes (r_Source , r_Destination , r_weight ) VALUES ('${source_node}' , '${destination_node}' , '${weight}')`;
    pool.query(query , (err , result) => {
        if(err){
            console.log("cant insert the route");
            return res.status(500).send("invalid Route");
        }
        res.redirect('/nodes');
    })
})






app.listen( PORT , () => {
    console.log(`Sever has been started at PORT http://localhost:8011`);
})
