const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Lawyer = require('../models/Lawyer');
const Case = require('../models/Case');

const router = express.Router();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || '';

async function geocodeLocation(location) {
  if (!GOOGLE_MAPS_API_KEY || !location) {
    return null;
  }

  const geocodeUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  geocodeUrl.searchParams.set('address', location);
  geocodeUrl.searchParams.set('key', GOOGLE_MAPS_API_KEY);

  const response = await fetch(geocodeUrl);
  const data = await response.json();

  if (!response.ok || data.status !== 'OK' || !data.results?.length) {
    return null;
  }

  const coords = data.results[0]?.geometry?.location;

  if (!coords) {
    return null;
  }

  return {
    latitude: coords.lat,
    longitude: coords.lng,
    formattedAddress: data.results[0]?.formatted_address,
  };
}

async function searchNearbyPublicLawyers({ location, latitude, longitude, caseType }) {
  if (!GOOGLE_MAPS_API_KEY) {
    return {
      publicLawyers: [],
      source: 'disabled',
      message: 'Google Maps lookup is not configured yet.',
    };
  }

  let coords = null;

  if (latitude && longitude && !Number.isNaN(Number(latitude)) && !Number.isNaN(Number(longitude))) {
    coords = {
      latitude: Number(latitude),
      longitude: Number(longitude),
    };
  } else if (location) {
    coords = await geocodeLocation(location);
  }

  const body = {
    textQuery: `${caseType || 'lawyer'} lawyers near ${location || 'my location'}`,
    maxResultCount: 5,
    languageCode: 'en',
    regionCode: 'IN',
    includedType: 'lawyer',
  };

  if (coords) {
    body.locationBias = {
      circle: {
        center: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
        radius: 15000,
      },
    };
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.rating,places.userRatingCount,places.location,places.businessStatus',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Google Maps lawyer search failed');
  }

  const publicLawyers = (data.places || []).map((place) => ({
    id: place.id,
    name: place.displayName?.text || 'Nearby lawyer',
    location: place.formattedAddress || location || 'Location unavailable',
    phone: place.internationalPhoneNumber || '',
    website: place.websiteUri || '',
    mapsUrl: place.googleMapsUri || '',
    rating: place.rating || 0,
    totalRatings: place.userRatingCount || 0,
    source: 'google-maps',
    verified: false,
    casesWon: null,
    casesTotal: null,
    winRate: null,
    specializations: caseType ? [caseType] : [],
    coordinates: place.location || null,
    businessStatus: place.businessStatus || '',
  }));

  return {
    publicLawyers,
    source: coords ? 'geolocated' : 'text-search',
    message: publicLawyers.length ? null : 'No nearby public lawyer listings found on Google Maps.',
  };
}

router.get('/match/:caseId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only users can match lawyers' });
    }

    const caseDoc = await Case.findById(req.params.caseId);

    if (!caseDoc) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (caseDoc.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only match lawyers for your own cases' });
    }

    const lawyers = await Lawyer.find({
      specializations: caseDoc.caseType,
      verified: true,
    })
      .select('-password')
      .sort({ winRate: -1, rating: -1 })
      .limit(5);

    return res.status(200).json({ lawyers });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to match lawyers' });
  }
});

router.get('/discover/:caseId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only users can discover lawyers' });
    }

    const caseDoc = await Case.findById(req.params.caseId);

    if (!caseDoc) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (caseDoc.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only discover lawyers for your own cases' });
    }

    const registeredLawyers = await Lawyer.find({
      specializations: caseDoc.caseType,
      verified: true,
    })
      .select('-password')
      .sort({ winRate: -1, rating: -1 })
      .limit(5);

    let nearbyPublic = {
      publicLawyers: [],
      source: 'disabled',
      message: 'Google Maps lookup is not configured yet.',
    };

    try {
      nearbyPublic = await searchNearbyPublicLawyers({
        location: caseDoc.location,
        latitude: req.query.latitude,
        longitude: req.query.longitude,
        caseType: caseDoc.caseType,
      });
    } catch (mapsError) {
      nearbyPublic = {
        publicLawyers: [],
        source: 'error',
        message: mapsError.message,
      };
    }

    return res.status(200).json({
      registeredLawyers,
      publicLawyers: nearbyPublic.publicLawyers,
      meta: {
        mapsConfigured: Boolean(GOOGLE_MAPS_API_KEY),
        publicSearchSource: nearbyPublic.source,
        publicSearchMessage: nearbyPublic.message,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to discover lawyers' });
  }
});

router.get('/profile/:id', async (req, res) => {
  try {
    const lawyer = await Lawyer.findById(req.params.id).select('-password');

    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    return res.status(200).json({ lawyer });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch lawyer profile' });
  }
});

router.get('/active-cases', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ message: 'Only lawyers can view active cases' });
    }

    const lawyer = await Lawyer.findById(req.user.id).populate({
      path: 'activeCases',
      populate: {
        path: 'userId',
        select: 'name phone location',
      },
    });

    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    return res.status(200).json({
      cases: lawyer.activeCases,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch active cases' });
  }
});

router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ message: 'Only lawyers can view dashboard data' });
    }

    const lawyer = await Lawyer.findById(req.user.id).select('-password').lean();

    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    const recentActivity = await Case.find({ assignedLawyer: req.user.id })
      .select('title status updatedAt outcome createdAt caseType')
      .sort({ updatedAt: -1 })
      .limit(5);

    return res.status(200).json({
      lawyer,
      recentActivity,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ message: 'Only lawyers can update their profile' });
    }

    const { bio, specializations, experience, location } = req.body;

    const lawyer = await Lawyer.findByIdAndUpdate(
      req.user.id,
      {
        ...(bio !== undefined ? { bio } : {}),
        ...(Array.isArray(specializations) ? { specializations } : {}),
        ...(experience !== undefined ? { experience: Number(experience) || 0 } : {}),
        ...(location !== undefined ? { location } : {}),
      },
      { new: true, runValidators: true }
    ).select('-password');

    return res.status(200).json({
      lawyer,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update lawyer profile' });
  }
});

module.exports = router;
