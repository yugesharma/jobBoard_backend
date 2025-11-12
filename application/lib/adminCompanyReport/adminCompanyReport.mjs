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
     let code = 200;
     let body;

     try {
          
          const Companies = await Promise.all([
               runQuery(
                    'SELECT * FROM recruitMe.Companies',
                    []
               )
          ]);
          
          body = {
               companies: Companies,
          };
          
          console.log(body);
     } catch (e) {
          code = 400;
          body = { error: e.message };
     }

     
     const response = {
          statusCode: code,
          headers: {
               'Access-Control-Allow-Origin': '*', 
               'Access-Control-Allow-Headers': '*',
               'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          },
          body: JSON.stringify(body),
     };
     console.log(body);

     return response;
};