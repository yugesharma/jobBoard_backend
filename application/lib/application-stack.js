"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigw = __importStar(require("aws-cdk-lib/aws-apigateway"));
const lambdaNodejs = __importStar(require("aws-cdk-lib/aws-lambda-nodejs"));
const path = __importStar(require("node:path"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const aws_cdk_lib_1 = require("aws-cdk-lib");
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const dotenv = __importStar(require("dotenv"));
const cognito = __importStar(require("aws-cdk-lib/aws-cognito"));
dotenv.config();
// import * as sqs from 'aws-cdk-lib/aws-sqs';
class ApplicationStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const role = iam.Role.fromRoleName(this, 'ExistingRole', 'Executor');
        const vpc = ec2.Vpc.fromVpcAttributes(this, 'VPC', {
            vpcId: 'vpc-08daa33dc78c807ac', // Replace with your VPC ID
            availabilityZones: ['us-east-2a', 'us-east-2b', 'us-east-2c'], // Replace with your AZs
            privateSubnetIds: ['subnet-01bf611d80c6ed47f', 'subnet-0984d62887bc41512', 'subnet-05229a8edb9e7146e'], // Replace with your private subnet IDs
        });
        const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'SG', 'sg-0518b8faba2d3716a', {
            mutable: false
        });
        // NOTE: You First have to add RDS_USER and RDS_PASSWORD to 
        // your environment variables for your account. Same with RDS_DATABASE and RDS_HOST
        const rdsUser = process.env.RDS_USER;
        const rdsPassword = process.env.RDS_PASSWORD;
        const rdsDatabase = process.env.RDS_DATABASE;
        const rdsHost = process.env.RDS_HOST;
        // generic default handler for any API function that doesn't get its own Lambda method
        const addCompany_fn = new lambdaNodejs.NodejsFunction(this, 'AddCompanyFunction', {
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: 'addCompany.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, 'addCompany')),
            environment: {
                // Define your environment variables here
                RDS_USER: process.env.RDS_USER,
                RDS_PASSWORD: process.env.RDS_PASSWORD,
                RDS_DATABASE: process.env.RDS_DATABASE,
                RDS_HOST: process.env.RDS_HOST
            },
            role: role, // Use the existing IAM role
            vpc: vpc,
            securityGroups: [securityGroup], // Associate the security group
            timeout: aws_cdk_lib_1.Duration.seconds(3), // Example timeout, adjust as needed
        });
        const addApplicant_fn = new lambdaNodejs.NodejsFunction(this, 'AddApplicantFunction', {
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: 'addApplicant.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, 'addApplicant')),
            environment: {
                // Define your environment variables here
                RDS_USER: process.env.RDS_USER,
                RDS_PASSWORD: process.env.RDS_PASSWORD,
                RDS_DATABASE: process.env.RDS_DATABASE,
                RDS_HOST: process.env.RDS_HOST
            },
            role: role, // Use the existing IAM role
            vpc: vpc,
            securityGroups: [securityGroup], // Associate the security group
            timeout: aws_cdk_lib_1.Duration.seconds(3), // Example timeout, adjust as needed
        });
        // 'REVIEW COMPANY' FUNCTION
        const reviewCompanyProfile_fn = new lambdaNodejs.NodejsFunction(this, 'ReviewCompanyProfileFunction', {
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: 'reviewCompanyProfile.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, 'reviewCompanyProfile')),
            environment: {
                RDS_USER: process.env.RDS_USER,
                RDS_PASSWORD: process.env.RDS_PASSWORD,
                RDS_DATABASE: process.env.RDS_DATABASE,
                RDS_HOST: process.env.RDS_HOST
            },
            role: role,
            vpc: vpc,
            securityGroups: [securityGroup],
            timeout: aws_cdk_lib_1.Duration.seconds(10),
        });
        // 'CREATE JOB' FUNCTION
        const createJob_fn = new lambdaNodejs.NodejsFunction(this, 'CreateJobFunction', {
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: 'createJob.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, 'createJob')),
            environment: {
                RDS_USER: process.env.RDS_USER,
                RDS_PASSWORD: process.env.RDS_PASSWORD,
                RDS_DATABASE: process.env.RDS_DATABASE,
                RDS_HOST: process.env.RDS_HOST
            },
            role: role,
            vpc: vpc,
            securityGroups: [securityGroup],
            timeout: aws_cdk_lib_1.Duration.seconds(10),
        });
        const api = new apigw.RestApi(this, 'RecruitMeApi', {
            defaultCorsPreflightOptions: {
                allowOrigins: apigw.Cors.ALL_ORIGINS,
                allowMethods: apigw.Cors.ALL_METHODS
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
    }
}
exports.ApplicationStack = ApplicationStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb24tc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhcHBsaWNhdGlvbi1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUVuQywrREFBaUQ7QUFDakQsa0VBQW1EO0FBQ25ELDRFQUE2RDtBQUM3RCxnREFBaUM7QUFDakMseURBQTBDO0FBQzFDLDZDQUFzQztBQUN0Qyx5REFBMkM7QUFDM0MsK0NBQWlDO0FBQ2pDLGlFQUFtRDtBQUVuRCxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7QUFFaEIsOENBQThDO0FBRTlDLE1BQWEsZ0JBQWlCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDN0MsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN4QixNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3JFLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtZQUM3QyxLQUFLLEVBQUUsdUJBQXVCLEVBQTZELDJCQUEyQjtZQUN0SCxpQkFBaUIsRUFBRSxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUsWUFBWSxDQUFDLEVBQXFCLHdCQUF3QjtZQUMxRyxnQkFBZ0IsRUFBRSxDQUFDLDBCQUEwQixFQUFFLDBCQUEwQixFQUFFLDBCQUEwQixDQUFDLEVBQWEsdUNBQXVDO1NBQy9KLENBQUMsQ0FBQTtRQUVGLE1BQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxzQkFBc0IsRUFBRTtZQUM1RixPQUFPLEVBQUUsS0FBSztTQUNq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LFlBQVksRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVc7YUFDckM7U0FDRixDQUFDLENBQUM7UUFFSCxNQUFNLGlCQUFpQixHQUFHLElBQUksS0FBSyxDQUFDLDBCQUEwQixDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUN4RixnQkFBZ0IsRUFBRTtnQkFDaEIsT0FBTyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxxQkFBcUIsQ0FBQzthQUN4RTtTQUNGLENBQUMsQ0FBQztRQUVILE1BQU0sZUFBZSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRXhELGVBQWUsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLHVCQUF1QixDQUFDLEVBQUU7WUFDckYsVUFBVSxFQUFFLGlCQUFpQjtZQUM3QixpQkFBaUIsRUFBRSxLQUFLLENBQUMsaUJBQWlCLENBQUMsT0FBTztTQUNuRCxDQUFDLENBQUM7UUFFSCxnQkFBZ0I7UUFDaEIsTUFBTSxpQkFBaUIsR0FBRyxlQUFlLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3BFLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDN0UsVUFBVSxFQUFFLGlCQUFpQjtZQUM3QixpQkFBaUIsRUFBRSxLQUFLLENBQUMsaUJBQWlCLENBQUMsT0FBTztTQUNuRCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF4SEQsNENBd0hDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcclxuaW1wb3J0ICogYXMgYXBpZ3cgZnJvbSBcImF3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5XCJcclxuaW1wb3J0ICogYXMgbGFtYmRhTm9kZWpzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEtbm9kZWpzJ1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ25vZGU6cGF0aCdcclxuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInXHJcbmltcG9ydCB7IER1cmF0aW9uIH0gZnJvbSAnYXdzLWNkay1saWInXHJcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcclxuaW1wb3J0ICogYXMgZG90ZW52IGZyb20gJ2RvdGVudic7XHJcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xyXG5pbXBvcnQgeyBjcmVhdGUgfSBmcm9tICdub2RlOmRvbWFpbic7XHJcbmRvdGVudi5jb25maWcoKTtcclxuXHJcbi8vIGltcG9ydCAqIGFzIHNxcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3FzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvblN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcclxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XHJcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuICAgIGNvbnN0IHJvbGUgPSBpYW0uUm9sZS5mcm9tUm9sZU5hbWUodGhpcywgJ0V4aXN0aW5nUm9sZScsICdFeGVjdXRvcicpO1xyXG4gICAgY29uc3QgdnBjID0gZWMyLlZwYy5mcm9tVnBjQXR0cmlidXRlcyh0aGlzLCAnVlBDJywge1xyXG4gICAgICAgICAgdnBjSWQ6ICd2cGMtMDhkYWEzM2RjNzhjODA3YWMnLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlcGxhY2Ugd2l0aCB5b3VyIFZQQyBJRFxyXG4gICAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZXM6IFsndXMtZWFzdC0yYScsICd1cy1lYXN0LTJiJywgJ3VzLWVhc3QtMmMnXSwgICAgICAgICAgICAgICAgICAgIC8vIFJlcGxhY2Ugd2l0aCB5b3VyIEFac1xyXG4gICAgICAgICAgcHJpdmF0ZVN1Ym5ldElkczogWydzdWJuZXQtMDFiZjYxMWQ4MGM2ZWQ0N2YnLCAnc3VibmV0LTA5ODRkNjI4ODdiYzQxNTEyJywgJ3N1Ym5ldC0wNTIyOWE4ZWRiOWU3MTQ2ZSddLCAgICAgICAgICAgIC8vIFJlcGxhY2Ugd2l0aCB5b3VyIHByaXZhdGUgc3VibmV0IElEc1xyXG4gICAgfSlcclxuXHJcbiAgICBjb25zdCBzZWN1cml0eUdyb3VwID0gZWMyLlNlY3VyaXR5R3JvdXAuZnJvbVNlY3VyaXR5R3JvdXBJZCh0aGlzLCAnU0cnLCAnc2ctMDUxOGI4ZmFiYTJkMzcxNmEnLCB7ICAgLy8gRmluZCB5b3VyIHNlY3VyaXR5IGdyb3VwXHJcbiAgICAgICAgbXV0YWJsZTogZmFsc2VcclxuICAgIH0pXHJcblxyXG4gICAgLy8gTk9URTogWW91IEZpcnN0IGhhdmUgdG8gYWRkIFJEU19VU0VSIGFuZCBSRFNfUEFTU1dPUkQgdG8gXHJcbiAgICAvLyB5b3VyIGVudmlyb25tZW50IHZhcmlhYmxlcyBmb3IgeW91ciBhY2NvdW50LiBTYW1lIHdpdGggUkRTX0RBVEFCQVNFIGFuZCBSRFNfSE9TVFxyXG4gICAgY29uc3QgcmRzVXNlciAgICAgPSBwcm9jZXNzLmVudi5SRFNfVVNFUiFcclxuICAgIGNvbnN0IHJkc1Bhc3N3b3JkID0gcHJvY2Vzcy5lbnYuUkRTX1BBU1NXT1JEIVxyXG4gICAgY29uc3QgcmRzRGF0YWJhc2UgPSBwcm9jZXNzLmVudi5SRFNfREFUQUJBU0UhXHJcbiAgICBjb25zdCByZHNIb3N0ICAgICA9IHByb2Nlc3MuZW52LlJEU19IT1NUIVxyXG5cclxuICAgIC8vIGdlbmVyaWMgZGVmYXVsdCBoYW5kbGVyIGZvciBhbnkgQVBJIGZ1bmN0aW9uIHRoYXQgZG9lc24ndCBnZXQgaXRzIG93biBMYW1iZGEgbWV0aG9kXHJcbiAgICBjb25zdCBhZGRDb21wYW55X2ZuID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnQWRkQ29tcGFueUZ1bmN0aW9uJywge1xyXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjJfWCxcclxuICAgICAgaGFuZGxlcjogJ2FkZENvbXBhbnkuaGFuZGxlcicsXHJcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnYWRkQ29tcGFueScpKSxcclxuICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAvLyBEZWZpbmUgeW91ciBlbnZpcm9ubWVudCB2YXJpYWJsZXMgaGVyZVxyXG4gICAgICAgIFJEU19VU0VSOiBwcm9jZXNzLmVudi5SRFNfVVNFUiEsXHJcbiAgICAgICAgUkRTX1BBU1NXT1JEOiBwcm9jZXNzLmVudi5SRFNfUEFTU1dPUkQhLFxyXG4gICAgICAgIFJEU19EQVRBQkFTRTogcHJvY2Vzcy5lbnYuUkRTX0RBVEFCQVNFISxcclxuICAgICAgICBSRFNfSE9TVDogcHJvY2Vzcy5lbnYuUkRTX0hPU1QhXHJcbiAgICAgIH0sIFxyXG4gICAgICByb2xlOiByb2xlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVc2UgdGhlIGV4aXN0aW5nIElBTSByb2xlXHJcbiAgICAgIHZwYzogdnBjLCAgICAgXHJcbiAgICAgIHNlY3VyaXR5R3JvdXBzOiBbc2VjdXJpdHlHcm91cF0sICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBc3NvY2lhdGUgdGhlIHNlY3VyaXR5IGdyb3VwXHJcbiAgICAgIHRpbWVvdXQ6IER1cmF0aW9uLnNlY29uZHMoMyksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeGFtcGxlIHRpbWVvdXQsIGFkanVzdCBhcyBuZWVkZWRcclxuICAgIH0pXHJcblxyXG4gICAgY29uc3QgYWRkQXBwbGljYW50X2ZuID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnQWRkQXBwbGljYW50RnVuY3Rpb24nLCB7XHJcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMl9YLFxyXG4gICAgICBoYW5kbGVyOiAnYWRkQXBwbGljYW50LmhhbmRsZXInLFxyXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJ2FkZEFwcGxpY2FudCcpKSxcclxuICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAvLyBEZWZpbmUgeW91ciBlbnZpcm9ubWVudCB2YXJpYWJsZXMgaGVyZVxyXG4gICAgICAgIFJEU19VU0VSOiBwcm9jZXNzLmVudi5SRFNfVVNFUiEsXHJcbiAgICAgICAgUkRTX1BBU1NXT1JEOiBwcm9jZXNzLmVudi5SRFNfUEFTU1dPUkQhLFxyXG4gICAgICAgIFJEU19EQVRBQkFTRTogcHJvY2Vzcy5lbnYuUkRTX0RBVEFCQVNFISxcclxuICAgICAgICBSRFNfSE9TVDogcHJvY2Vzcy5lbnYuUkRTX0hPU1QhXHJcbiAgICAgIH0sIFxyXG4gICAgICByb2xlOiByb2xlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVc2UgdGhlIGV4aXN0aW5nIElBTSByb2xlXHJcbiAgICAgIHZwYzogdnBjLCAgICAgXHJcbiAgICAgIHNlY3VyaXR5R3JvdXBzOiBbc2VjdXJpdHlHcm91cF0sICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBc3NvY2lhdGUgdGhlIHNlY3VyaXR5IGdyb3VwXHJcbiAgICAgIHRpbWVvdXQ6IER1cmF0aW9uLnNlY29uZHMoMyksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeGFtcGxlIHRpbWVvdXQsIGFkanVzdCBhcyBuZWVkZWRcclxuICAgIH0pXHJcblxyXG4gICAgXHJcblxyXG4gICAgLy8gJ1JFVklFVyBDT01QQU5ZJyBGVU5DVElPTlxyXG4gICAgY29uc3QgcmV2aWV3Q29tcGFueVByb2ZpbGVfZm4gPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdSZXZpZXdDb21wYW55UHJvZmlsZUZ1bmN0aW9uJywge1xyXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjJfWCxcclxuICAgICAgaGFuZGxlcjogJ3Jldmlld0NvbXBhbnlQcm9maWxlLmhhbmRsZXInLFxyXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJ3Jldmlld0NvbXBhbnlQcm9maWxlJykpLCBcclxuICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICBSRFNfVVNFUjogcHJvY2Vzcy5lbnYuUkRTX1VTRVIhLFxyXG4gICAgICAgIFJEU19QQVNTV09SRDogcHJvY2Vzcy5lbnYuUkRTX1BBU1NXT1JEISxcclxuICAgICAgICBSRFNfREFUQUJBU0U6IHByb2Nlc3MuZW52LlJEU19EQVRBQkFTRSEsXHJcbiAgICAgICAgUkRTX0hPU1Q6IHByb2Nlc3MuZW52LlJEU19IT1NUIVxyXG4gICAgICB9LCBcclxuICAgICAgcm9sZTogcm9sZSxcclxuICAgICAgdnBjOiB2cGMsICAgICBcclxuICAgICAgc2VjdXJpdHlHcm91cHM6IFtzZWN1cml0eUdyb3VwXSxcclxuICAgICAgdGltZW91dDogRHVyYXRpb24uc2Vjb25kcygxMCksIFxyXG4gICAgfSlcclxuXHJcbiAgICAvLyAnQ1JFQVRFIEpPQicgRlVOQ1RJT05cclxuICAgIGNvbnN0IGNyZWF0ZUpvYl9mbiA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0NyZWF0ZUpvYkZ1bmN0aW9uJywge1xyXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjJfWCxcclxuICAgICAgaGFuZGxlcjogJ2NyZWF0ZUpvYi5oYW5kbGVyJyxcclxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICdjcmVhdGVKb2InKSksIFxyXG4gICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgIFJEU19VU0VSOiBwcm9jZXNzLmVudi5SRFNfVVNFUiEsXHJcbiAgICAgICAgUkRTX1BBU1NXT1JEOiBwcm9jZXNzLmVudi5SRFNfUEFTU1dPUkQhLFxyXG4gICAgICAgIFJEU19EQVRBQkFTRTogcHJvY2Vzcy5lbnYuUkRTX0RBVEFCQVNFISxcclxuICAgICAgICBSRFNfSE9TVDogcHJvY2Vzcy5lbnYuUkRTX0hPU1QhXHJcbiAgICAgIH0sIFxyXG4gICAgICByb2xlOiByb2xlLFxyXG4gICAgICB2cGM6IHZwYywgICAgIFxyXG4gICAgICBzZWN1cml0eUdyb3VwczogW3NlY3VyaXR5R3JvdXBdLFxyXG4gICAgICB0aW1lb3V0OiBEdXJhdGlvbi5zZWNvbmRzKDEwKSwgXHJcbiAgICB9KVxyXG5cclxuICAgIFxyXG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWd3LlJlc3RBcGkodGhpcywgJ1JlY3J1aXRNZUFwaScsIHtcclxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB7XHJcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlndy5Db3JzLkFMTF9PUklHSU5TLCBcclxuICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWd3LkNvcnMuQUxMX01FVEhPRFNcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgY29tcGFueUF1dGhvcml6ZXIgPSBuZXcgYXBpZ3cuQ29nbml0b1VzZXJQb29sc0F1dGhvcml6ZXIodGhpcywgJ0NvbXBhbnlBdXRob3JpemVyJywge1xyXG4gICAgICBjb2duaXRvVXNlclBvb2xzOiBbXHJcbiAgICAgICAgY29nbml0by5Vc2VyUG9vbC5mcm9tVXNlclBvb2xJZCh0aGlzLCAnQ29tcGFueScsICd1cy1lYXN0LTJfaGg5eWJ1Wm95JykgXHJcbiAgICAgIF1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGNvbXBhbnlSZXNvdXJjZSA9IGFwaS5yb290LmFkZFJlc291cmNlKCdjb21wYW55Jyk7XHJcblxyXG4gICAgY29tcGFueVJlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWd3LkxhbWJkYUludGVncmF0aW9uKHJldmlld0NvbXBhbnlQcm9maWxlX2ZuKSwge1xyXG4gICAgICBhdXRob3JpemVyOiBjb21wYW55QXV0aG9yaXplcixcclxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWd3LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvL0NSRUFURSBKT0IgQVBJXHJcbiAgICBjb25zdCBjcmVhdGVKb2JSZXNvdXJjZSA9IGNvbXBhbnlSZXNvdXJjZS5hZGRSZXNvdXJjZSgnY3JlYXRlX2pvYicpO1xyXG4gICAgY3JlYXRlSm9iUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWd3LkxhbWJkYUludGVncmF0aW9uKGNyZWF0ZUpvYl9mbiksIHtcclxuICAgICAgYXV0aG9yaXplcjogY29tcGFueUF1dGhvcml6ZXIsXHJcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlndy5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59Il19