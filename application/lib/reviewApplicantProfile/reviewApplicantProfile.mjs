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
          SELECT J.jobId, J.jobName, GROUP_CONCAT(JS.jobSkill) as skillsNeeded
          FROM recruitMe.Jobs J
          JOIN recruitMe.JobApplication JA ON J.jobId = JA.jobApp_jobId_FK
          LEFT JOIN recruitMe.JobSkills JS ON J.jobId = JS.jobSkill_jobId_FK
          WHERE JA.jobApp_appId_FK = ? AND JA.status = ?
          GROUP BY J.jobId, J.jobName
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

          const [
               applicantDetails,
               applicantSkills,
               appliedJobs,
               offeredJobs,
               acceptedJobs,
               rejectedJobs,
          ] = await Promise.all([
               runQuery('SELECT appName FROM recruitMe.Applicants WHERE appId = ?', [
                    appId,
               ]),
               runQuery(
                    'SELECT appSkill FROM recruitMe.ApplicantSkills WHERE appSkill_appId_FK = ?',
                    [appId]
               ),
               getJobsByStatus(appId, 'applied'),
               getJobsByStatus(appId, 'offered'),
               getJobsByStatus(appId, 'accepted'),
               getJobsByStatus(appId, 'rejected'),
          ]);

          if (!applicantDetails || applicantDetails.length === 0) {
               throw new Error('No applicant found with that ID');
          }

          const applicant = applicantDetails[0];
          
          const skillsArray = applicantSkills.map((skill) => skill.appSkill);
          
          const formatJobs = (jobs) => {
               return jobs.map(job => ({
                    ...job,
                    skillsNeeded: job.skillsNeeded ? job.skillsNeeded.split(',') : []
               }));
          }

          const applicantProfile = {
               appName: applicant.appName,
               skills: skillsArray,
               appliedJobs: formatJobs(appliedJobs),
               offeredJobs: formatJobs(offeredJobs),
               acceptedJobs: formatJobs(acceptedJobs),
               rejectedJobs: formatJobs(rejectedJobs),
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