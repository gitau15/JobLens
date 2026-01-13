import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CvUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CV file to upload');
      return;
    }

    setUploading(true);
    setMessage('');
    setError('');

    try {
      // In a real implementation, we would upload the CV file to our backend
      // For now, we'll simulate processing the CV and getting an embedding
      // This would involve sending the file to an endpoint that extracts text
      // and generates embeddings
      
      // For demonstration purposes, we'll create a placeholder embedding
      // In reality, this would come from our backend processing service
      const placeholderEmbedding = Array(384).fill(0.1);
      
      // Save the embedding to user profile or session for later use
      localStorage.setItem('cvEmbedding', JSON.stringify(placeholderEmbedding));
      
      setMessage('CV uploaded and processed successfully!');
      
      // Optionally redirect to job recommendations
      setTimeout(() => {
        navigate('/jobs');
      }, 1500);
    } catch (err) {
      console.error('Error uploading CV:', err);
      setError('Failed to upload and process CV. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  return (
    <div className="form-container">
      <h2>Upload Your CV</h2>
      <p>Upload your CV in PDF or DOCX format to receive personalized job recommendations.</p>
      
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div 
        className={`upload-area ${file ? 'uploaded' : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="file-info">
            <p>Selected file: {file.name}</p>
            <button 
              type="button" 
              className="remove-btn"
              onClick={() => setFile(null)}
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="upload-prompt">
            <p>Drag & drop your CV here, or</p>
            <input
              type="file"
              id="cv-upload"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="cv-upload" className="browse-btn">
              Browse Files
            </label>
          </div>
        )}
      </div>
      
      <div className="upload-actions">
        <button 
          onClick={handleUpload} 
          disabled={uploading || !file}
          className="submit-btn"
        >
          {uploading ? 'Processing CV...' : 'Upload & Process CV'}
        </button>
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="secondary-btn"
        >
          Cancel
        </button>
      </div>
      
      <div className="cv-guidelines">
        <h3>CV Guidelines</h3>
        <ul>
          <li>File size should be less than 5MB</li>
          <li>Supported formats: PDF, DOC, DOCX</li>
          <li>Include your contact information, skills, and work experience</li>
          <li>Use clear headings and standard formatting</li>
        </ul>
      </div>
    </div>
  );
};

export default CvUpload;