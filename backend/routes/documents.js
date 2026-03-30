const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Generate legal document
router.post('/generate-document', authMiddleware, async (req, res) => {
  try {
    const {
      documentType,
      caseDetails,
      parties,
      content,
    } = req.body;

    if (!documentType || !caseDetails) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a legal document expert. Generate a formal legal ${documentType} document with the following details:

Case Details: ${JSON.stringify(caseDetails)}
Parties: ${JSON.stringify(parties)}
Additional Content: ${content || 'N/A'}

Please generate a professional, formal legal document in proper legal format suitable for Indian courts. Include:
1. Header with document title
2. Date and parties information
3. Background/recitals
4. Main content and claims/terms
5. Signature blocks
6. Footer with relevant sections

Make it comprehensive and legally sound.`;

    const result = await model.generateContent(prompt);
    const document = result.response.text();

    res.json({
      documentType,
      content: document,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error generating document:', error);
    res.status(500).json({ error: 'Error generating document' });
  }
});

// Generate contract
router.post('/generate-contract', authMiddleware, async (req, res) => {
  try {
    const {
      contractType,
      party1,
      party2,
      terms,
      amount,
    } = req.body;

    if (!contractType || !party1 || !party2) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a contract expert. Generate a formal legal ${contractType} contract between:
Party 1: ${JSON.stringify(party1)}
Party 2: ${JSON.stringify(party2)}
Terms: ${JSON.stringify(terms)}
Amount: ${amount || 'N/A'}

Create a comprehensive, legally binding contract suitable for Indian law. Include:
1. Introduction with parties
2. Whereas clauses
3. Terms and conditions
4. Payment terms
5. Dispute resolution
6. Governing law (Indian jurisdiction)
7. Signature blocks

Make it professional and enforceable in Indian courts.`;

    const result = await model.generateContent(prompt);
    const contract = result.response.text();

    res.json({
      contractType,
      content: contract,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error generating contract:', error);
    res.status(500).json({ error: 'Error generating contract' });
  }
});

// Generate legal notice
router.post('/generate-notice', authMiddleware, async (req, res) => {
  try {
    const {
      noticeType,
      sender,
      recipient,
      subject,
      details,
    } = req.body;

    if (!noticeType || !sender || !recipient) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a legal expert. Generate a formal legal ${noticeType} notice with proper formatting for Indian courts:

Sender Details: ${JSON.stringify(sender)}
Recipient Details: ${JSON.stringify(recipient)}
Subject: ${subject}
Details: ${JSON.stringify(details)}

Generate a formal, properly formatted legal notice including:
1. Sender's address and details
2. Recipient's address
3. Date
4. Reference/Notice number
5. Subject line
6. Formal salutation and content
7. Clear statement of demands/claims
8. Timeline for compliance (if applicable)
9. Consequences of non-compliance
10. Solicitor's details and signature blocks

Follow Indian legal notice format standards.`;

    const result = await model.generateContent(prompt);
    const notice = result.response.text();

    res.json({
      noticeType,
      content: notice,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error generating notice:', error);
    res.status(500).json({ error: 'Error generating notice' });
  }
});

// Generate document templates
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'petition',
        name: 'Legal Petition',
        description: 'Formal petition for court filing',
        fields: ['caseType', 'claimAmount', 'claimDetails'],
      },
      {
        id: 'nda',
        name: 'Non-Disclosure Agreement',
        description: 'Confidentiality agreement',
        fields: ['party1', 'party2', 'scope', 'duration'],
      },
      {
        id: 'agreement',
        name: 'Service Agreement',
        description: 'Service contract template',
        fields: ['serviceType', 'duration', 'payment', 'terms'],
      },
      {
        id: 'lease',
        name: 'Lease Agreement',
        description: 'Property lease document',
        fields: ['property', 'tenant', 'landlord', 'rent', 'duration'],
      },
      {
        id: 'will',
        name: 'Will Document',
        description: 'Last will and testament',
        fields: ['testator', 'beneficiaries', 'assets', 'executors'],
      },
      {
        id: 'notice',
        name: 'Legal Notice',
        description: 'Formal legal notice',
        fields: ['sender', 'recipient', 'claim', 'deadline'],
      },
    ];

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Error fetching templates' });
  }
});

module.exports = router;
