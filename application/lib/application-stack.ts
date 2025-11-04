import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as path from 'node:path'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { Duration } from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dotenv from 'dotenv';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { create } from 'node:domain';
dotenv.config();

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const role = iam.Role.fromRoleName(this, 'ExistingRole', 'Executor');
    const vpc = ec2.Vpc.fromVpcAttributes(this, 'VPC', {
          vpcId: 'vpc-08daa33dc78c807ac',                                                            // Replace with your VPC ID
          availabilityZones: ['us-east-2a', 'us-east-2b', 'us-east-2c'],                    // Replace with your AZs
          privateSubnetIds: ['subnet-01bf611d80c6ed47f', 'subnet-0984d62887bc41512', 'subnet-05229a8edb9e7146e'],            // Replace with your private subnet IDs
    })

    const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'SG', 'sg-0518b8faba2d3716a', {   // Find your security group
        mutable: false
    })

    // NOTE: You First have to add RDS_USER and RDS_PASSWORD to 
    // your environment variables for your account. Same with RDS_DATABASE and RDS_HOST
    const rdsUser     = process.env.RDS_USER!
    const rdsPassword = process.env.RDS_PASSWORD!
    const rdsDatabase = process.env.RDS_DATABASE!
    const rdsHost     = process.env.RDS_HOST!

    // generic default handler for any API function that doesn't get its own Lambda method
    const addCompany_fn = new lambdaNodejs.NodejsFunction(this, 'AddCompanyFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'addCompany.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'addCompany')),
      environment: {
        // Define your environment variables here
        RDS_USER: process.env.RDS_USER!,
        RDS_PASSWORD: process.env.RDS_PASSWORD!,
        RDS_DATABASE: process.env.RDS_DATABASE!,
        RDS_HOST: process.env.RDS_HOST!
      }, 
      role: role,                                                          // Use the existing IAM role
      vpc: vpc,     
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    const addApplicant_fn = new lambdaNodejs.NodejsFunction(this, 'AddApplicantFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'addApplicant.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'addApplicant')),
      environment: {
        // Define your environment variables here
        RDS_USER: process.env.RDS_USER!,
        RDS_PASSWORD: process.env.RDS_PASSWORD!,
        RDS_DATABASE: process.env.RDS_DATABASE!,
        RDS_HOST: process.env.RDS_HOST!
      }, 
      role: role,                                                          // Use the existing IAM role
      vpc: vpc,     
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    

    // 'REVIEW COMPANY' FUNCTION
    const reviewCompanyProfile_fn = new lambdaNodejs.NodejsFunction(this, 'ReviewCompanyProfileFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'reviewCompanyProfile.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'reviewCompanyProfile')), 
      environment: {
        RDS_USER: process.env.RDS_USER!,
        RDS_PASSWORD: process.env.RDS_PASSWORD!,
        RDS_DATABASE: process.env.RDS_DATABASE!,
        RDS_HOST: process.env.RDS_HOST!
      }, 
      role: role,
      vpc: vpc,     
      securityGroups: [securityGroup],
      timeout: Duration.seconds(10), 
    })

      // 'REVIEW APPLICANT' FUNCTION
    const reviewApplicantProfile_fn = new lambdaNodejs.NodejsFunction(this, 'ReviewApplicantProfileFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'reviewApplicantProfile.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'reviewApplicantProfile')), 
      environment: {
        RDS_USER: process.env.RDS_USER!,
        RDS_PASSWORD: process.env.RDS_PASSWORD!,
        RDS_DATABASE: process.env.RDS_DATABASE!,
        RDS_HOST: process.env.RDS_HOST!
      }, 
      role: role,
      vpc: vpc,     
      securityGroups: [securityGroup],
      timeout: Duration.seconds(10), 
    })

    // 'CREATE JOB' FUNCTION
    const createJob_fn = new lambdaNodejs.NodejsFunction(this, 'CreateJobFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'createJob.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'createJob')), 
      environment: {
        RDS_USER: process.env.RDS_USER!,
        RDS_PASSWORD: process.env.RDS_PASSWORD!,
        RDS_DATABASE: process.env.RDS_DATABASE!,
        RDS_HOST: process.env.RDS_HOST!
      }, 
      role: role,
      vpc: vpc,     
      securityGroups: [securityGroup],
      timeout: Duration.seconds(10), 
    })

    // 'EDIT JOB' FUNCTION
    const editJob_fn = new lambdaNodejs.NodejsFunction(this, 'EditJobFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'editJob.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'editJob')), 
      environment: {
        RDS_USER: process.env.RDS_USER!,
        RDS_PASSWORD: process.env.RDS_PASSWORD!,
        RDS_DATABASE: process.env.RDS_DATABASE!,
        RDS_HOST: process.env.RDS_HOST!
      }, 
      role: role,
      vpc: vpc,     
      securityGroups: [securityGroup],
      timeout: Duration.seconds(10), 
    })

    // 'GET JOB BY ID' FUNCTION
    const getJobById_fn = new lambdaNodejs.NodejsFunction(this, 'GetJobByIdFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'getJobById.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'getJobById')), 
      environment: {
        RDS_USER: process.env.RDS_USER!,
        RDS_PASSWORD: process.env.RDS_PASSWORD!,
        RDS_DATABASE: process.env.RDS_DATABASE!,
        RDS_HOST: process.env.RDS_HOST!
      }, 
      role: role,
      vpc: vpc,     
      securityGroups: [securityGroup],
      timeout: Duration.seconds(10), 
    })

    // 'EDIT COMPANY PROFILE' FUNCTION
    const editCompanyProfile_fn = new lambdaNodejs.NodejsFunction(this, 'EditCompanyProfileFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'editCompanyProfile.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'editCompanyProfile')), 
    // 'EDIT APPLICANT PROFILE' FUNCTION
    const editApplicantProfile_fn = new lambdaNodejs.NodejsFunction(this, 'EditApplicantProfileFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'editApplicantProfile.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'editApplicantProfile')), 
      environment: {
        RDS_USER: process.env.RDS_USER!,
        RDS_PASSWORD: process.env.RDS_PASSWORD!,
        RDS_DATABASE: process.env.RDS_DATABASE!,
        RDS_HOST: process.env.RDS_HOST!
      }, 
      role: role,
      vpc: vpc,     
      securityGroups: [securityGroup],
      timeout: Duration.seconds(10), 
    })

    
    const api = new apigw.RestApi(this, 'RecruitMeApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS, 
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      }
    });

    const companyAuthorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'CompanyAuthorizer', {
      cognitoUserPools: [
        cognito.UserPool.fromUserPoolId(this, 'Company', 'us-east-2_hh9ybuZoy') 
      ]
    });

    const companyResource = api.root.addResource('company');

    companyResource.addMethod('GET', new apigw.LambdaIntegration(reviewCompanyProfile_fn), {
      authorizer: companyAuthorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });
    

    //CREATE JOB API
    const createJobResource = companyResource.addResource('create_job');
    createJobResource.addMethod('POST', new apigw.LambdaIntegration(createJob_fn), {
      authorizer: companyAuthorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });

    const applicantAuthorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'ApplicantAuthorizer', {
      cognitoUserPools: [
        cognito.UserPool.fromUserPoolId(this, 'Applicant', 'us-east-2_87wvNq12q') 
      ]
    });

    const applicantResource = api.root.addResource('applicant');

    applicantResource.addMethod('GET', new apigw.LambdaIntegration(reviewApplicantProfile_fn), {
      authorizer: applicantAuthorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });

    //EDIT JOB API
    const editJobResource = companyResource.addResource('edit_job');
    editJobResource.addMethod('POST', new apigw.LambdaIntegration(editJob_fn), {
      authorizer: companyAuthorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });

    //GET JOB BY ID API
    const getJobByIdResource = companyResource.addResource('get_job_by_id');
    getJobByIdResource.addMethod('POST', new apigw.LambdaIntegration(getJobById_fn), {
      authorizer: companyAuthorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });
  }
}