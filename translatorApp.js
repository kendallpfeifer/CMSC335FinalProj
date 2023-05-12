const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const bodyParser = require("body-parser");

const port = 5050;
const uri = "mongodb+srv://kpfeifer:Password123@cluster0.bsupqjd.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', function (req, response) {
    response.render('index');
});

runApp();

async function runApp() {
    try {
        
        startServer();
    } finally {
        await client.close();
    }
}

async function startServer() {
    try {
        await client.connect();
        const db = client.db("CMSC335_DB");
        const collection = db.collection("translations");
        app.listen(port);
        console.log(`Web server started and running at http://localhost:${port}`);
        console.log("Stop to shutdown the server: ");

        process.stdin.once('data', (data) => {
            let command = data.toString().trim();
            if (command === "stop") {
                console.log("Shutting down the server");
                process.exit(0);
            }
        });


    } catch (error) {
        console.log(error);
        response.status(500).send("Internal server error");
    }
}


