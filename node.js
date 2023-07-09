const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { connectToMongoDB } = require("./database");
const { object } = require("joi");
const { v4: uuidv4, validate: uuidValidate } = require("uuid");
const cors = require("cors");

const app = express();
const port = 4000; // You can change the port number if desired

let dbObject;

app.use(express.json());
app.use(cors());
connectToMongoDB()
  .then((res) => {
    dbObject = res;
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((err) => console.log(err));

app.post("/register", async (req, res) => {
  try {
    const userId = uuidv4();

    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const collection = dbObject.collection("users"); // Replace 'users' with your collection name
    const newUser = { userId, username, password: hashedPassword };
    await collection.insertOne(newUser);
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const collection = dbObject.collection("users"); // Replace 'users' with your collection name
    const user = await collection.findOne({ username });
    if (!user) {
      res.status(401).json({ message: "Invalid username or password" });
      return;
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ message: "Invalid username or password" });
      return;
    }
    const token = jwt.sign({ username: user.username }, "your-secret-key");
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Function to fetch data from the collection
async function getDataFromCollection() {
  try {
    const collection = dbObject.collection("users"); // Replace 'users' with your collection name
    const data = await collection.find().toArray();
    return data;
  } catch (error) {
    console.error("Error retrieving data:", error);
    throw error;
  }
}

// Route handler for the index page
app.get("/", async (req, res) => {
  try {
    const data = await getDataFromCollection();
    console.log(data);
    res.status(200).json({ data });
  } catch (err) {
    console.log(err);
  }
});
// Route handler for deleting a record
app.delete("/:id", async (req, res) => {
  try {
    const userId = req.params.userId;
    const collection = dbObject.collection("users");
    const result = await collection.deleteOne({ id: userId });

    res.send("deleted");
  } catch (error) {
    console.error(error); // Log the error message
    res.status(500).send("Internal server error");
  }
});
app.put("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const username = req.body.username;
    const password = req.body.password;
    if (!uuidValidate(userId)) {
      return res.status(400).send("Invalid UUID");
    }
    // MongoDB Collection
    const collection = dbObject.collection("users");
    const hashedPassword = await bcrypt.hash(password, 10);
    // Update user in MongoDB based on the UUID
    const result = await collection.updateOne(
      { userId: userId },
      { $set: { username, password: hashedPassword } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).send("User not found");
    }
    res.send({ message: "User updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});
