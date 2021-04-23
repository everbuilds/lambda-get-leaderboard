const mysql = require('mysql');
const pool  = mysql.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
});
const getConnection = () => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) reject(err);
            const query = (sql, binding) => {
                return new Promise((resolve, reject) => {
                    connection.query(sql, binding, (err, result) => {
                        if (err) reject(err);
                        resolve(result);
                    });
                });
            };
            const release = () => {
                return new Promise((resolve, reject) => {
                    if (err) reject(err);
                    console.log("MySQL pool released: threadId " + connection.threadId);
                    resolve(connection.release());
                });
            };
            resolve({
                query,
                release
            });
        });
    });
};
    
exports.handler = async (event, context, callback) => {
    let responseBody = {}
    let connection = await getConnection(pool)
    let field = event.queryStringParameters["scope"]
    let username = event.queryStringParameters["username"]
    
    let queryLeaderboard = `SELECT * FROM leaderboard order by ${field} desc limit 10`

    responseBody.leaderboard = await connection.query(queryLeaderboard)
        
    if(username){
        let queryParam = `select * from leaderboard where username = ? `
        let me = await connection.query(queryParam, [username])
        if(me && me.length > 0){
            me = me[0]
            let queryPositionScore = `select count(*) as pos from leaderboard where score > ${me.score}`
            let posScore = await connection.query(queryPositionScore, [username])
            
            let queryPositionDefeated = `select count(*) as pos from leaderboard where defeated > ${me.defeated}`
            let posDefeated = await connection.query(queryPositionDefeated, [username])
            
            responseBody.me = {
                ...me, 
                "pos" : {
                    "score" : (posScore[0].pos || 0)+1,
                    "defeated" : (posDefeated[0].pos || 0)+1
                }
            }
        }
    }
    
    connection.release();

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": JSON.stringify(responseBody)
    }
};
