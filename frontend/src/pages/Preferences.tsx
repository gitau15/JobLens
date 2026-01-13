import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Preferences {
  location: string;
  remotePreference: 'any' | 'only' | 'no';
  jobTypes: string[];
  minSalary: number;
  industries: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
}

// Mapping between UI values and database values
const mapRemotePreferenceToDB = (uiValue: 'any' | 'only' | 'no'): string => {
  return uiValue === 'only' ? 'remote' :
         uiValue === 'no' ? 'onsite' :
         uiValue === 'any' ? 'either' : 'either';
};

const mapRemotePreferenceFromDB = (dbValue: string): 'any' | 'only' | 'no' => {
  return dbValue === 'remote' ? 'only' :
         dbValue === 'onsite' ? 'no' :
         dbValue === 'hybrid' ? 'any' :
         dbValue === 'either' ? 'any' : 'any';
};

const Preferences = () => {
  const { user, getUserPreferences, updateUserPreferences } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>({
    location: '',
    remotePreference: 'any',
    jobTypes: [],
    minSalary: 0,
    industries: [],
    experienceLevel: 'mid'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load user preferences when component mounts
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefData = await getUserPreferences();
        if (prefData) {
          // Map the database fields to our Preferences interface
          setPreferences({
            location: prefData.location_preference || '',
            remotePreference: mapRemotePreferenceFromDB(prefData.remote_preference),
            jobTypes: prefData.job_types || [],
            minSalary: prefData.min_salary || 0,
            industries: prefData.industries || [],
            experienceLevel: prefData.experience_level || 'mid'
          });
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };
    
    if (user) {
      loadPreferences();
    }
  }, [user, getUserPreferences]);

  const handleChange = (field: keyof Preferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleJobTypeChange = (jobType: string) => {
    setPreferences(prev => {
      const newTypes = prev.jobTypes.includes(jobType)
        ? prev.jobTypes.filter(type => type !== jobType)
        : [...prev.jobTypes, jobType];
      return { ...prev, jobTypes: newTypes };
    });
  };

  const handleIndustryChange = (industry: string) => {
    setPreferences(prev => {
      const newIndustries = prev.industries.includes(industry)
        ? prev.industries.filter(ind => ind !== industry)
        : [...prev.industries, industry];
      return { ...prev, industries: newIndustries };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Convert our Preferences interface to the database format
      await updateUserPreferences({
        location_preference: preferences.location,
        remote_preference: mapRemotePreferenceToDB(preferences.remotePreference),
        job_types: preferences.jobTypes,
        min_salary: preferences.minSalary,
        industries: preferences.industries,
        experience_level: preferences.experienceLevel
      });
      setMessage('Preferences saved successfully!');
    } catch (err) {
      console.error('Error saving preferences:', err);
      setMessage('Error saving preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Job Preferences</h2>
      {message && <div className={message.includes('Error') ? 'error-message' : 'success-message'}>{message}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="location">Preferred Location</label>
          <input
            id="location"
            type="text"
            value={preferences.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="e.g., Remote, San Francisco, New York"
          />
        </div>
        
        <div className="form-group">
          <label>Remote Work Preference</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                checked={preferences.remotePreference === 'any'}
                onChange={() => handleChange('remotePreference', 'any')}
              />
              No preference
            </label>
            <label>
              <input
                type="radio"
                checked={preferences.remotePreference === 'only'}
                onChange={() => handleChange('remotePreference', 'only')}
              />
              Remote only
            </label>
            <label>
              <input
                type="radio"
                checked={preferences.remotePreference === 'no'}
                onChange={() => handleChange('remotePreference', 'no')}
              />
              No remote work
            </label>
          </div>
        </div>
        
        <div className="form-group">
          <label>Job Types</label>
          <div className="checkbox-group">
            {['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'].map(jobType => (
              <label key={jobType}>
                <input
                  type="checkbox"
                  checked={preferences.jobTypes.includes(jobType)}
                  onChange={() => handleJobTypeChange(jobType)}
                />
                {jobType}
              </label>
            ))}
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="minSalary">Minimum Salary ($)</label>
          <input
            id="minSalary"
            type="number"
            value={preferences.minSalary}
            onChange={(e) => handleChange('minSalary', parseInt(e.target.value) || 0)}
            placeholder="e.g., 70000"
          />
        </div>
        
        <div className="form-group">
          <label>Preferred Industries</label>
          <div className="checkbox-group">
            {['Technology', 'Finance', 'Healthcare', 'Education', 'Marketing', 'Design', 'Sales', 'Consulting'].map(industry => (
              <label key={industry}>
                <input
                  type="checkbox"
                  checked={preferences.industries.includes(industry)}
                  onChange={() => handleIndustryChange(industry)}
                />
                {industry}
              </label>
            ))}
          </div>
        </div>
        
        <div className="form-group">
          <label>Experience Level</label>
          <div className="radio-group">
            {[
              { value: 'entry', label: 'Entry level (0-2 years)' },
              { value: 'mid', label: 'Mid level (3-5 years)' },
              { value: 'senior', label: 'Senior level (6-10 years)' },
              { value: 'executive', label: 'Executive level (10+ years)' }
            ].map(level => (
              <label key={level.value}>
                <input
                  type="radio"
                  checked={preferences.experienceLevel === level.value}
                  onChange={() => handleChange('experienceLevel', level.value)}
                />
                {level.label}
              </label>
            ))}
          </div>
        </div>
        
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Saving Preferences...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
};

export default Preferences;