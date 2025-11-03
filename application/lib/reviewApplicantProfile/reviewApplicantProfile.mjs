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


function getJobsByStatus(appId, status) {
     const query = `
          SELECT J.* FROM recruitMe.Jobs J
          JOIN recruitMe.JobApplications JA ON J.jobId = JA.jobId
          WHERE JA.appId = ? AND JA.status = ?
     `;
     return runQuery(query, [appId, status]);
}

export const handler = async (event) => {
     let code = 200;
     let body;

     try {
          
          const appId = event.queryStringParameters.appId;
          if (!appId) {
               throw new Error('Applicant ID is required');
          }

         
          const applicantDetails = await runQuery(
               'SELECT appName, skills FROM recruitMe.Applicants WHERE appId = ?',
               [appId]
          );

          
          const [appliedJobs, offeredJobs, acceptedJobs, rejectedJobs] =
               await Promise.all([
                    getJobsByStatus(appId, 'applied'),
                    getJobsByStatus(appId, 'offered'),
                    getJobsByStatus(appId, 'accepted'),
                    getJobsByStatus(appId, 'rejected'),
               ]);

          
          const applicantProfile = {
               ...applicantDetails[0], 
               skills: applicantDetails[0].skills.split(','), 
               offeredJobs,
               acceptedJobs,
               rejectedJobs,
          };

          body = applicantProfile;
     } catch (e) {
          code = 400;
          body = { error: e.message };
     }

     
     const response = {
          statusCode: code,
          headers: {
               'Access-Control-Allow-Origin': '*', 
               'Access-Control-Allow-Headers': '*',
          },
          body: JSON.stringify(body),
     };

     return response;
};