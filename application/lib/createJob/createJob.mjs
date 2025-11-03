import 'dotenv/config';
import mysql from 'mysql'

var pool=mysql.createPool({
  host:process.env.RDS_HOST,
  user:process.env.RDS_USER,
  password:process.env.RDS_PASSWORD,
  database:process.env.RDS_DATABASE
});

let insertJob = (name, compID) => {
  return new Promise((resolve,reject) => {
    let newJobID = crypto.randomUUID();
    pool.query("INSERT INTO Jobs VALUES(?,?,?,?,?)", [newJobID, name, 0, 0, compID], (error,rows) => {
      if (error) {
        return reject(error);
      }
      if((rows) && (rows.affectedRows == 1)){
        return resolve(newJobID);
      }
      else{
        return resolve(false);
      }
    })
  })
}

let insertSkill = (skill, jobID) => {
  return new Promise((resolve,reject) => {
    pool.query("INSERT INTO JobSkills VALUES(?,?,?)", [crypto.randomUUID(), jobID, skill], (error,rows) => {
      return error ? reject(error) : resolve(rows);
    })
  })
}


export const handler=async (event)=> { 
  
  let result
  let code
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event;
    console.log("body:", body.jobName);
    const newJobID = await insertJob(body.jobName, body.compID)
    for (const skill of body.skills) {
      const newJobSkill = await insertSkill(skill, newJobID.toString())//how is it getting stored in the database if I have to call toString here?
    }
    code = 200
    result={message:"Job created successfully", jobID:newJobID}
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

