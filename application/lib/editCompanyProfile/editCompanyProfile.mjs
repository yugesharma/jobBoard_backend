import 'dotenv/config';
import mysql from 'mysql'

var pool=mysql.createPool({
  host:process.env.RDS_HOST,
  user:process.env.RDS_USER,
  password:process.env.RDS_PASSWORD,
  database:process.env.RDS_DATABASE
});


const updateCompanyName = (companyId, newName) => {
 
  return new Promise((resolve, reject) => {
    const query = 'UPDATE recruitMe.Companies SET compName=? WHERE compId=?'
    pool.query(query, [newName, companyId], (error, results) => {
      if (error) return reject(error)
      if (results.affectedRows === 0) return reject('No company found with that ID')
      resolve('Company name updated successfully')
    })
  })
}

export const handler = async (event) => {
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event;
    if (!body.compID) {
      throw new Error('Company ID is required');
    }
    if (!body.newName) {
      throw new Error('A valid name is required');
    }
    const message = await updateCompanyName(body.compID, body.newName)

    return {
        statusCode: 200,
        headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",       
        "Access-Control-Allow-Headers": "*",     
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"  
        },
        body: JSON.stringify({ message })
    }
  } catch (error) {
    return {
        statusCode: 400,
        headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",       
        "Access-Control-Allow-Headers": "*",     
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"  
        },
        body: JSON.stringify({ error: error.toString() })
    }
  }
}
