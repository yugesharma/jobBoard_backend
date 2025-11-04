import 'dotenv/config';
import mysql from 'mysql'

var pool=mysql.createPool({
  host:process.env.RDS_HOST,
  user:process.env.RDS_USER,
  password:process.env.RDS_PASSWORD,
  database:process.env.RDS_DATABASE
});

let getJob = (jobID) => {
  return new Promise((resolve,reject) => {
    pool.query("SELECT * FROM Jobs WHERE jobID=?", [jobID], (error, rows) => {
      if (error) {
        return reject(error);
      }

      if(rows.length == 1){
        return resolve(rows[0]);
      }
      else if(rows.length == 0){
        let noJobError = new Error("No jobs with that ID");
        return reject(noJobError);
      }
      else{
        let multipleJobsError = new Error("Multiple jobs with that ID - Should be impossible");
        return reject(multipleJobsError);
      }
    }) 
  })
}

let getSkills = (jobID) => {
  return new Promise((resolve, reject) => {
    pool.query("SELECT * FROM JobSkills WHERE jobSkill_jobID_FK=?", [jobID], (error, rows) => {
      if (error) {
        return reject(error);
      }
      return resolve(rows);
    })
  })
}

export const handler = async (event) => { 
  let result
  let code
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event;
    let result1 = await getJob(body.jobID)
    let result2 = await getSkills(body.jobID)
    code = 200
    result = {
      job: result1,
      skills: result2
    }
  } catch (error) {
    code = 400
    result = error.message
  }

  const response={
    statusCode:code,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",       
      "Access-Control-Allow-Headers": "*",     
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET"  
    },
    body:JSON.stringify(result)
  }
  return response
}