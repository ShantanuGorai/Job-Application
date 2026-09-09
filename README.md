# 💼 AI-Powered Job Application Platform

An intelligent **full-stack job application platform** that helps candidates manage job applications and create **personalized, job-specific application materials** using AI.

Instead of submitting the same resume and cover letter to every company, the platform analyzes a **Job Description (JD)** against the candidate's profile, identifies relevant skill gaps, and generates tailored application documents.

---

## ✨ Features

### 🤖 AI-Powered Application Assistance

#### 📄 AI Resume Generator

Generate an optimized resume specifically for a target job.

The system:

* Analyzes the provided Job Description
* Extracts required skills, technologies, qualifications, and keywords
* Analyzes the candidate's existing resume/profile
* Identifies relevant skill gaps
* Matches existing skills with job requirements
* Generates an improved, role-specific resume
* Incorporates relevant skills and experience
* Optimizes content according to the target position

> The generated resume is intended to improve job relevance while preserving truthful candidate information.

---

### ✉️ AI Cover Letter Generator

Automatically generates a **personalized cover letter** based on the target Job Description and candidate profile.

The system considers:

* Job requirements
* Required technical skills
* Candidate's skills
* Candidate's experience
* Projects
* Role-specific requirements

This produces a **job-specific cover letter** instead of relying on generic templates.

---

### 🔍 Skill Gap Analysis

The platform compares the candidate's current profile against the requirements of a target job.

```text
Candidate Skills
       │
       ▼
┌─────────────────────┐
│  Skill Extraction   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Job Description     │
│ Requirement Analysis│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Skill Comparison    │
└──────────┬──────────┘
           │
           ▼
      Skill Gaps
```

This helps candidates understand which skills are relevant to their target role.

---

### 💼 Job Application Management

* Create job applications
* Store application information
* Track application status
* Manage multiple applications
* View application details
* Organize the job-search process

---

### 📊 Application Dashboard

A centralized dashboard allows users to manage their job search from one place.

Users can keep track of:

* Applied jobs
* Application status
* Job information
* Application progress
* Generated application materials

---

### 📎 Resume Upload & Parsing

The platform supports resume uploading and processing.

Resume information can be extracted and used as input for AI-powered application generation.

---

### 🔐 Authentication

Secure user authentication system with:

* User registration
* Login
* Session-based authentication
* Protected routes
* Google OAuth
* GitHub OAuth

---

### 🎨 Modern UI

The frontend provides a responsive and interactive experience using:

* Modern React components
* Tailwind CSS
* Smooth animations
* Interactive forms
* Responsive layouts
* Toast notifications
* Dashboard-based navigation

---

# 🏗️ System Architecture

```text
                       ┌──────────────────┐
                       │      USER        │
                       └────────┬─────────┘
                                │
                                ▼
                 ┌──────────────────────────┐
                 │     React Frontend       │
                 │   TypeScript + Vite      │
                 │      Tailwind CSS        │
                 └────────────┬─────────────┘
                              │
                         REST API
                              │
                              ▼
                 ┌──────────────────────────┐
                 │    Node.js + Express     │
                 │        Backend           │
                 └────────────┬─────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
   ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
   │   MongoDB   │    │ Authentication│    │ AI Services  │
   │  + Mongoose │    │ OAuth/Session │    │              │
   └─────────────┘    └──────────────┘    └──────┬───────┘
                                                  │
                                      ┌───────────┴───────────┐
                                      │                       │
                                      ▼                       ▼
                              Resume Generation       Cover Letter
                                                       Generation
```

---

# 🔄 AI Application Workflow

```text
                ┌─────────────────┐
                │  Job Description│
                └────────┬────────┘
                         │
                         ▼
              ┌────────────────────┐
              │ JD Analysis        │
              │                    │
              │ Skills             │
              │ Keywords           │
              │ Requirements       │
              └─────────┬──────────┘
                        │
                        ▼
              ┌────────────────────┐
              │ Candidate Profile  │
              │                    │
              │ Resume             │
              │ Skills             │
              │ Projects           │
              │ Experience         │
              └─────────┬──────────┘
                        │
                        ▼
              ┌────────────────────┐
              │ Skill Gap Analysis │
              └─────────┬──────────┘
                        │
             ┌──────────┴───────────┐
             │                      │
             ▼                      ▼
    ┌─────────────────┐    ┌─────────────────┐
    │ Resume Generator│    │ Cover Letter    │
    │                 │    │ Generator       │
    └────────┬────────┘    └────────┬────────┘
             │                      │
             └──────────┬───────────┘
                        ▼
              ┌────────────────────┐
              │ Personalized       │
              │ Application        │
              │ Materials          │
              └────────────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

* **React**
* **TypeScript**
* **Vite**
* **Tailwind CSS**
* **React Router**
* **Framer Motion**
* **React Hook Form**
* **Zod**
* **Lucide React**
* **Recharts**

## Backend

* **Node.js**
* **Express.js**
* **MongoDB**
* **Mongoose**
* **Passport.js**
* **Express Session**
* **Multer**
* **Nodemailer**
* **Cheerio**

## AI / Resume Processing

* Generative AI
* Job Description Analysis
* Resume Parsing
* Skill Extraction
* Skill Gap Analysis
* AI-powered Resume Generation
* AI-powered Cover Letter Generation

## Authentication

* Session-based Authentication
* Google OAuth 2.0
* GitHub OAuth

---

# 📁 Project Structure

```text
Job-Application/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── passport/
│   ├── uploads/
│   │   └── resumes/
│   ├── package.json
│   └── server.js
│
├── parsed_resumes/
├── skills_db/
├── parser.py
├── requirements.txt
└── README.md
```

---

# ⚙️ Installation & Setup

## 1. Clone the Repository

```bash
git clone https://github.com/ShantanuGorai/Job-Application.git

cd Job-Application
```

---

# 🎨 Frontend Setup

Navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 🔧 Backend Setup

Open a new terminal.

Navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Start the server:

```bash
node server.js
```

The backend runs on the port specified in the environment configuration.

---

# 🔑 Environment Variables

Create a `.env` file inside the `backend` directory.

Example:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

SESSION_SECRET=your_session_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

EMAIL_USER=your_email
EMAIL_PASS=your_email_password

AI_API_KEY=your_ai_api_key
```

> ⚠️ Never commit `.env` files or API keys to GitHub.

Add them to `.gitignore`:

```gitignore
.env
node_modules/
uploads/
```

---

# 🗄️ Database

The application uses **MongoDB** with **Mongoose**.

MongoDB stores application-related information such as:

* User accounts
* Authentication information
* Job applications
* Resume information
* Generated application data
* Other user-specific application metadata

For cloud deployment, **MongoDB Atlas** can be used.

---

# 🔐 Authentication Flow

```text
User
 │
 ├── Email / Password
 │
 ├── Google OAuth
 │
 └── GitHub OAuth
          │
          ▼
   Authentication
          │
          ▼
      Session
          │
          ▼
   Protected Routes
```

---

# 📄 Resume Generation Flow

```text
Upload Resume
      │
      ▼
Resume Parsing
      │
      ▼
Extract Skills / Experience
      │
      ▼
Enter Job Description
      │
      ▼
Analyze JD Requirements
      │
      ▼
Compare Resume ↔ JD
      │
      ▼
Identify Relevant Skill Gaps
      │
      ▼
Generate Optimized Resume
```

---

# ✉️ Cover Letter Generation Flow

```text
Candidate Profile
       │
       ▼
Job Description
       │
       ▼
Requirement Analysis
       │
       ▼
Candidate ↔ Job Matching
       │
       ▼
AI Generation
       │
       ▼
Personalized Cover Letter
```

---

# 🎯 Problem Statement

Job seekers frequently submit the same resume and generic cover letter to multiple positions.

However, different jobs require different:

* Technical skills
* Tools and technologies
* Qualifications
* Experience
* Keywords
* Responsibilities

This platform aims to reduce that problem by creating a **personalized application workflow** for each target position.

---

# 💡 Solution

The platform combines **job application management + resume intelligence + generative AI** into a single application.

Instead of:

```text
Find Job
   ↓
Edit Resume Manually
   ↓
Write Cover Letter
   ↓
Apply
   ↓
Track Application
```

The platform provides:

```text
              Find Job
                 │
                 ▼
          Enter Job Description
                 │
                 ▼
        ┌────────────────────┐
        │    AI Analysis     │
        └─────────┬──────────┘
                  │
        ┌─────────┴──────────┐
        ▼                    ▼
  Skill Gap Analysis    JD Analysis
        │                    │
        ▼                    ▼
 AI Resume Generator   AI Cover Letter
        │                    │
        └─────────┬──────────┘
                  ▼
          Apply for the Job
                  │
                  ▼
        Track Application
```

---

# 🌟 Key Highlights

* 🤖 AI-powered job application assistance
* 📄 Job-specific resume generation
* ✉️ Personalized cover letter generation
* 🔍 Skill gap analysis
* 💼 Job application tracking
* 📎 Resume parsing
* 🔐 Secure authentication
* 🔑 Google & GitHub OAuth
* 📊 Application dashboard
* ⚡ React + TypeScript frontend
* 🚀 Node.js + Express backend
* 🗄️ MongoDB database
* 📱 Responsive UI

---

# 🚀 Deployment

The application can be deployed without purchasing a custom domain.

### Frontend

Recommended platforms:

* Vercel
* Netlify

### Backend

Recommended platforms:

* Render
* Railway

### Database

* MongoDB Atlas

The deployed frontend can use a free platform-provided URL such as:

```text
https://your-project.vercel.app
```

The backend can similarly have a platform-provided URL.

A custom domain is **optional**.

---

# 🔮 Future Improvements

Possible future enhancements include:

* [ ] AI-powered job recommendations
* [ ] Resume ATS score
* [ ] Job-to-resume compatibility score
* [ ] Advanced skill-gap roadmap
* [ ] Personalized learning recommendations
* [ ] Job scraping and aggregation
* [ ] Application deadline reminders
* [ ] Email notifications
* [ ] Application analytics
* [ ] Interview preparation based on JD
* [ ] AI-generated interview questions
* [ ] Application success analytics
* [ ] Docker containerization
* [ ] CI/CD pipeline
* [ ] Automated testing

---

# ⚠️ Responsible AI Usage

AI-generated resumes and cover letters should be reviewed by the candidate before submission.

The system should **not fabricate**:

* Work experience
* Qualifications
* Certifications
* Projects
* Employment history
* Technical expertise

Generated content should remain consistent with the candidate's real background.

---

# 👨‍💻 Author

## Shantanu Gorai

Engineering Student | Full-Stack Developer | AI/ML Enthusiast

### GitHub

https://github.com/ShantanuGorai

---

# ⭐ Show Your Support

If you find this project useful or interesting, consider giving the repository a ⭐ on GitHub.

---

## 📜 License

This project is developed for **educational, portfolio, and demonstration purposes**.
