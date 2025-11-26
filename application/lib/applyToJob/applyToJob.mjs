import 'dotenv/config';
import mysql from 'mysql'

var pool=mysql.createPool({
  host:process.env.RDS_HOST,
  user:process.env.RDS_USER,
  password:process.env.RDS_PASSWORD,
  database:process.env.RDS_DATABASE
});

let insertJobApplication = (jobId, applicantId) => {
  return new Promise((resolve,reject) => {
    let newJobApplicationId = crypto.randomUUID();
    pool.query("INSERT INTO JobApplication VALUES(?,?,?,?,?,?,?,?)", [newJobApplicationId, jobId, applicantId, "waitlist", 0, 0, 0, 0], (error,rows) => {
      if (error) {
        return reject(error);
      }
      if((rows) && (rows.affectedRows == 1)){
        return resolve(newJobApplicationId);
      }
      else{
        return resolve(false);
      }
    })
  }) 
}

let checkApplicantExists = (jobId, applicantId) => {
  return new Promise((resolve,reject) => {
    pool.query("SELECT EXISTS (SELECT 1 FROM JobApplication WHERE jobApp_jobId_FK = ? AND jobApp_appId_FK = ?) AS row_exists;", [jobId, applicantId], (error,rows) => {
      if (error) {
        return reject(error);
      }
      const exists = rows[0].row_exists === 1;
      return resolve(exists);
    })
  }) 
}

let reApply = (jobId, applicantId) => {
  return new Promise((resolve,reject) => {
    pool.query("UPDATE JobApplication SET status = ? , offered=0 , hired=0 , rejectedByApplicant=0 , withdrawn=0 WHERE jobApp_jobId_FK = ? AND jobApp_appId_FK = ?;", ['waitList', jobId, applicantId], (error,rows) => {
      if (error) {
        return reject(error);
      }
      if((rows) && (rows.affectedRows == 1)){
        return resolve(true);
      }
      else{
        return resolve(false);
      }
    })
  }) 
}

export const handler = async (event) => { 
  let result
  let code
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event;
    const appExists= await checkApplicantExists(body.jobId, body.applicantId)
    if(appExists){
      const reApplyJobApplication = await reApply(body.jobId, body.applicantId)
      code = 200
      result={message:"Job application updated"}
    }
    else{
      const newJobApplicationId = await insertJobApplication(body.jobId, body.applicantId)
      code = 200
      result={message:"Job application successfully created", jobAppId:newJobApplicationId}
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
