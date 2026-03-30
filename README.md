# JusticiaAI 🏛️

An AI-powered legal platform that connects clients with lawyers and provides intelligent case analysis using generative AI. JusticiaAI streamlines the legal process by offering case management, lawyer matching, and AI-driven legal insights.

## Features ✨

- **User Authentication**: Secure login and registration for clients and lawyers
- **Case Management**: Create, submit, and track legal cases with detailed information
- **Lawyer Directory**: Browse and connect with available lawyers
- **AI-Powered Analysis**: Leverage Google Generative AI for intelligent case analysis and legal insights
- **Dashboard**: Personalized dashboards for both clients and lawyer professionals
- **File Management**: Upload case documents using Cloudinary cloud storage
- **Email Notifications**: Automated email communications for case updates and notifications
- **Responsive UI**: Modern, mobile-friendly interface built with React and Tailwind CSS

## Tech Stack 🛠️

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens), bcryptjs
- **AI Integration**: Google Generative AI
- **File Storage**: Cloudinary
- **File Upload**: Multer
- **Email**: Nodemailer
- **Development**: Nodemon

### Frontend
- **Framework**: React 18.2
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React (icons)
- **Notifications**: React Hot Toast

## Project Structure 📁

```
JusticiaAI/
├── backend/                    # Express.js API server
│   ├── models/                # Database schemas (Case, Lawyer, User)
│   ├── routes/                # API endpoints (auth, cases, lawyers, ai)
│   ├── middleware/            # Authentication middleware
│   ├── config/                # Configuration files (Cloudinary)
│   ├── utils/                 # Utility functions (AI analysis, mailer)
│   ├── server.js              # Entry point
│   └── package.json           # Backend dependencies
│
└── frontend/                   # React + Vite application
    ├── src/
    │   ├── components/        # Reusable React components
    │   ├── pages/             # Page components
    │   ├── context/           # React Context (Auth)
    │   ├── api.js             # API client configuration
    │   ├── constants.js       # Global constants
    │   └── main.jsx           # Entry point
    ├── vite.config.js         # Vite configuration
    ├── tailwind.config.js     # Tailwind CSS configuration
    └── package.json           # Frontend dependencies
```

## Getting Started 🚀

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB database (local or Atlas)
- Google Generative AI API key
- Cloudinary account
- SMTP credentials for email notifications


## Usage 💡

### For Clients
1. Register an account
2. Submit a legal case with details and documentation
3. View available lawyers and their profiles
4. Get AI-powered analysis of your case
5. Track case status from your dashboard

### For Lawyers
1. Create a lawyer profile
2. Browse available cases
3. Accept cases and communicate with clients
4. View case details and AI insights
5. Manage active cases from your dashboard

## Contributing 🤝

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.

## Support 🆘

For support, email support@justiciaaai.com or open an issue in the repository.

---

**JusticiaAI** - Making legal services accessible through technology and AI ⚖️
