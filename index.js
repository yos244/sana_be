var express = require('express');
var { MongoClient, ObjectId } = require('mongodb');
var cors = require('cors');
var multer = require('multer');
var fs = require('fs');
var cloudinary = require('cloudinary').v2;
var path = require('path');

// Initialize Express
var app = express();
app.use(cors());
app.use(express.json());

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dbxhcgqlx',
  api_key: '839131268921711',
  api_secret: 'J23UqE8s3rpPA-qQRvkD25VSZ5s',
});

// Configure multer for file uploads
var upload = multer({ dest: 'uploads/' }); // Temporary storage

// MongoDB connection details
var CONNECTION_STRING = 'mongodb+srv://yostul93:AYft889NcuEK06Qm@cluster0.gn68m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
var DATABASENAME = 'store_db';
var database;

// Connect to MongoDB
MongoClient.connect(CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true }, function(error, client) {
  if (error) {
    console.error('Failed to connect to the database', error);
    return;
  }
  database = client.db(DATABASENAME);
  console.log('DB connected successfully');

  // Start the server after successful connection
  app.listen(5038, function() {
    console.log('Server is running on port 5038');
  });
});

// Fetch all cards
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

// POST route to handle card creation with image upload
app.post('/api/store_db/cards', upload.single('image'), async function(request, response) {
  if (!database) {
    return response.status(500).send('Database not initialized');
  }

  try {
    // Find the card with the highest id
    const highestCard = await database.collection('cards').find().sort({ id: -1 }).limit(1).toArray();
    
    // Check if highestCard has a valid number id
    let newId;
    if (highestCard.length > 0 && typeof highestCard[0].id === 'number') {
      newId = highestCard[0].id + 1;
    } else {
      newId = 1; // Start at 1 if no card exists or invalid id
    }

    let imgUrl = ''; // Default image URL

    // Check if a file was uploaded
    if (request.file) {
      // Upload the image to Cloudinary
      const result = await cloudinary.uploader.upload(request.file.path);
      imgUrl = result.secure_url; // Get the URL of the uploaded image
      fs.unlinkSync(request.file.path); // Cleanup: remove file from server after upload
    }

    // Create new card object
    const newCard = {
      id: newId, // Use the new incremental id
      title: request.body.title,
      description: request.body.description,
      price: parseFloat(request.body.price),
      img_url: imgUrl,
    };

    // Insert the new card into the 'cards' collection
    const resultInsert = await database.collection('cards').insertOne(newCard);
    response.status(201).send({ message: 'Card added successfully', card: resultInsert.insertedId });

  } catch (error) {
    console.error('Error adding card:', error);
    response.status(500).send({ message: 'Error adding card' });
  }
});

app.delete('/api/store_db/cards/:id', async function(request, response) {
  if (!database) {
    return response.status(500).send('Database not initialized');
  }

  try {
    // Extract the card ID from the request parameters and convert it to an integer
    const cardId = parseInt(request.params.id, 10);

    // Find the card to get the public ID of the image
    const card = await database.collection('cards').findOne({ id: cardId });

    if (!card) {
      return response.status(404).send({ message: 'Card not found' });
    }

    // Delete the image from Cloudinary if it exists
    if (card.img_url) {
      const publicId = card.img_url.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    // Remove the card from the 'cards' collection
    const result = await database.collection('cards').deleteOne({ id: cardId });

    if (result.deletedCount === 0) {
      return response.status(404).send({ message: 'Card not found' });
    }

    response.send({ message: 'Card deleted successfully' });
    console.log('Card deleted:', cardId);
  } catch (error) {
    console.error('Error deleting card:', error);
    response.status(500).send({ message: 'Error deleting card' });
  }
});
