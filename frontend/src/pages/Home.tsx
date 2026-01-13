import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="home-page">
      <section className="hero">
        <h1>Find Your Perfect Job Match</h1>
        <p>JobLens uses AI to match your skills and preferences with the perfect job opportunities</p>
        <div className="cta-buttons">
          <Link to="/signup" className="btn btn-primary">Get Started</Link>
          <Link to="/login" className="btn btn-secondary">Login</Link>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <h3>AI-Powered Matching</h3>
          <p>Our advanced algorithms analyze your CV and match you with relevant jobs</p>
        </div>
        <div className="feature-card">
          <h3>Daily Recommendations</h3>
          <p>Receive personalized job recommendations delivered to your inbox daily</p>
        </div>
        <div className="feature-card">
          <h3>Track Applications</h3>
          <p>Keep track of your applications and get insights on your job search</p>
        </div>
      </section>
    </div>
  );
};

export default Home;