import axios from 'axios';

// Create axios instances for each backend service
const scraperService = axios.create({
  baseURL: import.meta.env.VITE_SCRAPER_SERVICE_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const embedderService = axios.create({
  baseURL: import.meta.env.VITE_EMBEDDER_SERVICE_URL || 'http://localhost:8002',
  timeout: 60000,  // Increased timeout for file processing operations
  headers: {
    'Content-Type': 'application/json',
  },
});

const matcherService = axios.create({
  baseURL: import.meta.env.VITE_MATCHER_SERVICE_URL || 'http://localhost:8001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptors for request/response handling
[scraperService, embedderService, matcherService].forEach(service => {
  service.interceptors.request.use(
    (config) => {
      // Add any common request logic here
      console.log(`Making request to: ${config.baseURL}${config.url}`);
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  service.interceptors.response.use(
    (response) => {
      // Add any common response logic here
      console.log(`Received response from: ${response.config.baseURL}${response.config.url}`);
      return response;
    },
    (error) => {
      console.error(`API Error: ${error.message}`, error);
      return Promise.reject(error);
    }
  );
});

// Define TypeScript interfaces for API responses
export interface Job {
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
  requirements?: string;
  metadata?: Record<string, any>;
}

export interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  job_url: string;
  description: string;
  requirements: string;
  score: number; // Similarity score (0-100)
  metadata: Record<string, any>;
}

export interface MatchResponse {
  jobs: JobMatch[];
  total_matches: number;
}

export interface MatchRequest {
  cv_embedding: number[];
  limit: number;
  filters?: Record<string, any>;
}

export interface JobToEmbed {
  id: string;
  title: string;
  description: string;
  company?: string;
  location?: string;
  source_name?: string;
}

export interface EmbedJobsRequest {
  jobs: JobToEmbed[];
  collection_name?: string;
}

export interface EmbedJobsResponse {
  collection_name: string;
  count: number;
}

export interface EmbedQueryRequest {
  text: string;
}

export interface EmbedQueryResponse {
  embedding: number[];
}

export interface ScrapeRequest {
  source_name: string;
  max_jobs: number;
  since?: Date;
}

export interface ScrapeResponse {
  source_name: string;
  job_count: number;
  jobs: JobToEmbed[];
  error?: string;
}

// API service functions
export const api = {
  // Scraper Service
  scraper: {
    healthCheck: () => scraperService.get('/health'),
    scrapeJobs: (request: ScrapeRequest) => scraperService.post<ScrapeResponse>('/scrape', request),
  },

  // Embedder Service
  embedder: {
    healthCheck: () => embedderService.get('/health'),
    embedJobs: (request: EmbedJobsRequest) => embedderService.post<EmbedJobsResponse>('/embed/jobs', request),
    embedQuery: (request: EmbedQueryRequest) => embedderService.post<EmbedQueryResponse>('/embed/query', request),
    embedCV: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return embedderService.post<EmbedQueryResponse>('/embed/cv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // Increase timeout to 120 seconds for file processing
      });
    },
  },

  // Matcher Service
  matcher: {
    healthCheck: () => matcherService.get('/health'),
    matchCV: (request: MatchRequest) => matcherService.post<MatchResponse>('/match', request),
    matchCVWithRerank: (request: MatchRequest) => matcherService.post<MatchResponse>('/match-with-rerank', request),
  },

  // Convenience function to check if all services are healthy
  healthCheckAll: async (): Promise<{ scraper: boolean; matcher: boolean; embedder: boolean; error?: string }> => {
    try {
      const [scraperRes, matcherRes, embedderRes] = await Promise.allSettled([
        api.scraper.healthCheck(),
        api.matcher.healthCheck(),
        api.embedder.healthCheck(),
      ]);

      return {
        scraper: scraperRes.status === 'fulfilled',
        matcher: matcherRes.status === 'fulfilled',
        embedder: embedderRes.status === 'fulfilled',
      };
    } catch (error) {
      return {
        scraper: false,
        matcher: false,
        embedder: false,
        error: (error as Error).message,
      };
    }
  },
};

export default api;