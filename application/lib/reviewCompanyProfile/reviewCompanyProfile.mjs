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
     let responseBody={}
     try {
          const body = typeof event.body === "string" ? JSON.parse(event.body) : event
          const compId = body.compId;
          if (!compId) {
               throw new Error('Company ID is required');
          }
          const inactiveOffset = body.offsets[0]
          const activeOffset = body.offsets[1]
          const closedOffset = body.offsets[2]
          const pageSize = body.pageSize || 5

          
          const [compName,inactiveJobs, inactiveJobsCount, activeJobs,activeJobsCount, closedJobs, closedJobsCount] = await Promise.all([
               runQuery(
                    `SELECT compName FROM recruitMe.Companies WHERE compId = ?;`,
                    [compId]
               ),
               runQuery(
                    `SELECT j.jobId,j.jobName,j.isActive,j.isClosed,j.jobs_compId_FK, GROUP_CONCAT(js.jobSkill ORDER BY js.jobSkill SEPARATOR ', ') AS skillsNeeded FROM recruitMe.Jobs j LEFT JOIN recruitMe.JobSkills js ON j.jobId = js.jobSkill_jobId_FK WHERE j.jobs_compId_FK = ? AND isActive = 0 AND isClosed = 0 GROUP BY j.jobId ORDER BY j.jobName ASC LIMIT ? OFFSET ?;`,
                    [compId, pageSize, inactiveOffset]
               ),
               runQuery(
                    `SELECT COUNT(*) as inactiveTotal FROM recruitMe.Jobs j  WHERE j.jobs_compId_FK = ? AND isActive = 0 AND isClosed = 0;`,
                    [compId]
               ),
               runQuery(
                    `SELECT j.jobId,j.jobName,j.isActive,j.isClosed,j.jobs_compId_FK,GROUP_CONCAT(js.jobSkill ORDER BY js.jobSkill SEPARATOR ', ') AS skillsNeeded FROM recruitMe.Jobs j LEFT JOIN recruitMe.JobSkills js ON j.jobId = js.jobSkill_jobId_FK WHERE j.jobs_compId_FK = ? AND isActive = 1 AND isClosed = 0 GROUP BY j.jobId  ORDER BY j.jobName ASC LIMIT ? OFFSET ?;`,
                    [compId, pageSize, activeOffset]
               ),
               runQuery(
                    `SELECT COUNT(*) as activeTotal FROM recruitMe.Jobs j WHERE j.jobs_compId_FK = ? AND isActive = 1 AND isClosed = 0;`,
                    [compId]
               ),
               runQuery(
                    `SELECT j.jobId,j.jobName,j.isActive,j.isClosed,j.jobs_compId_FK,GROUP_CONCAT(js.jobSkill ORDER BY js.jobSkill SEPARATOR ', ') AS skillsNeeded FROM recruitMe.Jobs j LEFT JOIN recruitMe.JobSkills js ON j.jobId = js.jobSkill_jobId_FK WHERE j.jobs_compId_FK = ? AND isActive = 0 AND isClosed = 1 GROUP BY j.jobId ORDER BY j.jobName ASC LIMIT ? OFFSET ?;`,
                    [compId, pageSize, closedOffset]
               ),
               runQuery(
                    `SELECT COUNT(*) as closedTotal FROM recruitMe.Jobs j WHERE j.jobs_compId_FK = ? AND isActive = 0 AND isClosed = 1;`,
                    [compId]
               ),
          ]);



          
          responseBody = {
               compName: compName[0].compName,
               inactiveJobs: inactiveJobs,
               activeJobs: activeJobs,
               closedJobs: closedJobs,
               counts: {
                    activeTotal: activeJobsCount[0].activeTotal,
                    inactiveTotal: inactiveJobsCount[0].inactiveTotal,
                    closedTotal: closedJobsCount[0].closedTotal,
               }
          };
     } catch (e) {
          code = 400;
          responseBody = { error: e.message };
     }

     
     const response = {
          statusCode: code,
          headers: {
               'Access-Control-Allow-Origin': '*', 
               'Access-Control-Allow-Headers': '*',
               'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          },
          body: JSON.stringify(responseBody),
     };

     return response;
};