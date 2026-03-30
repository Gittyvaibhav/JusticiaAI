# Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Backend Setup (Terminal 1)
```bash
cd backend
npm install
# Edit .env with your credentials
npm start
```

### Step 2: Frontend Setup (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```

### Step 3: Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## 🧪 Quick Test

1. **Register as User**
   - Go to Register page
   - Choose "User" tab
   - Fill form and submit

2. **Submit a Case**
   - Click "Submit New Case"
   - Fill in case details
   - Get AI analysis (powered by Gemini)

3. **Register as Lawyer**
   - In new incognito window, go to register
   - Choose "Lawyer" tab
   - Fill lawyer details with specialization

4. **Accept Case**
   - As lawyer, view available cases
   - Click on case and accept it

5. **Update Status**
   - Go to Active Cases
   - Mark case as complete
   - Select outcome (Won/Lost/Settled)

6. **Rate Lawyer**
   - As user, go to case detail
   - Rate lawyer with stars and review

---

## 🔧 Environment Variables

Create `.env` in both `backend/` folder:

```env
MONGO_URI=your_mongodb_atlas_string
JWT_SECRET=any_secret_key
GEMINI_API_KEY=your_gemini_key
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password
PORT=5000
```

---

## 📦 Dependencies Installed

### Backend
- express - Web framework
- mongoose - MongoDB ODM
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- @google/generative-ai - Gemini API
- cors - Cross-origin requests
- dotenv - Environment variables

### Frontend
- react - UI library
- react-router-dom - Routing
- axios - HTTP client
- react-hot-toast - Notifications
- lucide-react - Icons
- tailwindcss - Styling

---

## 🎯 Features Implemented

✅ User & Lawyer Authentication
✅ Multi-step Case Submission
✅ AI-Powered Case Analysis (Gemini API)
✅ Lawyer Matching System
✅ Case Management
✅ Status Tracking
✅ Rating & Review System
✅ Dashboard Statistics
✅ Role-based Access Control
✅ Responsive UI (Tailwind CSS)
✅ Real-time Notifications (Toast)

---

## ⚠️ Common Issues

**Port already in use?**
```bash
# Change PORT in .env
PORT=5001
```

**MongoDB connection failed?**
- Check MONGO_URI format
- Whitelist your IP in MongoDB Atlas
- Ensure cluster is running

**Gemini API not working?**
- Verify API key is active
- Check rate limits (60 req/min free tier)

---

## 🚀 Production Deployment

### Backend Deployment (Heroku/Railway)
```bash
npm install -g heroku
heroku create
npm start
```

### Frontend Deployment (Vercel/Netlify)
```bash
npm run build
# Upload dist/ folder
```

---

## 📚 API Documentation

All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

**Base URL:** `http://localhost:5000/api`

See `routes/` folder for all endpoints.

---

## 🎓 Next Steps

1. ✅ Clone and run the application
2. ✅ Test all user flows
3. ✅ Customize styling in Tailwind
4. ✅ Deploy to production
5. ✅ Add additional features

---

Happy coding! 🎉
