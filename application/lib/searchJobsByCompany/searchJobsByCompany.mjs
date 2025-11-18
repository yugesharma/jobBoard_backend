import 'dotenv/config';
import mysql from 'mysql'

var pool=mysql.createPool({
  host:process.env.RDS_HOST,
  user:process.env.RDS_USER,
  password:process.env.RDS_PASSWORD,
  database:process.env.RDS_DATABASE
});


let getJobs = (companySearchString, applicantId, pageSize, offset) => {
  return new Promise((resolve, reject) => {
    pool.query("SELECT Companies.compName, Jobs.jobId, Jobs.jobName, JSON_ARRAYAGG(JobSkills.jobSkill) AS jobSkills, EXISTS (SELECT 1 FROM JobApplication WHERE JobApplication.jobApp_jobId_FK = Jobs.jobId AND JobApplication.jobApp_appId_FK = ?) AS alreadyApplied FROM ((Companies INNER JOIN Jobs ON Companies.compID = Jobs.jobs_compID_FK) INNER JOIN JobSkills ON Jobs.jobId = JobSkills.jobSkill_jobID_FK) WHERE Companies.compName LIKE ? AND Jobs.isActive = 1 GROUP BY Jobs.jobId ORDER BY Jobs.jobName ASC LIMIT ? OFFSET ?;", [applicantId, `%${companySearchString}%`, pageSize, offset], (error, rows) => {
      if (error) {
        return reject(error);
      }
      return resolve(rows);
    })
  })
}

export const handler = async (event) => {
  let code
  let result
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event;
    result = await getJobs(body.companySearchString, body.applicantId, body.pageSize, body.offset)
    code = 200
  } catch (error) {
    console.error(error)
    result = error.message
    code = 400
  }

  const response = {
    statusCode: code,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",       
      "Access-Control-Allow-Headers": "*",     
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET"  
    },
    body: JSON.stringify(result),
  };
  return response;
};
