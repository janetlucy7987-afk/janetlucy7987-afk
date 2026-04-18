import mongoose from 'mongoose';

const smsMessageSchema = new mongoose.Schema({
  to: { type: String, required: true },
  from: { type: String, required: true },
  body: { type: String, required: true },
  virtualNumber: { type: mongoose.Schema.Types.ObjectId, ref: 'VirtualNumber', required: true },
  serviceName: { type: String, default: 'Unknown' },
  isRead: { type: Boolean, default: false },
  providerMessageId: { type: String },
  receivedAt: { type: Date, default: Date.now }
});

smsMessageSchema.index({ virtualNumber: 1, receivedAt: -1 });

const SMSMessage = mongoose.models.SMSMessage || mongoose.model('SMSMessage', smsMessageSchema);
export default SMSMessage;
 
