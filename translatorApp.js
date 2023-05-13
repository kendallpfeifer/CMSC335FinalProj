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

app.get('/translate', function (req, response) {
    response.render('translate');
});

app.get('/translationsByEmail', function (req, response) {
    response.render('translationsByEmail');
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

        app.post("/translate", async (request, response) => {
            let data = {
                name: request.body.name,
                email: request.body.email,
                input_text: request.body.input_text,
                translation_language: request.body.translation_language,
                translated_text: ""
            };

            translation_url =`https://api.funtranslations.com/translate/${data.translation_language}.json`;
            let result = await fetch(translation_url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "text": data.input_text })
            });
            
            let response_json = await result.json();
            data.translated_text = response_json.contents.translated; 
            response.render("translated_text", data);
            await collection.insertOne(data);
        });


    } catch (error) {
        console.log(error);
        response.status(500).send("Internal server error");
    }
}


