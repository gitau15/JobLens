import React, { useState, useEffect } from 'react';
import { api, JobMatch } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary_min?: number;
  salary_max?: number;
  posted_at: string;
  match_score: number;
  job_url: string;
}

const JobListings = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: '',
    minSalary: '',
    jobType: ''
  });
  
  const { user } = useAuth();

  useEffect(() => {
    const fetchJobRecommendations = async () => {
      try {
        setLoading(true);
        
        // Get user's CV embedding if available, otherwise use a placeholder
        let cvEmbedding;
        if (user) {
          // TODO: Implement API call to fetch user's CV embedding from backend
          // For now, we'll still use a placeholder, but in production this would fetch the actual embedding
          cvEmbedding = Array(384).fill(0.1); // Placeholder - should fetch from user's profile
        } else {
          cvEmbedding = Array(384).fill(0.1); // Placeholder embedding
        }
        
        const response = await api.matcher.matchCV({
          cv_embedding: cvEmbedding,
          limit: 20,
          filters: {
            location: filters.location || undefined,
          }
        });
        
        // Transform the response to match our Job interface
        const transformedJobs: Job[] = response.data.jobs.map((job: JobMatch) => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          salary_min: undefined, // Not provided in the backend response
          salary_max: undefined, // Not provided in the backend response
          posted_at: new Date().toISOString().split('T')[0], // Placeholder date
          match_score: job.score,
          job_url: job.job_url || '#'
        }));
        
        setJobs(transformedJobs);
      } catch (error) {
        console.error('Error fetching job recommendations:', error);
        // Fallback to empty array if there's an error
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobRecommendations();
  }, [filters.location]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredJobs = jobs.filter((job: Job) => {
    if (filters.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    if (filters.minSalary && job.salary_min && job.salary_min < parseInt(filters.minSalary)) {
      return false;
    }
    return true;
  });

  if (loading) {
    return <div className="loading">Loading jobs...</div>;
  }

  return (
    <div className="job-listings-container">
      <h1>Job Recommendations</h1>
      
      <div className="filters">
        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={filters.location}
            onChange={handleFilterChange}
            placeholder="e.g., Remote, New York"
          />
        </div>
        <div className="form-group">
          <label htmlFor="minSalary">Min Salary</label>
          <input
            type="number"
            id="minSalary"
            name="minSalary"
            value={filters.minSalary}
            onChange={handleFilterChange}
            placeholder="e.g., 70000"
          />
        </div>
      </div>
      
      <div className="job-listings">
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => (
            <div key={job.id} className="job-card">
              <div className="job-header">
                <h3 className="job-title">{job.title}</h3>
                <div className="match-score">Match: {job.match_score}%</div>
              </div>
              <div className="job-company">{job.company}</div>
              <div className="job-location">{job.location}</div>
              <div className="job-description">{job.description}</div>
              <div className="job-meta">
                <div className="job-salary">
                  {job.salary_min && job.salary_max ? 
                    `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}` : 
                    'Salary not specified'}
                </div>
                <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="apply-btn">
                  Apply
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="no-jobs">No jobs match your current filters.</div>
        )}
      </div>
    </div>
  );
};

export default JobListings;