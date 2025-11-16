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
    let code = 200
    let result

    try {
        const body = typeof event.body === "string" ? JSON.parse(event.body) : event
        const jobId = body.jobId

        if(!jobId) {
            throw new Error('Job ID is required');
        }

        const formatApplicants = (apps) => {
               return apps.map(app => ({
                    ...app,
                    skillsNeeded: app.skillsNeeded ? app.skillsNeeded.split(',') : []
               }));
        }
        
        const jobName = runQuery('SELECT jobName FROM Jobs WHERE t1.jobId = ?', [jobId])

        const jobSkills = runQuery('SELECT t2.jobSkill FROM Jobs t1 LEFT JOIN JobSkills t2 ON t1.jobId = t2.jobSkill_jobId_FK WHERE t1.jobId = ?', [jobId])

        const waitlistedApplicants = runQuery('SELECT t3.appName, t4.appSkill FROM Jobs AS t1 JOIN JobApplication AS t2 ON t1.jobId = t2.jobApp_jobId_FK JOIN Applicants AS t3 ON t3.appId = t2.jobApp_appId_FK JOIN ApplicantSkills AS t4 ON t3.appId = t4.appSkill_appId_FK WHERE t2.status = ? AND t1.jobId = ?', ['waitList', jobId])

        const hirableApplicants = runQuery('SELECT t3.appName, t4.appSkill FROM Jobs AS t1 JOIN JobApplication AS t2 ON t1.jobId = t2.jobApp_jobId_FK JOIN Applicants AS t3 ON t3.appId = t2.jobApp_appId_FK JOIN ApplicantSkills AS t4 ON t3.appId = t4.appSkill_appId_FK WHERE t2.status = ? AND t1.jobId = ?', ['hirable', jobId])

        const unacceptableApplicants = runQuery('SELECT t3.appName, t4.appSkill FROM Jobs AS t1 JOIN JobApplication AS t2 ON t1.jobId = t2.jobApp_jobId_FK JOIN Applicants AS t3 ON t3.appId = t2.jobApp_appId_FK JOIN ApplicantSkills AS t4 ON t3.appId = t4.appSkill_appId_FK WHERE t2.status = ? AND t1.jobId = ?', ['unacceptable', jobId])

        const offeredApplicants = runQuery('SELECT t3.appName, t4.appSkill FROM Jobs AS t1 JOIN JobApplication AS t2 ON t1.jobId = t2.jobApp_jobId_FK JOIN Applicants AS t3 ON t3.appId = t2.jobApp_appId_FK JOIN ApplicantSkills AS t4 ON t3.appId = t4.appSkill_appId_FK WHERE t2.offered = 1 AND t1.jobId = ?', [jobId])

        const hiredApplicants = runQuery('SELECT t3.appName, t4.appSkill FROM Jobs AS t1 JOIN JobApplication AS t2 ON t1.jobId = t2.jobApp_jobId_FK JOIN Applicants AS t3 ON t3.appId = t2.jobApp_appId_FK JOIN ApplicantSkills AS t4 ON t3.appId = t4.appSkill_appId_FK WHERE t2.hired = 1 AND t1.jobId = ?', [jobId])

        const rejectedByApplicants = runQuery('SELECT t3.appName, t4.appSkill FROM Jobs AS t1 JOIN JobApplication AS t2 ON t1.jobId = t2.jobApp_jobId_FK JOIN Applicants AS t3 ON t3.appId = t2.jobApp_appId_FK JOIN ApplicantSkills AS t4 ON t3.appId = t4.appSkill_appId_FK WHERE t2.rejectedByApplicant = 1 AND t1.jobId = ?', [jobId])

        const skillsArray = jobSkills.map((skill) => skill.jobSkill)

        const reviewJobPage = {
             jobName: jobName[0],
             skills: skillsArray,
             waitlistedApplicants: formatApplicants(waitlistedApplicants),
             hirableApplicants: formatApplicants(hirableApplicants),
             unacceptableApplicants: formatApplicants(unacceptableApplicants),
             offeredApplicants: formatApplicants(offeredApplicants),
             hiredApplicants: formatApplicants(hiredApplicants),
             rejectedByAPplicants: formatApplicants(rejectedByApplicants)
        }

        result = reviewJobPage
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
    console.log(result)
    
    return response
}