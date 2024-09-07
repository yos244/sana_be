var express = require("express");
var { MongoClient } = require("mongodb");
var cors = require("cors");

var app = express();
app.use(cors()); 

// Middleware to parse incoming JSON requests
app.use(express.json());

var CONNECTION_STRING = "mongodb+srv://yostul93:AYft889NcuEK06Qm@cluster0.gn68m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
var DATABASENAME = "store_db";
var database; 

let imgPath = ""

// Connecting to the database
MongoClient.connect(CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true }, (error, client) => {
    if (error) {
        console.error("Failed to connect to the database", error);
        return;
    }
    database = client.db(DATABASENAME);
    console.log("DB connected successfully");

    // Starting the server after successful connection
    app.listen(5038, () => {
        console.log("Server is running on port 5038");
    });
});

// Define the route to fetch data from the 'cards' collection
app.get("/api/store_db/cards", (request, response) => {
    if (!database) {
        return response.status(500).send("Database not initialized");
    }

    database.collection("cards").find({}).toArray((error, result) => {
        if (error) {
            response.status(500).send({ message: "Error fetching data" });
        } else {
            response.send(result);
        }
    });
});

// Define the route to add a new card to the 'cards' collection
app.post("/api/store_db/cards", (request, response) => {
    if (!database) {
        return response.status(500).send("Database not initialized");
    }
    
    const newCard = {
        title: request.body.title,
        description: request.body.description,
        price: request.body.price,
        img_url: request.body.img_url,
    };
    
    // Insert the new card into the 'cards' collection
    database.collection("cards").insertOne(newCard, (error, result) => {
        if (error) {
            response.status(500).send({ message: "Error adding card" });
        } else {
            response.status(201).send({ message: "Card added successfully", card: result.insertedId });
            console.log("New card added:", result.insertedId); // Logging the ID of the new card
        }
    });
});

// Define the route to delete a card from the 'cards' collection
app.delete("/api/store_db/cards/:id", (request, response) => {
    if (!database) {
        return response.status(500).send("Database not initialized");
    }
    // Extract the card ID from the request parameters
    const cardId = request.params.id;
    // Convert the card ID to a MongoDB ObjectId
    const ObjectId = require('mongodb').ObjectId;
    const id = new ObjectId(cardId);
    // Remove the card from the 'cards' collection
    database.collection("cards").deleteOne({ _id: id }, (error, result) => {
        if (error) {
            response.status(500).send({ message: "Error deleting card" });
        } else if (result.deletedCount === 0) {
            response.status(404).send({ message: "Card not found" });
        } else {
            response.send({ message: "Card deleted successfully" });
            console.log("Card deleted:", cardId);
        }
    });
});
