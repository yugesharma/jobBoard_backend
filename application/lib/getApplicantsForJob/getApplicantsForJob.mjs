import 'dotenv/config';
import mysql from 'mysql'

var pool=mysql.createPool({
  host:process.env.RDS_HOST,
  user:process.env.RDS_USER,
  password:process.env.RDS_PASSWORD,
  database:process.env.RDS_DATABASE
});

let getApplicantsForJob = (jobId) => {
    return new Promise((resolve, reject) => {
        pool.query("", (error, rows) => {
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
        result = await getApplicantsForJob(body.jobId)
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