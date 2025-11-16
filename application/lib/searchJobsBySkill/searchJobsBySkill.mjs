import 'dotenv/config';
import mysql from 'mysql'

var pool=mysql.createPool({
  host:process.env.RDS_HOST,
  user:process.env.RDS_USER,
  password:process.env.RDS_PASSWORD,
  database:process.env.RDS_DATABASE
});

//SEARCH BY SKILLS
let getJobs = (skillSearchString) => {
  return new Promise((resolve, reject) => {
    pool.query("SELECT Companies.compName, Jobs.jobId, Jobs.jobName, JSON_ARRAYAGG(JobSkills.jobSkill) AS jobSkills FROM ((Companies INNER JOIN Jobs ON Companies.compID = Jobs.jobs_compID_FK) INNER JOIN JobSkills ON Jobs.jobId = JobSkills.jobSkill_jobID_FK) WHERE Jobs.jobId in (SELECT jobSkill_jobID_FK FROM JobSkills WHERE jobSkill LIKE ?) GROUP BY Jobs.jobId;", [`%${skillSearchString}%`], (error, rows) => {
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
    result = await getJobs(body.skillSearchString)
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
