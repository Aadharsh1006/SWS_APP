import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileType: { type: String, required: true },
  filePath: { type: String, required: true },
  status: { type: String, default: 'completed' },
  uploadDate: { type: Date, default: Date.now }
});

export default mongoose.model('Document', DocumentSchema);
