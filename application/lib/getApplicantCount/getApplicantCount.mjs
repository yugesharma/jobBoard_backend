import 'dotenv/config';
import mysql from 'mysql'

var pool=mysql.createPool({
  host:process.env.RDS_HOST,
  user:process.env.RDS_USER,
  password:process.env.RDS_PASSWORD,
  database:process.env.RDS_DATABASE
});

//SEARCH BY SKILLS
let getApplicantCount = (skillSet, length) => {
  return new Promise((resolve, reject) => {
    pool.query("SELECT COUNT(*) AS matched_count FROM ( SELECT appSkill_appId_FK FROM recruitMe.ApplicantSkills where appSkill in (?) GROUP BY appSkill_appId_FK HAVING COUNT(DISTINCT appSkill)>=?) as t;", [skillSet, length], (error, rows) => {
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
    console.log(body.skillSet, body.length)
    result = await getApplicantCount(body.skillSet, body.length)
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
