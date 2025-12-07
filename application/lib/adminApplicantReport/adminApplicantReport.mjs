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
          const applicants = await runQuery(
                    'SELECT a.appId, a.appName, COUNT(DISTINCT j.jobAppId) AS jobs_applied, COUNT(CASE WHEN j.hired = 1 THEN 1 ELSE NULL END) AS jobs_accepted, COUNT(CASE WHEN j.withdrawn = 1 THEN 1 ELSE NULL END) AS jobs_withdrawn FROM Applicants AS a LEFT JOIN JobApplication AS j ON a.appId = j.jobApp_appId_FK GROUP BY a.appId')
          
          body = {
               applicants: applicants,
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