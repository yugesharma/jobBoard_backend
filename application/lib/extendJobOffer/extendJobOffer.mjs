import 'dotenv/config'
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
  let result
  let code
  
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event;
    const jobAppId = body.appId

    if(!jobAppId) {
        throw new Error('Job ID is required')
    }

    const jobAppOffer = await runQuery('UPDATE JobApplication SET offered = 1 WHERE jobAppId = ?', [jobAppId])

    const offerDetails = {
        jobAppId: jobAppId,
        jobAppOffer: jobAppOffer
    }

    result = offerDetails
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
    body: JSON.stringify(result)
  }

  return response
}