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

export const handler = async (event) => {
     console.log(event);
     let code = 200;
     let body;

     try {
          const { jobId, action } = JSON.parse(event.body);

          let isActive, isClosed;

        
          if (action === 'activate') {
               isActive = 1;
               isClosed = 0;
          } else if (action === 'inactivate') {
               isActive = 0;
               isClosed = 0;
          } else if (action === 'close') {
               isActive = 0;
               isClosed = 1;
          } else {
               throw new Error('Invalid action provided.');
          }

          const query = "UPDATE recruitMe.Jobs SET isActive = ?, isClosed = ? WHERE jobId = ?";
          await runQuery(query, [isActive, isClosed, jobId]);

          body = { message: `Job ${jobId} was successfully updated.` };

     } catch (e) {
          code = 400; 
          body = { error: e.message };
     }

     
     const response = {
          statusCode: code,
          headers: {
               "Access-Control-Allow-Origin": "*",
               "Access-Control-Allow-Headers": "Content-Type,Authorization",
               "Access-Control-Allow-Methods": "OPTIONS,PUT", 
          },
          body: JSON.stringify(body),
     };

     return response;
};