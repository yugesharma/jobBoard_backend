import 'dotenv/config'
import mysql from 'mysql'

var pool = mysql.createPool({
     host: process.env.RDS_HOST,
     user: process.env.RDS_USER,
     password: process.env.RDS_PASSWORD,
     database: process.env.RDS_DATABASE,
})

function runQuery(query, params) {
     return new Promise((resolve, reject) => {
          pool.query(query, params, (error, rows) => {
               if (error) {
                    reject(error)
               } else {
                    resolve(rows)
               }
          })
     })
}

export const handler = async (event) => {
     let code = 200
     let body

     try {
          const payloadBody=typeof event.body === "string" ? JSON.parse(event.body) : event
          const limit=Number(payloadBody.PAGE_SIZE) 
          const offset=Number(payloadBody.offset)
     
          const Companies = await runQuery(
                    'SELECT t1.compId, t1.compName, COUNT(DISTINCT t2.jobId) AS job_count, COUNT(DISTINCT t3.jobAppId) AS application_count, COUNT(CASE WHEN t3.hired = 1 THEN 1 ELSE NULL END) AS hired_count FROM Companies AS t1 LEFT JOIN Jobs AS t2 ON t1.compId = t2.jobs_compId_FK LEFT JOIN JobApplication AS t3 ON t2.jobId = t3.jobApp_jobId_FK GROUP BY t1.compId ORDER BY t1.compName ASC LIMIT ? OFFSET ?',[limit, offset])
          const totalCompanies = await runQuery('SELECT COUNT(*) AS total_count FROM Companies')
          body = {
               companies: Companies,
               total_count: totalCompanies[0].total_count
          }

     } catch (e) {
          code = 400
          body = { error: e.message }
     }

     const response = {
          statusCode: code,
          headers: {
               'Access-Control-Allow-Origin': '*', 
               'Access-Control-Allow-Headers': '*',
               'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          },
          body: JSON.stringify(body),
     }
     
     console.log(body)

     return response
}