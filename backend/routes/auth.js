const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Lawyer = require('../models/Lawyer');

const router = express.Router();

function signToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function sanitizeUser(entity) {
  return {
    id: entity._id,
    name: entity.name,
    email: entity.email,
    phone: entity.phone,
    location: entity.location,
    role: entity.role,
    ...(entity.role === 'lawyer'
      ? {
          barCouncilId: entity.barCouncilId,
          specializations: entity.specializations,
          experience: entity.experience,
          casesTotal: entity.casesTotal,
          casesWon: entity.casesWon,
          casesLost: entity.casesLost,
          winRate: entity.winRate,
          rating: entity.rating,
          totalRatings: entity.totalRatings,
          bio: entity.bio,
          verified: entity.verified,
          activeCases: entity.activeCases,
        }
      : {
          cases: entity.cases,
        }),
  };
}

router.post('/register/user', async (req, res) => {
  try {
    const { name, email, password, phone, location } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    const existingLawyer = await Lawyer.findOne({ email: normalizedEmail });

    if (existingUser || existingLawyer) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone,
      location,
    });

    const token = signToken(user._id, user.role);

    return res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to register user' });
  }
});

router.post('/register/lawyer', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      location,
      barCouncilId,
      specializations,
      experience,
      bio,
    } = req.body;

    if (!name || !email || !password || !barCouncilId) {
      return res.status(400).json({ message: 'Name, email, password, and Bar Council ID are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    const existingLawyer = await Lawyer.findOne({
      $or: [{ email: normalizedEmail }, { barCouncilId: barCouncilId.trim() }],
    });

    if (existingUser || existingLawyer) {
      return res.status(400).json({ message: 'Lawyer email or Bar Council ID already exists' });
    }

    const lawyer = await Lawyer.create({
      name,
      email: normalizedEmail,
      password,
      phone,
      location,
      barCouncilId: barCouncilId.trim(),
      specializations: Array.isArray(specializations) ? specializations : [],
      experience: Number(experience) || 0,
      bio,
    });

    const token = signToken(lawyer._id, lawyer.role);

    return res.status(201).json({
      token,
      lawyer: sanitizeUser(lawyer),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to register lawyer' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }

    if (!['user', 'lawyer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const Model = role === 'user' ? User : Lawyer;
    const entity = await Model.findOne({ email: email.trim().toLowerCase() });

    if (!entity) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await entity.comparePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(entity._id, entity.role);

    return res.status(200).json({
      token,
      user: sanitizeUser(entity),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Login failed' });
  }
});

module.exports = router;
