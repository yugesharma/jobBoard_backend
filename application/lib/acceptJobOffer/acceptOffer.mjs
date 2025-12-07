import 'dotenv/config';
import mysql from 'mysql'

var pool=mysql.createPool({
  host:process.env.RDS_HOST,
  user:process.env.RDS_USER,
  password:process.env.RDS_PASSWORD,
  database:process.env.RDS_DATABASE
});

let checkOffered = (jobApplicationId) => {
  return new Promise((resolve, reject) => {
    pool.query("SELECT offered from JobApplication where jobAppId=?", [jobApplicationId], (error, row) => {      
      if (error) {
        return reject(error)
      }
      if(row[0].offered == 0) {
        return reject({message: "Job has not been offered; unable to accept"})
      }
      return resolve(row);
    })
  })
}

let acceptJobOffer = (jobApplicationId) => {
  return new Promise((resolve,reject) => {
    pool.query("UPDATE JobApplication SET hired=1, rejectedByApplicant=0 where jobAppId=?", [jobApplicationId], (error,rows) => {
      return error ? reject(error) : resolve(rows);
    })
  })
}

export const handler=async (event)=> { 
  let result
  let code
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event;
    await checkOffered(body.jobAppId);
    await acceptJobOffer(body.jobAppId);
    result = "Job offer successfully accepted"
    code = 200
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
