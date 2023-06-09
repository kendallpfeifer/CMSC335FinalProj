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
app.use(express.static(__dirname));

app.get('/', function (req, response) {
    response.render('index');
});

app.get('/translate', function (req, response) {
    response.render('translate');
});

app.get('/translationsByEmailOrName', function (req, response) {
    response.render('translationsByEmailOrName');
});

app.get('/removeTranslations', function(req, response) {
    response.render('removeTranslations');
})

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
        const db = client.db("CMSC335_FinalProj");
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

            translation_url = `https://api.funtranslations.com/translate/${data.translation_language}.json`;
            let result = await fetch(translation_url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "text": data.input_text })
            });


            let resultJson = await result.json();
            if (resultJson.error?.code == 429) {
                data = {
                    message: resultJson.error.message
                }
                response.render("error_page", data);
            } else {
                data.translated_text = resultJson.contents.translated;
                await collection.insertOne(data);
                response.render("translated_text", data);
            }
        });

        app.post("/getTranslationsByEmailOrName", async (request, response) => {
            let data = {
                type: "",
                translations: ""
            };

            result_table = "<table border = 1><tr><th>Original Text</th><th>Translation Language</th><th>Translated Text</th></tr>";

            let result = "";

            if (request.body.getTranslationsType === "Get Translations by Name") {
                data.type = request.body.name;
                result = await collection.find({
                    name: request.body.name
                }).toArray();
            
            } else {
                data.type = request.body.email;
                result = await collection.find({
                    email: request.body.email
                }).toArray();
            }

            for (const entry of result) {
                result_table += `<tr><td>${entry.input_text}</td><td>${entry.translation_language}</td><td>${entry.translated_text}</td></tr>`;
            }

            result_table += "</table>";

            data.translations = result_table;
            response.render("translations_by_email_or_name_display", data);
        });

        app.post("/removeTranslationsByEmailOrName", async (request, response) => {
            let data = {
                type: "",
            };

            if (request.body.getTranslationsType === "Remove Translations by Name") {
                data.type = request.body.name;
                let filter = {name: request.body.name};
                await collection.deleteMany(filter);
            
            } else {
                data.type = request.body.email;
                let filter = {email: request.body.email};
                await collection.deleteMany(filter);
            }
            
            response.render("remove_translations_display", data);
        });


    } catch (error) {
        console.log(error);
        response.status(500).send("Internal server error");
    }
}


