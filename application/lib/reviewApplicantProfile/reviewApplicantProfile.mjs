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
     console.log(event);
     let code = 200;
     let body;

     try {
          
          const appId = event.queryStringParameters?.appId 
           || (event.queryStringParameters ? event.queryStringParameters.appId : undefined)
           || event.appId
           || JSON.parse(event.body || '{}').appId;
          if (!appId) {
               throw new Error('Applicant ID is required');
          }

         
          const applicantDetails = await runQuery(
               'SELECT * FROM recruitMe.Applicants WHERE appId = ?',
               [appId]
          );

          if (!applicantDetails || applicantDetails.length === 0) {
               throw new Error('No applicant found with that ID');
          }

          const applicant = applicantDetails[0];
          
          const applicantSkills = await runQuery(
               'SELECT s.appSkill FROM Applicants a LEFT JOIN ApplicantSkills s ON a.appId = s.appSkill_appId_FK WHERE a.appId = ?',
               [appId]
          );
          const skillsArray = applicantSkills.map((skill) => skill.appSkill);
          


          const formatJobs = (jobs) => {
               return jobs.map(job => ({
                    ...job,
                    skillsNeeded: job.skillsNeeded ? job.skillsNeeded.split(',') : []
               }));
          }

          const appliedJobs = await runQuery ('SELECT j.jobName, js.jobSkill AS skills FROM JobApplication ja JOIN Jobs j ON ja.jobApp_jobId_FK = j.jobId JOIN JobSkills js  ON js.jobSkill_jobId_FK = j.jobId WHERE ja.jobApp_appId_FK = ? AND ja.offered = 0 AND ja.hired = 0 AND ja.rejectedByApplicant = 0 GROUP BY j.jobName;',[appId])
          const offeredJobs=await runQuery('SELECT j.jobName, js.jobSkill FROM JobApplication ja JOIN Jobs j ON ja.jobApp_jobId_FK = j.jobId JOIN JobSkills js ON js.jobSkill_jobId_FK = j.jobId WHERE ja.jobApp_appId_FK = ? AND ja.offered = 1;',[appId])
          const rejectedJobs=await runQuery('SELECT j.jobName, js.jobSkill FROM JobApplication ja JOIN Jobs j ON ja.jobApp_jobId_FK = j.jobId JOIN JobSkills js ON js.jobSkill_jobId_FK = j.jobId WHERE ja.jobApp_appId_FK = ? AND ja.rejectedByApplicant = 1;',[appId])
          const acceptedJobs=await runQuery('SELECT j.jobName, js.jobSkill FROM JobApplication ja JOIN Jobs j ON ja.jobApp_jobId_FK = j.jobId JOIN JobSkills js ON js.jobSkill_jobId_FK = j.jobId WHERE ja.jobApp_appId_FK = ? AND ja.hired = 1;',[appId])
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
               "Access-Control-Allow-Origin": "*",
               "Access-Control-Allow-Headers": "Content-Type,Authorization",
               "Access-Control-Allow-Methods": "OPTIONS,GET,POST",
          },
          body: JSON.stringify(body),
     };

     return response;
};