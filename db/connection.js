const mysql = require('mysql2');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '4KoreanNutMusic13',
  database: 'employees_db'
};

const db = mysql.createConnection(dbConfig);

db.promise()
  .connect()
  .then(() => {
    console.log(`\nConnected to the "${dbConfig.database}" database.`);
    console.log('Welcome to Employee Tracking System!');
  })
  .catch((error) => {
    console.error('Error connecting to the database:', error);
  });

module.exports = db;
