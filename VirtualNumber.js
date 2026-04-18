import mongoose from 'mongoose';

const virtualNumberSchema = new mongoose.Schema({
  number: { type: String, required: true },
  countryCode: { type: String, required: true },
  provider: { type: String, enum: ['twilio', 'zadarma', 'rapidapi'], required: true },
  providerId: { type: String, required: true },
  status: { type: String, enum: ['available', 'rented', 'expired'], default: 'available' },
  rentedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rentedAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  pricePerHour: { type: Number, default: 0.50 },
  createdAt: { type: Date, default: Date.now }
});

virtualNumberSchema.index({ number: 1, status: 1 });

const VirtualNumber = mongoose.models.VirtualNumber || mongoose.model('VirtualNumber', virtualNumberSchema);
export default VirtualNumber;
