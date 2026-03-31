# JusticiaAI 🏛️

**Find the BEST lawyers at AFFORDABLE rates in your location**

An AI-powered legal platform that connects budget-conscious individuals with verified lawyers through intelligent matching, transparent pricing, and secure payments. JusticiaAI democratizes access to legal justice with smart recommendations and AI-powered document automation.

## 🎯 Our Unique Value Proposition

- **Smart Lawyer Matching** - AI algorithm matches you with the perfect lawyer based on specialization, budget, location, and ratings
- **Transparent Pricing** - See average lawyer fees upfront before hiring
- **Verified Lawyers** - Only certified, rated lawyers with proven track records
- **Affordable Access** - Filter lawyers by your budget
- **Secure Escrow Payments** - Money held safe until milestones are completed
- **AI Legal Documents** - Auto-generate petitions, contracts, notices instantly
- **Success Stories** - Learn from verified case outcomes

## Features ✨

### Phase 1 ✅ - Smart Lawyer Finding
- **Lawyer Ratings & Reviews** - Real verified reviews from actual clients
- **Specialization Display** - See lawyer expertise areas clearly
- **Experience Metrics** - Years of practice, cases won, success rates
- **Budget-Based Filtering** - Find lawyers within your price range
- **Location-Based Search** - Find lawyers near you
- **Performance Statistics** - Win rate, case outcomes, average fees

### Phase 2 ✅ - Trust & Transparency
- **Verified Lawyer Badges** - Bar-certified, top-rated, affordable, responsive badges
- **Case Success Stories** - Real case outcomes with client testimonials
- **Lawyer Verification Levels** - None → Basic → Verified → Premium
- **Social Proof System** - Transparent review and rating system
- **Outcome Tracking** - See case results (won/lost/settled)

### Phase 3 ✅ - Smart Matching
- **Intelligent Recommendation Engine** - Matches you with ideal lawyers (30+ factor algorithm)
- **Matching Score** - Shows compatibility percentage with each lawyer
- **Case-Based Recommendations** - Get top matches for your specific case type
- **AI Success Prediction** - Get estimated success rate for your case

### Phase 4 ✅ - Secure Payments & Automation
- **Secure Escrow Payments** - Money held until work is completed
- **Milestone-Based Pricing** - Pay in stages as work progresses
- **Fixed & Hourly Rates** - Choose your preferred pricing model
- **AI Document Generation** - Auto-generate:
  - Legal petitions
  - Contracts & NDAs
  - Legal notices
  - Service agreements
  - Lease agreements
  - Will documents

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
- **Payments**: Razorpay Orders + Signature Verification
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
├── backend/                         # Express.js API server
│   ├── models/                      # Database schemas
│   │   ├── User.js
│   │   ├── Lawyer.js               # Enhanced with pricing, badges
│   │   ├── Case.js                 # Enhanced with matching, budget
│   │   ├── Review.js               # ✨ NEW - Client reviews
│   │   ├── Payment.js              # ✨ NEW - Payment tracking
│   │   ├── Verification.js         # ✨ NEW - Lawyer verification
│   │   └── SuccessStory.js         # ✨ NEW - Case success stories
│   ├── routes/
│   │   ├── auth.js
│   │   ├── cases.js
│   │   ├── lawyers.js
│   │   ├── ai.js
│   │   ├── reviews.js              # ✨ NEW - Review endpoints
│   │   ├── payments.js             # ✨ NEW - Payment endpoints
│   │   ├── matching.js             # ✨ NEW - Smart matching
│   │   └── documents.js            # ✨ NEW - Document generation
│   ├── middleware/
│   ├── config/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
└── frontend/                        # React + Vite application
    ├── src/
    │   ├── components/
    │   │   ├── LawyerCard.jsx
    │   │   ├── EnhancedLawyerCard.jsx    # ✨ NEW - Ratings display
    │   │   ├── LawyerFilter.jsx          # ✨ NEW - Advanced filters
    │   │   ├── ReviewForm.jsx            # ✨ NEW - Review submission
    │   │   ├── PaymentCheckout.jsx       # ✨ NEW - Payment UI
    │   │   ├── DocumentGenerator.jsx     # ✨ NEW - Doc generation
    │   │   └── ...
    │   ├── pages/
    │   ├── context/
    │   ├── api.js
    │   └── main.jsx
    └── package.json
```

## 🔑 Key API Endpoints

### Lawyer Matching
- `GET /api/matching/case/:caseId` - Get matched lawyers with scores
- `GET /api/matching/search?specialization=criminal&location=Mumbai&maxBudget=50000` - Advanced search
- `GET /api/matching/recommendations/:caseType` - Get recommended lawyers
- `GET /api/matching/top-rated?location=Delhi&specialization=civil` - Top lawyers

### Reviews & Ratings
- `POST /api/reviews/add-review` - Submit lawyer review
- `GET /api/reviews/lawyer/:lawyerId` - Get lawyer reviews
- `GET /api/reviews/stats/:lawyerId` - Get lawyer statistics
- `POST /api/reviews/:reviewId/helpful` - Mark helpful

### Payments & Milestones
- `GET /api/payments/config` - Fetch Razorpay checkout configuration
- `POST /api/payments/create-order` - Create a Razorpay order for a case
- `POST /api/payments/verify` - Verify Razorpay signature and assign the case
- `GET /api/payments/:paymentId` - Get payment details
- `POST /api/payments/:paymentId/release` - Release escrow payment
- `POST /api/payments/:paymentId/milestone/:index/complete` - Complete milestone
- `GET /api/payments/lawyer/:lawyerId/fees` - Get average lawyer fees

### AI Documents
- `POST /api/documents/generate-document` - Generate legal document
- `POST /api/documents/generate-contract` - Generate contract
- `POST /api/documents/generate-notice` - Generate legal notice
- `GET /api/documents/templates` - Get available templates

## 📊 Smart Matching Algorithm

Our proprietary matching algorithm considers:
- **Specialization Match** (30 points) - Does lawyer practice in your case type?
- **Location Proximity** (20 points) - Is lawyer near you?
- **Success Rate** (20 points) - What's their win rate?
- **Experience** (15 points) - Years in practice
- **Budget Compatibility** (10 points) - Within your budget?
- **Availability** (5 points) - Can they take more cases?

**Result**: Matching score 0-100% showing ideal lawyer fit

## 💰 Pricing Features

### For Clients
- See average lawyer fees upfront
- Filter by budget range
- Choose fixed or hourly rates
- Milestone-based escrow payments
- Money-back guarantee if dissatisfied

### For Lawyers
- Set flexible pricing (hourly/fixed)
- Track historical earnings
- Display affordability badge
- Showcase average fees

## 🔒 Security & Trust

- JWT authentication & password hashing
- Secure escrow payment system
- Verified lawyer credentials
- Client review verification
- Encrypted document transmission
- Data privacy compliance

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
- Razorpay account with API keys

### Payment Environment Variables

Add these to `backend/.env`:

```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```


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
