const mysql = require("mysql");

// Create a connection to the database
// const connection = mysql.createConnection({
//     host: "34.68.164.223",  
//     user: "root",  
//     password: "roortoor",  
//     database: "option_chain"
// });
var connection = mysql.createConnection({
  host : 'optionchain.csf8cb17aqta.us-east-2.rds.amazonaws.com',
  user      : 'root',
  password  : 'roottoor',
  database  : 'optionchain'
});

// open the MySQL connection
connection.connect(error => {
  if (error){
    console.log(error,'error');
    throw error;
  }
  console.log("Successfully connected to the database.");
});

module.exports = connection;