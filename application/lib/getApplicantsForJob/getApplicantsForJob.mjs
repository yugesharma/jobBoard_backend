import 'dotenv/config';
import mysql from 'mysql'

var pool=mysql.createPool({
  host:process.env.RDS_HOST,
  user:process.env.RDS_USER,
  password:process.env.RDS_PASSWORD,
  database:process.env.RDS_DATABASE
});

let runQuery = (query, params) => {
    return new Promise((resolve, reject) => {
        pool.query(query, params, (error, rows) => {
            if (error) {
                return reject(error)
            }
            return resolve(error)
        })
    })
}

export const handler = async (event) => {
    let code
    let result
    try {
        const body = typeof event.body === "string" ? JSON.parse(event.body) : event
        const jobId = body.jobId
        
        const jobInfo = runQuery('SELECT t1.jobName, t2.jobSkills FROM Jobs AS t1 JOIN JobSkills AS t2 ON t1.jobId = t2.jobSkill_jobId_FK WHERE t1.jobId = ?', [jobId])

        const waitlistedApplicants = runQuery('SELECT t3.appName, t4.appSkill FROM Jobs AS t1 JOIN JobApplication AS t2 ON t1.jobId = t2.jobApp_jobId_FK JOIN Applicants AS t3 ON t3.appId = t2.jobApp_appId_FK JOIN ApplicantSkills AS t4 ON t3.appId = t4.appSkill_appId_FK WHERE t2.status = ? AND t1.jobId = ?', ['waitList', jobId])

        const hirableApplicants = runQuery('SELECT t3.appName, t4.appSkill FROM Jobs AS t1 JOIN JobApplication AS t2 ON t1.jobId = t2.jobApp_jobId_FK JOIN Applicants AS t3 ON t3.appId = t2.jobApp_appId_FK JOIN ApplicantSkills AS t4 ON t3.appId = t4.appSkill_appId_FK WHERE t2.status = ? AND t1.jobId = ?', ['hirable', jobId])

        const unacceptableApplicants = runQUery('SELECT t3.appName, t4.appSkill FROM Jobs AS t1 JOIN JobApplication AS t2 ON t1.jobId = t2.jobApp_jobId_FK JOIN Applicants AS t3 ON t3.appId = t2.jobApp_appId_FK JOIN ApplicantSkills AS t4 ON t3.appId = t4.appSkill_appId_FK WHERE t2.status = ? AND t1.jobId = ?', ['unacceptable', jobId])

        const offeredApplicants = runQuery('SELECT t3.appName, t4.appSkill FROM Jobs AS t1 JOIN JobApplication AS t2 ON t1.jobId = t2.jobApp_jobId_FK JOIN Applicants AS t3 ON t3.appId = t2.jobApp_appId_FK JOIN ApplicantSkills AS t4 ON t3.appId = t4.appSkill_appId_FK WHERE t2.offered = 1 AND t1.jobId = ?', [jobId])

        const hiredApplicants = runQuery('SELECT t3.appName, t4.appSkill FROM Jobs AS t1 JOIN JobApplication AS t2 ON t1.jobId = t2.jobApp_jobId_FK JOIN Applicants AS t3 ON t3.appId = t2.jobApp_appId_FK JOIN ApplicantSkills AS t4 ON t3.appId = t4.appSkill_appId_FK WHERE t2.hired = 1 AND t1.jobId = ?', [jobId])

        const rejectedByApplicants = runQuery('SELECT t3.appName, t4.appSkill FROM Jobs AS t1 JOIN JobApplication AS t2 ON t1.jobId = t2.jobApp_jobId_FK JOIN Applicants AS t3 ON t3.appId = t2.jobApp_appId_FK JOIN ApplicantSkills AS t4 ON t3.appId = t4.appSkill_appId_FK WHERE t2.rejectedByApplicant = 1 AND t1.jobId = ?', [jobId])

        const reviewJobPage = {
             
        }

        code = 200
    } catch (error) {
        console.error(error)
        result = error.message
        code = 400
    }

    const response = {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",       
            "Access-Control-Allow-Headers": "*",     
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
        body: JSON.stringify(result),
    }
    
    return response
}