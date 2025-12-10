import 'dotenv/config';
import mysql from 'mysql'

var pool=mysql.createPool({
  host:process.env.RDS_HOST,
  user:process.env.RDS_USER,
  password:process.env.RDS_PASSWORD,
  database:process.env.RDS_DATABASE
});

//SEARCH BY SKILLS
let applicantSkillCount = (appID) => {
  return new Promise((resolve, reject) => {
    pool.query("SELECT COUNT(*) AS matched_count FROM ( SELECT appSkillId FROM recruitMe.ApplicantSkills WHERE appSkill_appId_FK=?) as t;", [appID], (error, rows) => {
      if (error) {
        return reject(error);
      }
      return resolve(rows);
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

export const handler = async (event) => {
  let code
  let result
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event;
   
    if (body.skillSet>0) {
      for (const skill of body.skillSet) {
      const newAppSkill = await insertSkill(skill, body.appID.toString())//how is it getting stored in the database if I have to call toString here?
    }
    }
    console.log(body)
    result = await applicantSkillCount(body.appID)
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
