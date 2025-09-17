export const prerender = false;

import type { APIRoute } from 'astro';
import { CASParserAPI, formatCurrency } from '../../../utils/financeApi';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const includeHoldings = url.searchParams.get('includeHoldings') === 'true';
    
    // Initialize CAS Parser API
    const casParserApi = new CASParserAPI(
      process.env.CAS_PARSER_API_KEY || import.meta.env.CAS_PARSER_API_KEY || ''
    );

    if (!process.env.CAS_PARSER_API_KEY && !import.meta.env.CAS_PARSER_API_KEY) {
      console.warn('CAS_PARSER_API_KEY not found, using mock data');
    }

    // For now, get holdings using mock data
    // In production, you would pass actual CAS file and password
    const holdings = await casParserApi.getAllHoldings();
    
    // Calculate portfolio summary
    const stocksTotal = holdings.equities.reduce((sum, stock) => sum + stock.value, 0);
    const mutualFundsTotal = holdings.mutualFunds.reduce((sum, mf) => sum + mf.value, 0);
    const totalValue = stocksTotal + mutualFundsTotal;
    
    // Mock bonds data since CAS doesn't typically include bonds
    const bondsTotal = 150000;
    const grandTotal = totalValue + bondsTotal;
    
    // Calculate allocations
    const stocksPercent = ((stocksTotal / grandTotal) * 100).toFixed(1);
    const mutualFundsPercent = ((mutualFundsTotal / grandTotal) * 100).toFixed(1);
    const bondsPercent = ((bondsTotal / grandTotal) * 100).toFixed(1);
    
    // Mock performance data
    const performance = {
      oneMonth: 2.3,
      threeMonths: 8.7,
      ytd: 12.4,
      oneYear: 18.9,
      benchmark: {
        oneMonth: 1.8,
        threeMonths: 7.2,
        ytd: 11.2,
        oneYear: 16.4
      }
    };
    
    const portfolioData = {
      summary: {
        totalValue: grandTotal,
        totalChange: 2.30,
        totalChangeAmount: grandTotal * 0.023,
        lastUpdated: new Date().toISOString()
      },
      allocations: {
        stocks: {
          value: stocksTotal,
          percentage: stocksPercent,
          count: holdings.equities.length
        },
        mutualFunds: {
          value: mutualFundsTotal,
          percentage: mutualFundsPercent,
          count: holdings.mutualFunds.length
        },
        bonds: {
          value: bondsTotal,
          percentage: bondsPercent,
          count: 2
        }
      },
      performance,
      ...(includeHoldings && {
        holdings: {
          equities: holdings.equities,
          mutualFunds: holdings.mutualFunds
        }
      })
    };

    return new Response(JSON.stringify(portfolioData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5 minutes
      }
    });
    
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch portfolio data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const casFile = formData.get('casFile') as File;
    const password = formData.get('password') as string;
    
    if (!casFile) {
      return new Response(JSON.stringify({ 
        error: 'No CAS file provided' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Initialize CAS Parser API
    const casParserApi = new CASParserAPI(
      process.env.CAS_PARSER_API_KEY || import.meta.env.CAS_PARSER_API_KEY || ''
    );
    
    // Convert file to buffer
    const fileBuffer = Buffer.from(await casFile.arrayBuffer());
    
    // Parse CAS file
    const holdings = await casParserApi.getAllHoldings(fileBuffer, password);
    
    // Calculate portfolio summary
    const stocksTotal = holdings.equities.reduce((sum, stock) => sum + stock.value, 0);
    const mutualFundsTotal = holdings.mutualFunds.reduce((sum, mf) => sum + mf.value, 0);
    const totalValue = stocksTotal + mutualFundsTotal;
    
    const portfolioData = {
      summary: {
        totalValue,
        lastUpdated: new Date().toISOString()
      },
      holdings: {
        equities: holdings.equities,
        mutualFunds: holdings.mutualFunds
      }
    };

    return new Response(JSON.stringify(portfolioData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Error parsing CAS file:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to parse CAS file',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};