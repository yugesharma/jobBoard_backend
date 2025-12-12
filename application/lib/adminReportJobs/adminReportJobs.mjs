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
          const { offset, PAGE_SIZE } = JSON.parse(event.body || '{}');
          
          const limit = PAGE_SIZE || 10;
          const skip = offset || 0;

          
          const dataQuery = `
               SELECT 
                    j.jobId, 
                    j.jobName, 
                    c.compName,
                    j.isActive,
                    COUNT(ja.jobAppId) as applicant_count,
                    SUM(CASE WHEN ja.hired = 1 THEN 1 ELSE 0 END) as hired_count
               FROM recruitMe.Jobs j
               JOIN recruitMe.Companies c ON j.jobs_compId_FK = c.compId
               LEFT JOIN recruitMe.JobApplication ja ON j.jobId = ja.jobApp_jobId_FK
               GROUP BY j.jobId, c.compName
               LIMIT ? OFFSET ?
          `;

          
          const countQuery = `SELECT COUNT(*) as total FROM recruitMe.Jobs`;

          const [jobs, countResult] = await Promise.all([
               runQuery(dataQuery, [limit, skip]),
               runQuery(countQuery, [])
          ]);

          body = {
               jobs: jobs,
               total_count: countResult[0].total
          };

     } catch (e) {
          code = 400;
          body = { error: e.message };
     }

     return {
          statusCode: code,
          headers: {
               'Access-Control-Allow-Origin': '*',
               'Access-Control-Allow-Headers': 'Content-Type,Authorization',
               'Access-Control-Allow-Methods': 'OPTIONS,POST',
          },
          body: JSON.stringify(body),
     };
};