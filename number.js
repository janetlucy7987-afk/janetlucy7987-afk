import express from 'express';
import jwt from 'jsonwebtoken';
import connectToDatabase from '../lib/db.js';
import VirtualNumber from '../models/VirtualNumber.js';
import User from '../models/User.js';
import rapidApiService from '../services/rapidApiService.js';

const router = express.Router();

// Get countries
router.get('/countries', async (req, res) => {
  try {
    const countries = await rapidApiService.getCountries();
    res.json({ success: true, data: countries });
  } catch (error) {
    console.error('Countries error:', error);
    res.status(500).json({ error: 'Failed to load countries' });
  }
});

// Get available numbers
router.get('/available/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    const numbers = await rapidApiService.getNumbers(countryCode);
    
    res.json({
      success: true,
      data: numbers.map(num => ({
        number: num,
        countryCode,
        pricePerHour: 0.50,
        pricePerDay: 3.00
      }))
    });
  } catch (error) {
    console.error('Numbers error:', error);
    res.status(500).json({ error: 'Failed to load numbers' });
  }
});

// Rent number (protected)
router.post('/rent', authenticate, async (req, res) => {
  try {
    await connectToDatabase();
    
    const { number, countryCode, duration, durationType } = req.body;
    const user = await User.findById(req.user.id);
    
    // Calculate cost
    const hours = durationType === 'hours' ? duration : duration * 24;
    const cost = hours * 0.50;
    
    // Check credits
    if (user.credits < cost) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }
    
    // Create rental
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);
    
    const virtualNumber = await VirtualNumber.create({
      number,
      countryCode,
      provider: 'rapidapi',
      providerId: number,
      status: 'rented',
      rentedBy: user._id,
      rentedAt: new Date(),
      expiresAt,
      pricePerHour: 0.50
    });
    
    // Deduct credits
    user.credits -= cost;
    await user.save();
    
    res.json({
      success: true,
      data: virtualNumber
    });
  } catch (error) {
    console.error('Rent error:', error);
    res.status(500).json({ error: 'Failed to rent number' });
  }
});

// Get my numbers (protected)
router.get('/my-numbers', authenticate, async (req, res) => {
  try {
    await connectToDatabase();
    
    const numbers = await VirtualNumber.find({
      rentedBy: req.user.id,
      status: 'rented',
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
    
    res.json({ success: true, data: numbers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load numbers' });
  }
});

// Middleware
function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export default router;
