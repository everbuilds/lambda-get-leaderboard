const mysql = require('mysql');
const pool  = mysql.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
});

exports.handler = (event, context, callback) => {

    //prevent timeout from waiting event loop
    context.callbackWaitsForEmptyEventLoop = false;
  
    pool.getConnection((err, connection) => {
        if(err){
            callback(null, {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify({
                    "message": "ops, error encountered: " + err
                })
            });
        }
        let field = event.path.includes("durata") ? "duration" : "score"
        let query = `SELECT * FROM leaderboard order by ${field} desc`
        // Use the connection
        connection.query(query, (error, results, fields) => {
            
            // And done with the connection.
            connection.release();
            
            
            if(error){
                callback(null, {
                    "statusCode": 200,
                    "headers": {
                        "Content-Type": "application/json"
                    },
                    "body": JSON.stringify({
                        "message": "ops, error encountered: " + error
                    })
                });
            }
            callback(null, {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify(results)
            });
        });
    });
};