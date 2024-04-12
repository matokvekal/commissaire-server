// // const { MongoClient } = require("mongodb");
// // const uri = 'mongodb://localhost:27017';
// // const client = new MongoClient(uri);
// let users;

// async function connect() {
//     await client.connect();
//     console.log('mongo db is connected');

//     const database = client.db('mongo-first');
//     users = database.collection('users');
// }

// function usersCollection() {
//     return users;
// }

// module.exports = {
//     connect,
//     usersCollection
// }