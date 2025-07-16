import type { APIRoute } from 'astro';
import { PortfolioAggregator, getApiConfig } from '../../utils/financeApi';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Check for authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Note: In production, you would receive the CAS PDF file and password
    // For now, using mock data by passing no file
    const casFile = undefined; // Would come from multipart form data
    const casPassword = undefined; // Would come from request

    // Initialize portfolio aggregator
    const portfolioAggregator = new PortfolioAggregator(getApiConfig());
    
    // Fetch portfolio data
    const portfolio = await portfolioAggregator.getFullPortfolio(casFile, casPassword);
    
    return new Response(JSON.stringify(portfolio), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch portfolio data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
};