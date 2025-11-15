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
          
          const compId = event.queryStringParameters.compId;
          if (!compId) {
               throw new Error('Company ID is required');
          }

          
          const [inactiveJobs, activeJobs, closedJobs] = await Promise.all([
               runQuery(
                    `SELECT j.jobId,j.jobName,j.isActive,j.isClosed,j.jobs_compId_FK, GROUP_CONCAT(js.jobSkill ORDER BY js.jobSkill SEPARATOR ', ') AS skillsNeeded FROM recruitMe.Jobs j LEFT JOIN recruitMe.JobSkills js ON j.jobId = js.jobSkill_jobId_FK WHERE j.jobs_compId_FK = ? AND isActive = 0 AND isClosed = 0 GROUP BY j.jobId;`,
                    [compId]
               ),
               runQuery(
                    `SELECT j.jobId,j.jobName,j.isActive,j.isClosed,j.jobs_compId_FK,GROUP_CONCAT(js.jobSkill ORDER BY js.jobSkill SEPARATOR ', ') AS skillsNeeded FROM recruitMe.Jobs j LEFT JOIN recruitMe.JobSkills js ON j.jobId = js.jobSkill_jobId_FK WHERE j.jobs_compId_FK = ? AND isActive = 1 AND isClosed = 0 GROUP BY j.jobId;`,
                    [compId]
               ),
               runQuery(
                    `SELECT j.jobId,j.jobName,j.isActive,j.isClosed,j.jobs_compId_FK,GROUP_CONCAT(js.jobSkill ORDER BY js.jobSkill SEPARATOR ', ') AS skillsNeeded FROM recruitMe.Jobs j LEFT JOIN recruitMe.JobSkills js ON j.jobId = js.jobSkill_jobId_FK WHERE j.jobs_compId_FK = ? AND isActive = 0 AND isClosed = 1 GROUP BY j.jobId;`,
                    [compId]
               ),
          ]);



          
          body = {
               
               inactiveJobs: inactiveJobs,
               activeJobs: activeJobs,
               closedJobs: closedJobs,
          };
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