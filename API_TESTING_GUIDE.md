# 🧪 API Testing Guide - CURL Commands

## Setup

```bash
# Replace these with your actual values
BASE_URL="http://localhost:5000/api"
LAWYER_ID="your_lawyer_id"
CASE_ID="your_case_id"
USER_ID="your_user_id"
TOKEN="your_jwt_token"
```

---

## 🔍 Lawyer Matching APIs

### 1. Get Matched Lawyers for a Case
```bash
curl -X GET "${BASE_URL}/matching/case/${CASE_ID}" \
  -H "Content-Type: application/json"
```

**Response:**
```json
[
  {
    "_id": "lawyer_id",
    "name": "John Doe",
    "rating": 4.8,
    "specializations": ["criminal", "civil"],
    "matchingScore": 92
  }
]
```

### 2. Search Lawyers with Filters
```bash
curl -X GET "${BASE_URL}/matching/search?specialization=criminal&location=Mumbai&maxBudget=50000&minRating=4&verified=true&page=1&limit=12" \
  -H "Content-Type: application/json"
```

### 3. Get Lawyer Recommendations by Case Type
```bash
curl -X GET "${BASE_URL}/matching/recommendations/criminal" \
  -H "Content-Type: application/json"
```

### 4. Get Top Rated Lawyers
```bash
curl -X GET "${BASE_URL}/matching/top-rated?location=Mumbai&specialization=criminal&limit=10" \
  -H "Content-Type: application/json"
```

---

## ⭐ Review APIs

### 1. Add a Review
```bash
curl -X POST "${BASE_URL}/reviews/add-review" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "caseId": "'${CASE_ID}'",
    "lawyerId": "'${LAWYER_ID}'",
    "rating": 5,
    "title": "Excellent service and results",
    "comment": "Very professional lawyer, won the case easily",
    "caseOutcome": "won"
  }'
```

### 2. Get Reviews for a Lawyer
```bash
curl -X GET "${BASE_URL}/reviews/lawyer/${LAWYER_ID}" \
  -H "Content-Type: application/json"
```

### 3. Get Review for a Case
```bash
curl -X GET "${BASE_URL}/reviews/case/${CASE_ID}" \
  -H "Content-Type: application/json"
```

### 4. Get Lawyer Statistics
```bash
curl -X GET "${BASE_URL}/reviews/stats/${LAWYER_ID}" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "totalReviews": 15,
  "averageRating": 4.7,
  "successRate": 87.5,
  "casesWon": 14,
  "casesTotal": 16,
  "experience": 8,
  "winRate": 87.5
}
```

### 5. Mark Review as Helpful
```bash
curl -X POST "${BASE_URL}/reviews/REVIEW_ID/helpful" \
  -H "Content-Type: application/json"
```

---

## 💳 Payment APIs

### 1. Create Payment (Fixed Fee)
```bash
curl -X POST "${BASE_URL}/payments/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "caseId": "'${CASE_ID}'",
    "lawyerId": "'${LAWYER_ID}'",
    "amount": 50000,
    "pricingType": "fixed",
    "paymentMethod": "card"
  }'
```

### 2. Create Payment (Milestone-Based)
```bash
curl -X POST "${BASE_URL}/payments/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "caseId": "'${CASE_ID}'",
    "lawyerId": "'${LAWYER_ID}'",
    "amount": 100000,
    "pricingType": "milestone",
    "milestones": [
      {
        "title": "Initial Consultation",
        "amount": 20000
      },
      {
        "title": "Case Filing",
        "amount": 30000
      },
      {
        "title": "Court Hearing",
        "amount": 30000
      },
      {
        "title": "Case Resolution",
        "amount": 20000
      }
    ],
    "paymentMethod": "card"
  }'
```

### 3. Get Payment Details
```bash
curl -X GET "${BASE_URL}/payments/PAYMENT_ID" \
  -H "Content-Type: application/json"
```

### 4. Get Payments for a Case
```bash
curl -X GET "${BASE_URL}/payments/case/${CASE_ID}" \
  -H "Content-Type: application/json"
```

### 5. Release Payment from Escrow
```bash
curl -X POST "${BASE_URL}/payments/PAYMENT_ID/release" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}"
```

### 6. Mark Milestone as Complete
```bash
curl -X POST "${BASE_URL}/payments/PAYMENT_ID/milestone/0/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}"
```

### 7. Get Average Fees for a Lawyer
```bash
curl -X GET "${BASE_URL}/payments/lawyer/${LAWYER_ID}/fees" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "averageFee": 45000,
  "minFee": 30000,
  "maxFee": 60000,
  "totalPayments": 12
}
```

---

## 📄 Document Generation APIs

### 1. Get Available Templates
```bash
curl -X GET "${BASE_URL}/documents/templates" \
  -H "Content-Type: application/json"
```

### 2. Generate Legal Document
```bash
curl -X POST "${BASE_URL}/documents/generate-document" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "documentType": "petition",
    "caseDetails": "Property dispute between neighbors regarding boundary wall",
    "parties": "Petitioner: John Smith, Respondent: Jane Doe",
    "content": "Boundary wall encroaches 5 feet into property, causing damage"
  }'
```

### 3. Generate Contract
```bash
curl -X POST "${BASE_URL}/documents/generate-contract" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "contractType": "service-agreement",
    "party1": {
      "name": "ABC Services Ltd",
      "type": "company"
    },
    "party2": {
      "name": "John Doe",
      "type": "individual"
    },
    "terms": "30 days service delivery, 50% advance payment",
    "amount": 100000
  }'
```

### 4. Generate Legal Notice
```bash
curl -X POST "${BASE_URL}/documents/generate-notice" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "noticeType": "cease-and-desist",
    "sender": {
      "name": "John Smith",
      "address": "123 Main St, Mumbai"
    },
    "recipient": {
      "name": "Jane Doe",
      "address": "456 Park Ave, Mumbai"
    },
    "subject": "Cease and Desist - Trademark Infringement",
    "details": "Stop using our trademark in business name"
  }'
```

---

## 🔐 Authentication (Required for POST requests)

### 1. Register User
```bash
curl -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john@example.com",
    "password": "securepassword123",
    "phone": "9876543210",
    "location": "Mumbai"
  }'
```

### 2. Login
```bash
curl -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user_id",
    "name": "John Smith",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

## 🧪 Full Testing Workflow

### Step 1: Login and get token
```bash
TOKEN=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }' | jq -r '.token')

echo "Token: $TOKEN"
```

### Step 2: Search for lawyers
```bash
curl -X GET "${BASE_URL}/matching/search?specialization=criminal&location=Mumbai&maxBudget=50000" \
  -H "Content-Type: application/json"
```

### Step 3: Get lawyer stats
```bash
curl -X GET "${BASE_URL}/reviews/stats/LAWYER_ID" \
  -H "Content-Type: application/json"
```

### Step 4: Create payment
```bash
curl -X POST "${BASE_URL}/payments/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "caseId": "CASE_ID",
    "lawyerId": "LAWYER_ID",
    "amount": 50000,
    "pricingType": "fixed"
  }'
```

### Step 5: Submit review
```bash
curl -X POST "${BASE_URL}/reviews/add-review" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "caseId": "CASE_ID",
    "lawyerId": "LAWYER_ID",
    "rating": 5,
    "title": "Great service",
    "comment": "Very professional",
    "caseOutcome": "won"
  }'
```

---

## 📊 Common Test Cases

### Test Case 1: Find Budget-Friendly Lawyer
```bash
curl -X GET "${BASE_URL}/matching/search?specialization=civil&location=Mumbai&maxBudget=30000&minRating=4" \
  -H "Content-Type: application/json" | jq
```

### Test Case 2: Get Top-Rated Specialists
```bash
curl -X GET "${BASE_URL}/matching/top-rated?specialization=criminal&limit=5" \
  -H "Content-Type: application/json" | jq
```

### Test Case 3: Complete Payment Flow
1. Create payment
2. Get payment details
3. Complete milestone 1
4. Complete milestone 2  
5. Release payment

### Test Case 4: Document Generation
```bash
curl -X POST "${BASE_URL}/documents/generate-document" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "documentType": "notice",
    "caseDetails": "Tenant not paying rent",
    "parties": "Landlord: Mr. A, Tenant: Mr. B",
    "content": "3 months rent pending"
  }' | jq '.content'
```

---

## 🐛 Debugging Tips

### Pretty print JSON responses
```bash
curl -X GET "${BASE_URL}/matching/search?location=Mumbai" | jq '.'
```

### Save response to file
```bash
curl -X GET "${BASE_URL}/matching/search?location=Mumbai" > response.json
```

### Check response headers
```bash
curl -i -X GET "${BASE_URL}/matching/search?location=Mumbai"
```

### Verbose output (shows request/response details)
```bash
curl -v -X GET "${BASE_URL}/matching/search?location=Mumbai"
```

---

## ✅ Success Criteria

- [ ] Lawyer search returns results with ratings
- [ ] Matching algorithm returns score 0-100
- [ ] Reviews update lawyer rating automatically
- [ ] Payment creates in 'in-escrow' status
- [ ] Milestones update correctly
- [ ] Document generation returns formatted text
- [ ] All endpoints return proper JSON

---

**All APIs are ready for testing!** 🚀
