import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Dashboard({ refreshKey }) {
  const [documents, setDocuments] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showProgress, setShowProgress] = useState(true);

  const loadDocuments = async () => {
    try {
      const response = await api.get('/documents');
      setDocuments(response.data);
    } catch (error) {
      toast.error('Unable to load documents.');
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [refreshKey]);

  const handleDrag = (e) => {
    e.preventDefault();
    setIsDragging(e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const newUploads = fileArray.map((file, idx) => ({
      id: `${Date.now()}-${idx}`,
      file,
      progress: 0,
      status: 'pending',
    }));

    setUploads((prev) => [...prev, ...newUploads]);
    setShowProgress(true);
  };

  const uploadFiles = async () => {
    const pendingUploads = uploads.filter((u) => u.status === 'pending');
    if (!pendingUploads.length) {
      toast.error('No files to upload.');
      return;
    }

    setLoading(true);
    const totalFiles = pendingUploads.length;
    const batchId = totalFiles > 3 ? `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` : null;

    const uploadPromises = pendingUploads.map(async (item) => {
      setUploads((prev) =>
        prev.map((u) => (u.id === item.id ? { ...u, status: 'uploading', progress: 0 } : u))
      );

      const formData = new FormData();
      formData.append('file', item.file);
      if (batchId) {
        formData.append('batchId', batchId);
        formData.append('totalFiles', totalFiles);
      }

      try {
        await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (event) => {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploads((prev) =>
              prev.map((u) =>
                u.id === item.id
                  ? { ...u, progress, status: progress === 100 ? 'complete' : 'uploading' }
                  : u
              )
            );
          },
        });

        setUploads((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, status: 'complete', progress: 100 } : u))
        );
      } catch (error) {
        console.error('File upload error for', item.file.name, error);
        setUploads((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, status: 'failed' } : u))
        );
        toast.error(`Failed to upload ${item.file.name}`);
      }
    });

    await Promise.all(uploadPromises);
    setLoading(false);

    if (totalFiles <= 3) {
      toast.success('Upload completed!');
      setUploads([]);
    } else {
      toast.success('Files sent to server for processing.');
    }

    await loadDocuments();
  };

  const isBulkUpload = uploads.length > 3;

  return (
    <div className="space-y-8">
      {/* Info Banner */}
      <div className="flex gap-3 rounded-lg bg-blue-50 p-4 text-blue-900">
        <span className="text-lg">ℹ️</span>
        <div className="text-sm">
          <strong>Upload Instructions:</strong> Files are uploaded to the backend and stored in the database. Upload{' '}
          <strong>1–3 files</strong> to see individual per-file progress bars. Upload <strong>4 or more files</strong> to trigger the bulk notification with success message.
        </div>
      </div>

      {/* Upload Section */}
      <div
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-12 text-center transition ${
          isDragging ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-gray-50'
        }`}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-200">
          <span className="text-2xl">📄</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Drop files here or click to browse</h3>
        <p className="mt-2 text-sm text-slate-600">Any file type · Up to 20 MB per file</p>

        <input
          type="file"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          id="file-input"
        />

        <div className="mt-6 flex justify-center gap-2">
          <label htmlFor="file-input" className="cursor-pointer rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
            Single file
          </label>
          <label htmlFor="file-input" className="cursor-pointer rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
            Bulk upload
          </label>
          <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700">Try 4+ files to trigger notifications</span>
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-slate-900">Upload Queue ({uploads.length} files)</h4>
            <div className="flex items-center gap-3">
              {isBulkUpload && (
                <button
                  onClick={() => setShowProgress(!showProgress)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  {showProgress ? 'Collapse Details' : 'Expand Details'}
                </button>
              )}
              {!loading && (
                <button
                  onClick={() => setUploads([])}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Clear Queue
                </button>
              )}
            </div>
          </div>

          {isBulkUpload && loading && (
            <div className="mb-4 rounded-lg bg-blue-50 p-3">
              <p className="text-sm font-semibold text-blue-900">Upload in progress — processing {uploads.length} files in background.</p>
            </div>
          )}

          {showProgress && (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {uploads.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-slate-900 truncate max-w-xs">{item.file.name}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      item.status === 'complete' ? 'bg-green-100 text-green-700' :
                      item.status === 'failed' ? 'bg-red-100 text-red-700' :
                      item.status === 'uploading' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`transition-all duration-300 ${
                        item.status === 'failed' ? 'bg-red-500' :
                        item.status === 'complete' ? 'bg-green-500' :
                        'bg-blue-600'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>{(item.file.size / 1024).toFixed(1)} KB</span>
                    <span>{item.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {uploads.some((item) => item.status === 'pending') && (
            <button
              onClick={uploadFiles}
              disabled={loading}
              className="mt-4 w-full rounded-full bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
            >
              {loading ? 'Uploading...' : 'Start Upload'}
            </button>
          )}
        </div>
      )}

      {/* Document Library */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-semibold text-slate-900">Document Library</h3>

        {documents.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-lg bg-gray-50 p-8 text-center">
            <span className="text-3xl">📭</span>
            <p className="font-medium text-slate-900">No documents yet</p>
            <p className="text-sm text-slate-600">Upload files above — they'll appear here once complete</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {documents.map((doc) => (
              <div key={doc._id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                <div>
                  <p className="font-medium text-slate-900">{doc.fileName}</p>
                  <p className="text-xs text-slate-600">{(doc.fileSize / 1024).toFixed(1)} KB · {new Date(doc.uploadDate).toLocaleDateString()}</p>
                </div>
                <a
                  href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4001'}/${doc.filePath}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
