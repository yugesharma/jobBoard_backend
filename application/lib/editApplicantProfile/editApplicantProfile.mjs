import 'dotenv/config';
import mysql from 'mysql'

var pool=mysql.createPool({
  host:process.env.RDS_HOST,
  user:process.env.RDS_USER,
  password:process.env.RDS_PASSWORD,
  database:process.env.RDS_DATABASE
});

let updateApplicant = (appID, newAppName) => {
  return new Promise((resolve,reject) => {
    pool.query("UPDATE Applicants SET appName=? WHERE appID=?", [newAppName, appID], (error,rows) => {
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

//delete the skills and then insert updated list of skills
//possibly optimizations can be made later
let deleteSkills = (appID) => {
  return new Promise((resolve,reject) => {
    pool.query("DELETE FROM ApplicantSkills WHERE appSkill_appId_FK=?", [appID], (error,rows) => {
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

let insertSkill = (skill, appID) => {
  return new Promise((resolve,reject) => {
    pool.query("INSERT INTO ApplicantSkills VALUES(?,?,?)", [crypto.randomUUID(), appID, skill], (error,rows) => {
      return error ? reject(error) : resolve(rows);
    })
  })
}

export const handler=async (event)=> { 
  let result
  let code
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event;
    const nameChangeSuccess = await updateApplicant(body.appID, body.appName)
    const deleteSkillsSuccess = await deleteSkills(body.appID)
    for (const skill of body.skills) {
      const newAppSkill = await insertSkill(skill, body.appID.toString())//how is it getting stored in the database if I have to call toString here?
    }
    code = 200
    result={message:"Job edited successfully", appID:body.appID}
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