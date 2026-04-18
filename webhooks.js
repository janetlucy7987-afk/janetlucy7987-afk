import express from 'express';
import connectToDatabase from '../lib/db.js';
import SMSMessage from '../models/SMSMessage.js';
import VirtualNumber from '../models/VirtualNumber.js';

const router = express.Router();

// Twilio webhook
router.post('/twilio/sms', async (req, res) => {
  try {
    await connectToDatabase();
    
    const { From, To, Body, MessageSid } = req.body;
    
    // Find number
    const virtualNumber = await VirtualNumber.findOne({
      number: To,
      status: 'rented'
    });
    
    if (!virtualNumber) {
      return res.status(404).send('Number not found');
    }
    
    // Save message
    await SMSMessage.create({
      to: To,
      from: From,
      body: Body,
      virtualNumber: virtualNumber._id,
      providerMessageId: MessageSid
    });
    
    // Return TwiML
    res.set('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

export default router;
