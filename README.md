# RecruitMe

RecruitMe is a full-stack recruitment platform where companies post jobs, applicants search and apply, and admins monitor platform activity.

The project is designed to showcase backend engineering with AWS serverless infrastructure, role-based authentication, and SQL-backed business workflows.

The project is an extension of my group submission along with Laura Pellowski, Hengyu Liu and Matthew McAlarney for CS 509, Design of Software Systems

## Demo

Currently offline to control AWS Cost.
[Demo video](https://drive.google.com/file/d/1z6iB63xNVI9VnAqHe9qSSONLe5MMDJ9v/view?usp=drive_link)


## Why this project stands out

- Built with 20+ backend operations covering the full hiring lifecycle
- Infrastructure defined as code with AWS CDK (not manual console setup)
- Role-based access control with separate Cognito user pools
- SQL query design for search, reporting, and workflow state transitions

## Core Features

### Applicant
- Create and edit profile
- Add skills
- Search jobs by skill or company
- Apply / withdraw / accept offer / reject offer

### Company
- Create and edit jobs
- View applicants per job
- Rate applicants
- Extend offers and rescind offers
- Update job status and check applicant counts

### Admin
- Company report
- Applicant report
- Jobs report

## Backend Architecture

- API layer: Amazon API Gateway (REST)
- Compute layer: AWS Lambda (Node.js)
- Auth layer: Amazon Cognito (Applicant, Company, Admin pools)
- Data layer: Amazon RDS (MySQL)
- Infra layer: AWS CDK (TypeScript)

High-level request flow:

1. Frontend sends a request with Cognito token
2. API Gateway validates authorization by role
3. Lambda executes business logic
4. Lambda reads/writes MySQL in RDS
5. API response returns to frontend

## Tech Stack

### Frontend
- React + TypeScript
- React Router
- Tailwind CSS

### Backend
- AWS Lambda (Node.js runtime)
- API Gateway
- Cognito
- MySQL (RDS)

### Dev + Infra
- AWS CDK (TypeScript)
- npm
- Jest
- Prettier

## Run Locally

## 1) Frontend

```bash
cd app
npm install
npm start
```

Frontend runs at `http://localhost:3000`.

## 2) Backend

```bash
cd ../Recruit.me_Backend/application
npm install
npm run build
```

Set environment variables before running or deploying backend services:

- `RDS_HOST`
- `RDS_USER`
- `RDS_PASSWORD`
- `RDS_DATABASE`

CDK commands:

```bash
npx cdk synth
npx cdk deploy
```

## Deployment Notes

- Frontend build: `npm run build` from the `app` directory
- Static hosting target: Amazon S3 (+ optional CloudFront)
- If CloudFront is enabled, invalidate cache after deploy

