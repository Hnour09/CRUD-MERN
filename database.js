const { MongoClient } = require("mongodb");
const express = require("express");

const app = express();
const port = 4000; // You can change the port number if desired
const url = "mongodb://localhost:27017"; // MongoDB server URL without the database name
const dbName = "mydatabase"; // Replace 'mydatabase' with your desired database name

async function connectToMongoDB() {
  try {
    // Create a new MongoClient
    var client = new MongoClient(url, { useNewUrlParser: true });
    // Connect to the MongoDB server
    await client.connect();

    console.log("Connected successfully to MongoDB");

    const db = client.db(dbName);

    return db;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    return null;
  }
}

module.exports = {
  connectToMongoDB,
};
