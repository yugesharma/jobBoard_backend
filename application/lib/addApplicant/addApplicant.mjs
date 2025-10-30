import 'dotenv/config';
import mysql from 'mysql'


var pool=mysql.createPool({
  host:process.env.RDS_HOST,
  user:process.env.RDS_USER,
  password:process.env.RDS_PASSWORD,
  database:process.env.RDS_DATABASE
});

export const handler=async (event)=> {
  // console.log(event.request.userAttributes)
  // return event;
  let code
  let result= await new Promise((resolve, reject) => {
    const query='INSERT INTO recruitMe.Applicants (appId,appName,appPassword) VALUES (?,?,?)'
    const values=[event.request.userAttributes.sub, event.userName,null]
    pool.query(query,values,(error,rows)=> {
      if(error) {
        code=400
        reject(error)
      }
      else{
        code=200
        resolve(rows)
      }
      
    })
})
  
  const response={
    statusCode:code,
    body:JSON.stringify(result)
  }
  return event
}
