import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h3>Navigation</h3>
        <ul>
          <li><Link to="/dashboard" className="active">Dashboard</Link></li>
          <li><Link to="/jobs">Job Recommendations</Link></li>
          <li><Link to="/profile">Profile</Link></li>
          <li><Link to="/cv-upload">CV Upload</Link></li>
          <li><Link to="/preferences">Preferences</Link></li>
        </ul>
      </aside>
      
      <main className="content-area">
        <h1>Dashboard</h1>
        <p>Welcome to your JobLens dashboard! Here you can manage your job search and view personalized recommendations.</p>
        
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>5</h3>
            <p>New Job Matches Today</p>
          </div>
          <div className="stat-card">
            <h3>12</h3>
            <p>Total Recommendations</p>
          </div>
          <div className="stat-card">
            <h3>3</h3>
            <p>Applications Sent</p>
          </div>
        </div>
        
        <div className="dashboard-actions">
          <Link to="/cv-upload" className="btn btn-primary">Upload CV</Link>
          <Link to="/jobs" className="btn btn-secondary">View Recommendations</Link>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;