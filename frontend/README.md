# JobLens Frontend

JobLens is an autonomous AI agent for semantic CV-job matching that helps job seekers find the most relevant opportunities using advanced NLP techniques.

## Features

- User authentication with Supabase
- CV upload and processing
- Personalized job recommendations
- Job preference management
- Responsive design for all devices

## Tech Stack

- React 18
- TypeScript
- Vite
- Supabase for authentication
- Axios for API requests
- Tailwind CSS for styling

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/gitau15/JobLens.git
cd JobLens/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root of the frontend directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SCRAPER_SERVICE_URL=http://localhost:8000
VITE_EMBEDDER_SERVICE_URL=http://localhost:8002
VITE_MATCHER_SERVICE_URL=http://localhost:8001
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:5173

## Deployment

### Deploy to Vercel

1. Push your code to a GitHub repository
2. Go to [Vercel](https://vercel.com) and sign in
3. Click "New Project" and import your repository
4. Set the following configuration:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add your environment variables in the Vercel dashboard
6. Click "Deploy"

### Environment Variables

For production, you'll need to set these environment variables:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- `VITE_SCRAPER_SERVICE_URL` - URL of your scraper service
- `VITE_EMBEDDER_SERVICE_URL` - URL of your embedder service
- `VITE_MATCHER_SERVICE_URL` - URL of your matcher service

## Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React context providers
├── pages/          # Route components
├── services/       # API service utilities
├── App.tsx         # Main application component
├── main.tsx        # Entry point
└── index.css       # Global styles
```

## API Integration

The frontend communicates with the backend services through the API service located at `src/services/api.ts`. This service handles:

- Scraper service for job listings
- Embedder service for creating embeddings
- Matcher service for semantic matching

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.