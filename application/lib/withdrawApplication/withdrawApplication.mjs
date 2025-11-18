import 'dotenv/config';
import mysql from 'mysql';

var pool = mysql.createPool({
     host: process.env.RDS_HOST,
     user: process.env.RDS_USER,
     password: process.env.RDS_PASSWORD,
     database: process.env.RDS_DATABASE,
});

function runQuery(query, params) {
     return new Promise((resolve, reject) => {
          pool.query(query, params, (error, rows) => {
               if (error) {
                    reject(error);
               } else {
                    resolve(rows);
               }
          });
     });
}

function withdrawApplication(appId) {
     const query = `
          UPDATE recruitMe.JobApplication SET withdrawn = '1' WHERE jobAppId = ?;
     `;
     return runQuery(query, [appId]);
}

export const handler = async (event) => {
     let code = 200;
     let body;
     console.log('event is' ,event);
     try {          
          const appId = event.queryStringParameters?.jobAppId 
           || (event.queryStringParameters ? event.queryStringParameters.jobAppId : undefined)
           || event.jobAppId
           || JSON.parse(event.body || '{}').jobAppId;
          if (!appId) {
               throw new Error('Job application ID is required');
          }
          body = await withdrawApplication(appId);

     } catch (e) {
          code = 400; 
          body = { error: e.message };
     }

     const response = {
          statusCode: code,
          headers: {
               "Access-Control-Allow-Origin": "*",
               "Access-Control-Allow-Headers": "Content-Type,Authorization",
               "Access-Control-Allow-Methods": "OPTIONS,GET,POST",
          },
          body: JSON.stringify(body),
     };
     console.log('body is',body);

     return response;
};