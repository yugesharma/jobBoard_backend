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

function rateApplicant(appId, status) {
     const query = `
          UPDATE recruitMe.JobApplication SET status = ? WHERE jobAppId = ?;
     `;
     return runQuery(query, [status, appId]);
}

export const handler = async (event) => {
     let code = 200;
     let body;
     console.log(event);
     try {          
          const appId = event.queryStringParameters?.appId 
           || (event.queryStringParameters ? event.queryStringParameters.appId : undefined)
           || event.appId
           || JSON.parse(event.body || '{}').appId;
          if (!appId) {
               throw new Error('Job application ID is required');
          }
          body = await rateApplicant(appId, event.queryStringParameters.status);

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
     console.log(body);

     return response;
};