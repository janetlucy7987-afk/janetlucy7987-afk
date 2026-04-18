import express from 'express';
import jwt from 'jsonwebtoken';
import connectToDatabase from '../lib/db.js';
import SMSMessage from '../models/SMSMessage.js';
import VirtualNumber from '../models/VirtualNumber.js';
import rapidApiService from '../services/rapidApiService.js';

const router = express.Router();

// Get messages for a number
router.get('/:numberId', authenticate, async (req, res) => {
  try {
    await connectToDatabase();
    
    const { numberId } = req.params;
    
    // Verify ownership
    const virtualNumber = await VirtualNumber.findOne({
      _id: numberId,
      rentedBy: req.user.id
    });
    
    if (!virtualNumber) {
      return res.status(404).json({ error: 'Number not found' });
    }
    
    // Get cached messages
    let messages = await SMSMessage.find({
      virtualNumber: numberId
    }).sort({ receivedAt: -1 }).limit(50);
    
    // Fetch fresh messages from provider
    try {
      const freshMessages = await rapidApiService.getMessages(
        virtualNumber.countryCode,
        virtualNumber.number
      );
      
      // Save new messages
      for (const msg of freshMessages) {
        const messageId = `${msg.myNumber}-${msg.createdAt}`;
        const exists = await SMSMessage.findOne({ providerMessageId: messageId });
        
        if (!exists) {
          await SMSMessage.create({
            to: msg.myNumber,
            from: msg.serviceName || 'Unknown',
            body: msg.text,
            virtualNumber: numberId,
            serviceName: msg.serviceName,
            providerMessageId: messageId
          });
        }
      }
      
      // Refresh list
      messages = await SMSMessage.find({
        virtualNumber: numberId
      }).sort({ receivedAt: -1 }).limit(50);
    } catch (error) {
      console.log('Provider fetch failed, using cache');
    }
    
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('SMS fetch error:', error);
    res.status(500).json({ error: 'Failed to load messages' });
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
