import 'dotenv/config';
import mysql from 'mysql'

var pool=mysql.createPool({
  host:process.env.RDS_HOST,
  user:process.env.RDS_USER,
  password:process.env.RDS_PASSWORD,
  database:process.env.RDS_DATABASE
});

function runQuery(query, params) {
    return new Promise((resolve, reject) => {
        pool.query(query, params, (error, rows) => {
            if (error) {
                return reject(error)
            }
            return resolve(rows)
        })
    })
}

export const handler = async (event) => {
    let code = 200
    let result

    try {
        const body = typeof event.body === "string" ? JSON.parse(event.body) : event
        const jobId = body.jobId
        const pageSize = body.pageSize || 5
        const waitListOffset = body.offsets[0]
      
        if(!jobId) {
            throw new Error('Job ID is required')
        }

        const separator = ', '
        
        const jobName = await runQuery('SELECT jobName FROM Jobs WHERE jobId = ?', [jobId])

        const jobSkills = await runQuery('SELECT t2.jobSkill FROM Jobs t1 LEFT JOIN JobSkills t2 ON t1.jobId = t2.jobSkill_jobId_FK WHERE t1.jobId = ?', [jobId])

        const waitlistedApplicants = await runQuery('SELECT t3.appName, t2.jobAppId, group_concat(t4.appSkill SEPARATOR ?) AS app_skills FROM Jobs AS t1 JOIN JobApplication AS t2 ON t1.jobId = t2.jobApp_jobId_FK JOIN Applicants AS t3 ON t3.appId = t2.jobApp_appId_FK JOIN ApplicantSkills AS t4 ON t3.appId = t4.appSkill_appId_FK WHERE t2.status = ? AND t1.jobId = ? GROUP BY t3.appId ORDER BY t3.appId ASC LIMIT ? OFFSET ?', [separator,'waitList', jobId, pageSize, waitListOffset])
        const waitlistedCount = await runQuery('SELECT COUNT(*) as waitListedTotal FROM (SELECT t1.jobApp_appId_FK FROM JobApplication AS t1 JOIN ApplicantSkills as t2 ON t1.jobApp_appId_FK=t2.appSkill_appId_FK WHERE t1.status = ? AND t1.jobApp_jobId_FK  = ? group by t1.jobApp_appId_FK) AS subquery',['waitList', jobId])
        
        const hirableApplicants = await runQuery('SELECT t3.appName, t2.jobAppId, group_concat(t4.appSkill SEPARATOR ?) AS app_skills FROM Jobs AS t1 JOIN JobApplication AS t2 ON t1.jobId = t2.jobApp_jobId_FK JOIN Applicants AS t3 ON t3.appId = t2.jobApp_appId_FK JOIN ApplicantSkills AS t4 ON t3.appId = t4.appSkill_appId_FK WHERE t2.status = ? AND t1.jobId = ? GROUP BY t3.appId', [separator, 'hirable', jobId])
        const hirableCount = await runQuery('SELECT COUNT(*) as hirableTotal FROM (SELECT t1.jobApp_appId_FK FROM JobApplication AS t1 JOIN ApplicantSkills as t2 ON t1.jobApp_appId_FK=t2.appSkill_appId_FK WHERE t1.status = ? AND t1.jobApp_jobId_FK  = ? group by t1.jobApp_appId_FK) AS subquery',['hirable', jobId])

        const unacceptableApplicants = await runQuery('SELECT t3.appName, t2.jobAppId,  group_concat(t4.appSkill SEPARATOR ?) AS app_skills FROM Jobs AS t1 JOIN JobApplication AS t2 ON t1.jobId = t2.jobApp_jobId_FK JOIN Applicants AS t3 ON t3.appId = t2.jobApp_appId_FK JOIN ApplicantSkills AS t4 ON t3.appId = t4.appSkill_appId_FK WHERE t2.status = ? AND t1.jobId = ? GROUP BY t3.appId', [separator, 'unacceptable', jobId])
        const unacceptableCount = await runQuery('SELECT COUNT(*) as unacceptableTotal FROM (SELECT t1.jobApp_appId_FK FROM JobApplication AS t1 JOIN ApplicantSkills as t2 ON t1.jobApp_appId_FK=t2.appSkill_appId_FK WHERE t1.status = ? AND t1.jobApp_jobId_FK  = ? group by t1.jobApp_appId_FK) AS subquery',['unacceptable', jobId])

        const offeredApplicants = await runQuery('SELECT t3.appName, t2.jobAppId,  group_concat(t4.appSkill SEPARATOR ?) AS app_skills FROM Jobs AS t1 JOIN JobApplication AS t2 ON t1.jobId = t2.jobApp_jobId_FK JOIN Applicants AS t3 ON t3.appId = t2.jobApp_appId_FK JOIN ApplicantSkills AS t4 ON t3.appId = t4.appSkill_appId_FK WHERE t2.offered = 1  AND t2.hired = 0 AND t2.rejectedByApplicant = 0 AND t1.jobId = ? GROUP BY t3.appId', [separator, jobId])
        const offeredCount=await runQuery('SELECT COUNT(*) as offeredTotal FROM (SELECT t1.jobApp_appId_FK FROM JobApplication AS t1 JOIN ApplicantSkills as t2 ON t1.jobApp_appId_FK=t2.appSkill_appId_FK WHERE t1.offered = 1 AND t1.hired=0 AND t1.rejectedByApplicant = 0 AND t1.jobApp_jobId_FK  = ? group by t1.jobApp_appId_FK) AS subquery',[jobId])

        const hiredApplicants = await runQuery('SELECT t3.appName, t2.jobAppId,  group_concat(t4.appSkill SEPARATOR ?) AS app_skills FROM Jobs AS t1 JOIN JobApplication AS t2 ON t1.jobId = t2.jobApp_jobId_FK JOIN Applicants AS t3 ON t3.appId = t2.jobApp_appId_FK JOIN ApplicantSkills AS t4 ON t3.appId = t4.appSkill_appId_FK WHERE t2.hired = 1 AND t2.rejectedByApplicant = 0 AND t1.jobId = ? GROUP BY t3.appId', [separator, jobId])
        const hiredCount=await runQuery('SELECT COUNT(*) as hiredTotal FROM (SELECT t1.jobApp_appId_FK FROM JobApplication AS t1 JOIN ApplicantSkills as t2 ON t1.jobApp_appId_FK=t2.appSkill_appId_FK WHERE t1.hired=1 AND t1.rejectedByApplicant = 0 AND t1.jobApp_jobId_FK  = ?  group by t1.jobApp_appId_FK) AS subquery',[jobId])

        const rejectedByApplicants = await runQuery('SELECT t3.appName, t2.jobAppId,  group_concat(t4.appSkill SEPARATOR ?) AS app_skills FROM Jobs AS t1 JOIN JobApplication AS t2 ON t1.jobId = t2.jobApp_jobId_FK JOIN Applicants AS t3 ON t3.appId = t2.jobApp_appId_FK JOIN ApplicantSkills AS t4 ON t3.appId = t4.appSkill_appId_FK WHERE t2.rejectedByApplicant = 1 AND t1.jobId = ? GROUP BY t3.appId', [separator, jobId])
        const rejectedCount=await runQuery('SELECT COUNT(*) as rejectedTotal FROM (SELECT t1.jobApp_appId_FK FROM JobApplication AS t1 JOIN ApplicantSkills as t2 ON t1.jobApp_appId_FK=t2.appSkill_appId_FK WHERE t1.rejectedByApplicant = 1 AND t1.jobApp_jobId_FK  = ?  group by t1.jobApp_appId_FK) AS subquery',[jobId])


        const skillsArray = jobSkills.map((skill) => skill.jobSkill)

        const reviewJobPage = {
             jobName: jobName[0],
             skills: skillsArray,
             waitlistedApplicants: waitlistedApplicants,
             hirableApplicants: hirableApplicants,
             unacceptableApplicants: unacceptableApplicants,
             offeredApplicants: offeredApplicants,
             hiredApplicants: hiredApplicants,
             rejectedByApplicants: rejectedByApplicants,
             counts: {
                waitlistedTotal: waitlistedCount[0].waitListedTotal,
                hirableTotal: hirableCount[0].hirableTotal,
                unacceptableTotal: unacceptableCount[0].unacceptableTotal,
                offeredTotal: offeredCount[0].offeredTotal,
                hiredTotal: hiredCount[0].hiredTotal,
                rejectedTotal: rejectedCount[0].rejectedTotal
             }
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
    console.log('body: ',JSON.stringify(result))
    
    return response
}