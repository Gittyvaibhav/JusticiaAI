# JusticiaAI

JusticiaAI is an AI-first legal guidance platform for Indian legal workflows. It helps a person understand a case, see likely procedure, collect the right evidence, understand near-term risks, and then connect with a suitable lawyer when professional representation is needed.

## Core Idea

This project is not just a low-cost lawyer finder. The main value is the bridge between:
- understanding what a case means
- understanding what usually happens next
- understanding why a lawyer recommendation fits that situation

## What the Product Does

- accepts a user's legal issue with optional supporting documents
- generates Gemini-based case guidance
- explains likely legal procedure and immediate next steps
- surfaces documents and evidence the user should gather
- highlights likely forum, authority, and timeline
- calls out risks, gaps, and weaknesses in the matter
- recommends verified lawyers with explainable ranking reasons
- separates public nearby listings from verified platform recommendations
- supports hiring, payment, messaging, and case tracking in one place

## End-to-End Flow

1. A client submits a case.
2. Gemini analyzes the matter and returns:
   - case summary
   - relevant laws and sections
   - immediate next steps
   - procedural checklist
   - documents and evidence to gather
   - likely forum or authority
   - expected timeline
   - key risks or weaknesses
   - lawyer type needed
   - lawyer selection guidance
3. The system ranks verified lawyers using case fit, profile strength, location, experience, ratings, and other practical signals.
4. The user can review why each verified lawyer was recommended.
5. The user can hire and pay inside the platform.
6. Client and lawyer continue the matter through inbox, chat, updates, and closure.

## Main Feature Areas

### 1. AI Case Guidance
- structured Gemini analysis for Indian legal matters
- procedural checklist instead of only a summary
- evidence and document preparation guidance
- likely forum and timeline hints
- risk and weakness identification
- strong trust disclaimer that guidance is informational, not legal advice

### 2. Recommendation Engine
- verified lawyer ranking tied to the AI case analysis
- explainable recommendation reasons per lawyer
- public nearby listings kept separate from verified recommendations
- practical selection context such as lawyer type, location relevance, record, and availability signals

### 3. Case Management
- user and lawyer dashboards
- case detail view with AI guidance sections
- status updates and closure flow
- ratings and review flow after resolution

### 4. Messaging
- dedicated inbox page for all conversations
- real-time chat updates
- thread previews, search, sorting, and unread state
- direct case context inside the conversation view

### 5. Payments And Hiring
- verified lawyer assignment through payment flow
- Razorpay-based checkout integration
- pay-later option on open cases

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT authentication
- Google Generative AI (Gemini)
- Socket.IO
- Cloudinary
- Multer
- Nodemailer
- Razorpay

### Frontend
- React 18
- Vite
- React Router
- Axios
- Tailwind CSS
- Lucide React
- React Hot Toast
- Socket.IO Client

## Important Backend Areas

- `backend/utils/aiAnalysis.js`
  Handles Gemini prompt building and structured response parsing.
- `backend/utils/recommendationEngine.js`
  Scores and explains lawyer recommendations.
- `backend/routes/cases.js`
  Creates cases and stores structured AI guidance.
- `backend/routes/lawyers.js`
  Returns verified recommendations and separate public listings.
- `backend/routes/chat.js`
  Powers conversation list and message loading.

## Important Frontend Areas

- `frontend/src/pages/SubmitCase.jsx`
  Case intake plus AI guidance and lawyer discovery.
- `frontend/src/pages/CaseDetail.jsx`
  Rich case guidance, workflow actions, and pay-later hiring.
- `frontend/src/pages/Messages.jsx`
  Central inbox for all conversations.
- `frontend/src/pages/UserDashboard.jsx`
  Client overview for guided legal matters.
- `frontend/src/pages/LawyerDashboard.jsx`
  Counsel workspace for AI-qualified matters.

## Environment Variables

Create `backend/.env` with values appropriate for your setup.

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_google_generative_ai_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
GOOGLE_MAPS_API_KEY=your_google_maps_or_places_key
```

## Running The Project

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Positioning

Describe JusticiaAI as:
- an AI legal guidance and case-intake platform
- a case procedure support system
- a lawyer recommendation and case coordination product

Do not describe it only as:
- a cheap lawyer finder
- a basic lawyer marketplace

Because the product's differentiator is the guidance-to-action bridge, not just listing lawyers.
