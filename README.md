# AI Lawyer - Your Virtual Legal Assistant

A full-stack web application that provides AI-powered legal advice with lawyer-client connection platform.

## 🎯 Features

### For Users
- ✅ User authentication (register/login)
- ✅ Submit legal cases with detailed descriptions
- ✅ AI-powered case analysis using Google Gemini API
- ✅ View AI legal advice (case summary, relevant laws, next steps, case strength)
- ✅ Browse and connect with verified lawyers
- ✅ Track case status and progress
- ✅ Rate and review lawyers

### For Lawyers
- ✅ Lawyer authentication with Bar Council ID verification
- ✅ View available cases matching specializations
- ✅ Accept and manage active cases
- ✅ Update case status and outcomes
- ✅ Track statistics (win rate, cases handled, ratings)
- ✅ Receive ratings and reviews from clients

### Technology Stack
- **Backend:** Node.js + Express.js
- **Database:** MongoDB with Mongoose
- **Frontend:** React.js with React Router v6
- **AI:** Google Gemini API (gemini-2.5-flash-lite)
- **Auth:** JWT + bcrypt
- **Styling:** Tailwind CSS
- **UI Components:** Lucide React Icons & React Hot Toast

---

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account (free at https://www.mongodb.com/cloud/atlas)
- Google Gemini API Key (free at https://aistudio.google.com/app/apikey)
- Gmail account (for email notifications)

---

## 🚀 Installation & Setup

### 1. Clone Repository & Navigate

```bash
cd "AI LAWYER"
```

### 2. Backend Setup

#### Navigate to backend directory
```bash
cd backend
```

#### Install dependencies
```bash
npm install
```

#### Create .env file with your credentials
```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key_change_this_to_something_secure
GEMINI_API_KEY=your_google_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
PORT=5000
```

#### Start backend server
```bash
npm start
```

Backend will run on http://localhost:5000

### 3. Frontend Setup

#### In a new terminal, navigate to frontend directory
```bash
cd frontend
```

#### Install dependencies
```bash
npm install
```

#### Start development server
```bash
npm run dev
```

Frontend will run on http://localhost:5173

---

## 🔑 Getting API Credentials

### MongoDB Atlas
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/dbname`)

### Google Gemini API
1. Go to https://aistudio.google.com/app/apikey
2. Click "Get API Key"
3. Create new API key for free tier

### Gmail (for Email Notifications)
1. Enable 2-factor authentication on your Gmail
2. Generate App Password
3. Use the 16-character password in .env

---

## 📚 Project Structure

```
AI LAWYER/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Lawyer.js
│   │   └── Case.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── cases.js
│   │   ├── lawyers.js
│   │   └── ai.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── CaseCard.jsx
    │   │   ├── LawyerCard.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── UserDashboard.jsx
    │   │   ├── SubmitCase.jsx
    │   │   ├── CaseDetail.jsx
    │   │   ├── LawyerDashboard.jsx
    │   │   ├── AvailableCases.jsx
    │   │   └── ActiveCases.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── .env
```

---

## 🧪 Testing the Application

### Test User Account
```
Email: user@test.com
Password: Test@123
```

### Test Lawyer Account
```
Email: lawyer@test.com
Password: Test@123
Bar Council ID: BCI/2024/TEST001
Specializations: Criminal, Civil
```

### Test Flow
1. **Register as User** → Submit Case → View AI Analysis
2. **Register as Lawyer** → View Available Cases → Accept Case
3. **As User** → Rate the lawyer after case resolution
4. **View Statistics** → Track progress on dashboards

---

## 🎨 UI/UX Features

- **Color Scheme:**
  - Primary: Blue (#3B82F6) - User-side elements
  - Secondary: Teal (#14B8A6) - Lawyer-side elements
  - Status badges with color-coding

- **Responsive Design:** Mobile-first approach
- **Dark/Light Indicators:** Visual hierarchy with Tailwind CSS
- **Toast Notifications:** Real-time feedback for all actions
- **Loading States:** Spinners for async operations

---

## 🔐 Security Features

✅ JWT token-based authentication
✅ Password hashing with bcrypt (10 rounds)
✅ Protected routes with role-based access
✅ Secure API endpoints with middleware
✅ No sensitive data in localStorage (except token)
✅ CORS configuration
✅ Environment variables for secrets

---

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register/user` - Register as user
- `POST /api/auth/register/lawyer` - Register as lawyer
- `POST /api/auth/login` - Login for both roles

### Cases
- `POST /api/cases/submit` - Submit new case (User)
- `GET /api/cases/my-cases` - Get user's cases
- `GET /api/cases/:id` - Get case details
- `GET /api/cases/available/:specialization` - Get available cases (Lawyer)
- `POST /api/cases/:id/accept` - Accept case (Lawyer)
- `POST /api/cases/:id/update-status` - Update case status (Lawyer)
- `POST /api/cases/:id/rate-lawyer` - Rate lawyer (User)

### Lawyers
- `GET /api/lawyers/match/:caseId` - Get matching lawyers
- `GET /api/lawyers/profile/:id` - Get lawyer profile
- `GET /api/lawyers/active-cases` - Get lawyer's active cases
- `PUT /api/lawyers/profile` - Update lawyer profile (Lawyer)

### AI Analysis
- `POST /api/ai/analyze` - Analyze case with Gemini (User)

---

## 🐛 Troubleshooting

### MongoDB Connection Error
- Check MONGO_URI in .env
- Ensure MongoDB Atlas cluster is running
- Whitelist your IP address in MongoDB Atlas

### Gemini API Not Working
- Verify API key is correct
- Check rate limits (free tier: 60 requests/min)
- Ensure API key has proper permissions

### CORS Issues
- Verify frontend URL is whitelisted in backend CORS
- Clear browser cache
- Check that ports match (5000 for backend, 5173 for frontend)

### Authentication Issues
- Clear localStorage: `localStorage.clear()`
- Ensure token is being sent in Authorization header
- Check JWT_SECRET in backend .env

---

## 📝 Environment Variables Reference

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| MONGO_URI | MongoDB connection string | mongodb+srv://user:pass@cluster.mongodb.net/db |
| JWT_SECRET | Secret for JWT tokens | any_random_secret_key |
| GEMINI_API_KEY | Google Gemini API key | xxxxxxxxxxxxxxxxxx |
| PORT | Server port | 5000 |

### Frontend (.env)
No environment variables needed - API base URL is hardcoded to `http://localhost:5000/api`

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

---

## 📄 License

This project is open source and available under the MIT License.

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check MongoDB/Gemini documentation
4. Create an issue in repository

---

## 🎓 Learning Resources

- **Express.js:** https://expressjs.com
- **MongoDB:** https://docs.mongodb.com
- **React:** https://react.dev
- **Tailwind CSS:** https://tailwindcss.com
- **Google Gemini API:** https://ai.google.dev

---

## 🎉 Happy Coding!

Built with ❤️ for connecting people with justice.

**Last Updated:** March 2026
