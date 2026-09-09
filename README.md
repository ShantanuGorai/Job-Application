# 💼 Job Application Platform

A full-stack **Job Application Management Platform** designed to simplify the process of discovering jobs, managing applications, and organizing career-related information in one place.

The application combines a modern React frontend with a Node.js/Express backend and database-driven functionality to provide a complete full-stack web application experience.

## 🚀 Features

### 👤 Authentication & User Management

* User registration and login
* Secure password handling
* Session-based authentication
* Google OAuth authentication
* GitHub OAuth authentication
* Protected application routes

### 💼 Job Application Management

* Create and manage job applications
* Track application information
* Organize applications based on their status
* View application details
* Maintain a centralized job application dashboard

### 📄 Resume Management

* Upload resumes
* Store uploaded resume files
* Resume parsing functionality
* Extract relevant information from resumes
* Maintain parsed resume data for application workflows

### 🔐 Security

* Password hashing using bcrypt
* Authentication using sessions
* OAuth integration through Passport.js
* Environment-based configuration for sensitive credentials
* CORS configuration for frontend-backend communication

### 🎨 Modern User Interface

* Responsive React interface
* Tailwind CSS styling
* Component-based architecture
* Smooth animations and interactions
* Interactive dashboards and forms
* Toast notifications and user feedback

---

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Framer Motion
* React Hook Form
* Zod
* Lucide React
* Recharts

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Passport.js
* Express Session
* Multer
* Nodemailer
* Cheerio

### Authentication

* Session-based authentication
* Google OAuth 2.0
* GitHub OAuth

### Additional Technologies

* JavaScript / TypeScript
* REST APIs
* File Upload & Processing
* Environment Variables
* CORS

---

## 🏗️ Project Architecture

```text
Job-Application/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/
│   ├── config/
│   ├── models/
│   ├── passport/
│   ├── routes/
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

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ShantanuGorai/Job-Application.git

cd Job-Application
```

---

## 🎨 Frontend Setup

Navigate to the frontend directory:

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

The frontend will be available at:

```text
http://localhost:5173
```

---

## 🔧 Backend Setup

Open another terminal and navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Start the backend server:

```bash
node server.js
```

The backend will run on the port configured in your environment variables.

---

## 🔑 Environment Variables

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
```

> ⚠️ Never commit your `.env` file or expose authentication credentials in your repository.

---

## 🗄️ Database

The backend uses **MongoDB** with **Mongoose** for database management.

The database is responsible for storing application-related information such as:

* User accounts
* Authentication data
* Job applications
* Resume information
* Other application metadata

---

## 🔄 Application Flow

```text
                 ┌───────────────────┐
                 │      User         │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │ React Frontend    │
                 │ TypeScript + Vite │
                 └─────────┬─────────┘
                           │
                     REST API / HTTP
                           │
                           ▼
                 ┌───────────────────┐
                 │ Node.js + Express │
                 └─────────┬─────────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
       ┌──────────┐  ┌────────────┐  ┌───────────┐
       │ MongoDB  │  │ Authentication│ │  Resume  │
       │          │  │ & OAuth       │ │ Processing│
       └──────────┘  └────────────┘  └───────────┘
```

---

## 📌 Key Highlights

* Full-stack web application
* Modern React + TypeScript frontend
* REST API powered by Node.js and Express
* MongoDB database integration
* Secure authentication system
* Google and GitHub OAuth
* Resume upload and parsing
* Job application management
* Responsive and interactive UI
* Modular backend architecture

---

## 🔮 Future Improvements

Some possible improvements for future versions:

* [ ] Advanced job search and filtering
* [ ] Job recommendation system
* [ ] AI-powered resume analysis
* [ ] Resume-to-job matching
* [ ] Application deadline reminders
* [ ] Email notifications
* [ ] Application analytics
* [ ] Admin dashboard
* [ ] Docker support
* [ ] Automated testing
* [ ] CI/CD deployment pipeline

---

## 🌐 Deployment

The application can be deployed using free hosting services.

### Frontend

Recommended:

* Vercel
* Netlify

### Backend

Recommended:

* Render
* Railway

### Database

Recommended:

* MongoDB Atlas

A custom domain is **not required** for deployment. The application can use the free domain provided by the hosting platform.

---

## 👨‍💻 Author

**Shantanu Gorai**

Engineering Student | Full-Stack Developer | AI/ML Enthusiast

### GitHub

[ShantanuGorai](https://github.com/ShantanuGorai)

---

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.

---

## 📄 License

This project is developed for educational and portfolio purposes.
