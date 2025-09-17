// Simplified for personal dashboard - no complex auth flows needed

export interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  value: number
}

export interface CryptoData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  value: number
}

export interface BondData {
  name: string
  yield: number
  maturityDate: string
  price: number
  value: number
}

export interface PortfolioData {
  stocks: StockData[]
  crypto: CryptoData[]
  bonds: BondData[]
  totalValue: number
  totalChange: number
  totalChangePercent: number
}

// Smallcase Gateway API integration - simplified for personal dashboard
// Uses a single connected user token (your personal smallcaseAuthId)
export class SmallcaseAPI {
  private baseUrl = 'https://gatewayapi.smallcase.com/v1'
  private gatewayName: string
  private gatewaySecret: string
  private authToken: string

  constructor(config: {
    gatewayName: string
    gatewaySecret: string
    authToken: string
  }) {
    this.gatewayName = config.gatewayName
    this.gatewaySecret = config.gatewaySecret
    this.authToken = config.authToken
  }

  async getPortfolio(): Promise<StockData[]> {
    try {
      // Use official Smallcase Gateway API
      // Documentation: https://developers.gateway.smallcase.com/

      const response = await fetch(`${this.baseUrl}/${this.gatewayName}/engine/user/investments`, {
        headers: {
          'x-gateway-secret': this.gatewaySecret,
          'x-gateway-authtoken': this.authToken,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch Smallcase portfolio')
      }

      const data = await response.json()
      
      // Convert smallcase investments to StockData format
      if (data.success && data.data) {
        const stocks: StockData[] = []
        
        // Process each smallcase investment
        for (const investment of data.data) {
          if (investment.config && investment.config.holdings) {
            for (const holding of investment.config.holdings) {
              stocks.push({
                symbol: holding.symbol,
                name: holding.name,
                price: holding.ltp || 0,
                change: holding.change || 0,
                changePercent: holding.changePercent || 0,
                value: (holding.quantity || 0) * (holding.ltp || 0),
              })
            }
          }
        }
        
        return stocks
      }
      
      return []
    } catch (error) {
      console.error('Error fetching Smallcase data:', error)
      // Return mock data for development
      return [
        {
          symbol: 'RELIANCE',
          name: 'Reliance Industries',
          price: 2450.5,
          change: 25.3,
          changePercent: 1.04,
          value: 245050,
        },
        {
          symbol: 'TCS',
          name: 'Tata Consultancy Services',
          price: 3580.25,
          change: -15.75,
          changePercent: -0.44,
          value: 358025,
        },
      ]
    }
  }

  async getAggregatedData(): Promise<{
    currentInvestment: number
    currentReturns: number
    networth: number
    totalReturns: number
    currentReturnsPercent: number
    totalReturnsPercent: number
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.gatewayName}/engine/user/investments?aggregatedData=true`, {
        headers: {
          'x-gateway-secret': this.gatewaySecret,
          'x-gateway-authtoken': this.authToken,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch Smallcase aggregated data')
      }

      const data = await response.json()
      
      if (data.success && data.data && data.data.aggregated) {
        return data.data.aggregated
      }
      
      // Return mock data if no aggregated data
      return {
        currentInvestment: 650000,
        currentReturns: 50000,
        networth: 700000,
        totalReturns: 50000,
        currentReturnsPercent: 7.69,
        totalReturnsPercent: 7.69,
      }
    } catch (error) {
      console.error('Error fetching Smallcase aggregated data:', error)
      return {
        currentInvestment: 650000,
        currentReturns: 50000,
        networth: 700000,
        totalReturns: 50000,
        currentReturnsPercent: 7.69,
        totalReturnsPercent: 7.69,
      }
    }
  }

  async getHoldings(includeMutualFunds: boolean = false): Promise<{
    stocks: StockData[]
    mutualFunds: any[]
  }> {
    try {
      const mfParam = includeMutualFunds ? '?mfHoldings=true&version=v2' : '?version=v2'
      
      const response = await fetch(`${this.baseUrl}/${this.gatewayName}/engine/user/holdings${mfParam}`, {
        headers: {
          'x-gateway-secret': this.gatewaySecret,
          'x-gateway-authtoken': this.authToken,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch Smallcase holdings')
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        const stocks: StockData[] = []
        const mutualFunds: any[] = []
        
        // Process stock holdings
        if (data.data.holdings) {
          for (const holding of data.data.holdings) {
            stocks.push({
              symbol: holding.symbol,
              name: holding.name,
              price: holding.ltp || 0,
              change: holding.change || 0,
              changePercent: holding.changePercent || 0,
              value: holding.currentValue || 0,
            })
          }
        }
        
        // Process mutual fund holdings if included
        if (includeMutualFunds && data.data.mfHoldings) {
          for (const mfHolding of data.data.mfHoldings) {
            mutualFunds.push({
              schemeName: mfHolding.schemeName,
              isin: mfHolding.isin,
              units: mfHolding.units,
              nav: mfHolding.nav,
              value: mfHolding.currentValue || 0,
              folioNumber: mfHolding.folioNumber,
              registrar: mfHolding.registrar || 'Unknown',
            })
          }
        }
        
        return { stocks, mutualFunds }
      }
      
      return { stocks: [], mutualFunds: [] }
    } catch (error) {
      console.error('Error fetching Smallcase holdings:', error)
      return { stocks: [], mutualFunds: [] }
    }
  }

  async createMutualFundImportTransaction(config?: {
    pan?: string
    phone?: string
    email?: string
    casDetail?: boolean
    casSummary?: boolean
  }): Promise<{ transactionId: string }> {
    try {
      const requestBody: any = {
        intent: 'MF_HOLDINGS_IMPORT',
      }
      
      if (config && (config.pan || config.phone || config.email)) {
        requestBody.assetConfig = {}
        if (config.pan) requestBody.assetConfig.pan = config.pan.toUpperCase()
        if (config.phone) requestBody.assetConfig.phone = config.phone
        if (config.email) requestBody.assetConfig.email = config.email
      }
      
      if (config && (config.casDetail !== undefined || config.casSummary !== undefined)) {
        requestBody.responseConfig = {
          casDetail: config.casDetail || false,
          casSummary: config.casSummary || false,
        }
      }
      
      const response = await fetch(`${this.baseUrl.replace('/v1', '')}/gateway/${this.gatewayName}/transaction`, {
        method: 'POST',
        headers: {
          'x-gateway-secret': this.gatewaySecret,
          'x-gateway-authtoken': this.authToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error('Failed to create MF import transaction')
      }

      const data = await response.json()
      
      if (data.success && data.data && data.data.transactionId) {
        return { transactionId: data.data.transactionId }
      }
      
      throw new Error('Invalid response from MF import transaction API')
    } catch (error) {
      console.error('Error creating MF import transaction:', error)
      throw error
    }
  }
}

// CoinSwitch API integration
export class CoinSwitchAPI {
  private baseUrl = 'https://api.coinswitch.co'
  private apiKey: string
  private apiSecret: string

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret
  }

  async getPortfolio(): Promise<CryptoData[]> {
    try {
      // Note: This uses CoinSwitch PRO API
      // Documentation: https://developer.coinswitch.co/

      const response = await fetch(`${this.baseUrl}/v2/portfolio`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch CoinSwitch portfolio')
      }

      const data = await response.json()
      return data.data.map((crypto: any) => ({
        symbol: crypto.symbol,
        name: crypto.name,
        price: crypto.price,
        change: crypto.change,
        changePercent: crypto.changePercent,
        value: crypto.balance * crypto.price,
      }))
    } catch (error) {
      console.error('Error fetching CoinSwitch data:', error)
      // Return mock data for development
      return [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 4200000,
          change: 125000,
          changePercent: 3.07,
          value: 210000,
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          price: 280000,
          change: -5000,
          changePercent: -1.75,
          value: 140000,
        },
      ]
    }
  }
}

// Wint Wealth API integration (mock implementation)
export class WintWealthAPI {
  private baseUrl = 'https://api.wintwealth.com' // Note: This is a mock URL
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getPortfolio(): Promise<BondData[]> {
    try {
      // Note: Wint Wealth doesn't have a public API as of 2025
      // This is a mock implementation - in production, you would need to:
      // 1. Contact Wint Wealth directly for API access
      // 2. Use their mobile app data export features
      // 3. Implement manual data entry with periodic updates

      console.log('Wint Wealth API not available - using mock data')

      // Return mock data for development
      return [
        {
          name: 'HDFC Housing Finance Bond',
          yield: 9.5,
          maturityDate: '2026-12-15',
          price: 1000,
          value: 75000,
        },
        {
          name: 'L&T Finance Bond',
          yield: 10.2,
          maturityDate: '2027-03-20',
          price: 1000,
          value: 75000,
        },
      ]
    } catch (error) {
      console.error('Error fetching Wint Wealth data:', error)
      return []
    }
  }
}

// Note: CDSL and NSDL don't offer public APIs
// We use CAS Parser API which provides unified access to all depositories

// CAS Parser API integration for all holdings data (stocks and mutual funds)
export class CASParserAPI {
  private baseUrl = 'https://portfolio-parser.api.casparser.in'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async parseCASFromFile(file: Buffer, password: string): Promise<any> {
    try {
      // CAS Parser API v4.0.0 - Parse PDF file
      // Documentation: https://casparser.in/docs

      const formData = new FormData()
      formData.append('file', new Blob([file.buffer]), 'cas.pdf')
      formData.append('password', password)

      const response = await fetch(`${this.baseUrl}/v4/parse`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to parse CAS statement')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error parsing CAS statement:', error)
      throw error
    }
  }

  async generateAndParseCAS(email: string, panNumber: string): Promise<any> {
    try {
      // First generate CAS, then parse it
      // This would require integration with CAS Generator API
      // For now, returning mock data
      console.log('CAS generation requires separate API integration')

      // In production, you would:
      // 1. Use CAS Generator API to trigger CAS email
      // 2. Retrieve the PDF from email
      // 3. Parse using parseCASFromFile

      return this.getMockCASData()
    } catch (error) {
      console.error('Error generating CAS:', error)
      throw error
    }
  }

  async getAllHoldings(
    file?: Buffer,
    password?: string,
  ): Promise<{
    equities: StockData[]
    mutualFunds: any[]
  }> {
    try {
      if (!file) {
        // Return mock data if no file provided
        return this.getMockCASData()
      }

      const casData = await this.parseCASFromFile(file, password || '')

      // Extract equity holdings
      const equities: StockData[] = []
      if (casData.equity_holdings) {
        for (const holding of casData.equity_holdings) {
          equities.push({
            symbol: holding.isin || holding.symbol,
            name: holding.name,
            price: holding.current_price || 0,
            change: 0,
            changePercent: 0,
            value: holding.current_value || holding.quantity * holding.current_price || 0,
          })
        }
      }

      // Extract mutual fund holdings
      const mutualFunds = []
      if (casData.mutual_funds) {
        for (const fund of casData.mutual_funds) {
          mutualFunds.push({
            schemeName: fund.scheme_name,
            isin: fund.isin,
            units: fund.units,
            nav: fund.nav,
            value: fund.current_value || fund.units * fund.nav,
            registrar: fund.registrar || 'Unknown',
          })
        }
      }

      return {equities, mutualFunds}
    } catch (error) {
      console.error('Error fetching holdings:', error)
      return this.getMockCASData()
    }
  }

  private getMockCASData() {
    return {
      equities: [
        {
          symbol: 'INE002A01018',
          name: 'Reliance Industries Limited',
          price: 2450.5,
          change: 25.3,
          changePercent: 1.04,
          value: 245050,
        },
        {
          symbol: 'INE467B01029',
          name: 'Tata Consultancy Services Limited',
          price: 3580.25,
          change: -15.75,
          changePercent: -0.44,
          value: 358025,
        },
      ],
      mutualFunds: [
        {
          schemeName: 'HDFC Equity Fund - Growth',
          isin: 'INF179K01014',
          units: 1000,
          nav: 750.5,
          value: 750500,
          registrar: 'CAMS',
        },
        {
          schemeName: 'SBI Bluechip Fund - Direct Growth',
          isin: 'INF200K01021',
          units: 500,
          nav: 620.25,
          value: 310125,
          registrar: 'KFintech',
        },
      ],
    }
  }
}

// Unified Holdings API using CAS Parser
export class UnifiedHoldingsAPI {
  private casParserApi: CASParserAPI

  constructor(config: {casParserApiKey: string}) {
    this.casParserApi = new CASParserAPI(config.casParserApiKey)
  }

  async getAllHoldings(
    casFile?: Buffer,
    password?: string,
  ): Promise<{
    equities: StockData[]
    mutualFunds: any[]
  }> {
    try {
      // CAS Parser provides unified access to all holdings from CDSL, NSDL, CAMS, and KFintech
      const holdings = await this.casParserApi.getAllHoldings(casFile, password)
      return holdings
    } catch (error) {
      console.error('Error fetching all holdings:', error)
      return {
        equities: [],
        mutualFunds: [],
      }
    }
  }
}

// Main portfolio aggregator
export class PortfolioAggregator {
  private smallcaseApi: SmallcaseAPI
  private coinSwitchApi: CoinSwitchAPI
  private wintWealthApi: WintWealthAPI
  private holdingsApi: UnifiedHoldingsAPI

  constructor(config: {
    smallcaseGatewayName: string
    smallcaseGatewaySecret: string
    smallcaseAuthToken: string
    coinSwitchApiKey: string
    coinSwitchApiSecret: string
    wintWealthApiKey: string
    casParserApiKey: string
  }) {
    this.smallcaseApi = new SmallcaseAPI({
      gatewayName: config.smallcaseGatewayName,
      gatewaySecret: config.smallcaseGatewaySecret,
      authToken: config.smallcaseAuthToken,
    })
    this.coinSwitchApi = new CoinSwitchAPI(config.coinSwitchApiKey, config.coinSwitchApiSecret)
    this.wintWealthApi = new WintWealthAPI(config.wintWealthApiKey)
    this.holdingsApi = new UnifiedHoldingsAPI({
      casParserApiKey: config.casParserApiKey,
    })
  }

  async getFullPortfolio(casFile?: Buffer, casPassword?: string): Promise<PortfolioData> {
    try {
      // Fetch data from all platforms in parallel
      const [smallcaseInvestments, smallcaseHoldings, crypto, bonds, holdingsData] = await Promise.all([
        this.smallcaseApi.getPortfolio(),
        this.smallcaseApi.getHoldings(true), // Include mutual funds
        this.coinSwitchApi.getPortfolio(),
        this.wintWealthApi.getPortfolio(),
        this.holdingsApi.getAllHoldings(casFile, casPassword),
      ])

      // Combine stocks from Smallcase investments, holdings, and CAS data
      const allStocks = [...smallcaseInvestments, ...smallcaseHoldings.stocks, ...holdingsData.equities]

      // Convert mutual funds to stock-like format for compatibility
      const holdingsMutualFunds: StockData[] = holdingsData.mutualFunds.map(mf => ({
        symbol: mf.isin || mf.schemeName.substring(0, 10),
        name: mf.schemeName,
        price: mf.nav,
        change: 0, // MF changes are typically not real-time
        changePercent: 0,
        value: mf.value,
      }))
      
      const smallcaseMutualFunds: StockData[] = smallcaseHoldings.mutualFunds.map(mf => ({
        symbol: mf.isin || mf.schemeName.substring(0, 10),
        name: mf.schemeName,
        price: mf.nav,
        change: 0, // MF changes are typically not real-time
        changePercent: 0,
        value: mf.value,
      }))

      const stocks = [...allStocks, ...holdingsMutualFunds, ...smallcaseMutualFunds]

      // Calculate totals
      const stocksTotal = stocks.reduce((sum, stock) => sum + stock.value, 0)
      const cryptoTotal = crypto.reduce((sum, coin) => sum + coin.value, 0)
      const bondsTotal = bonds.reduce((sum, bond) => sum + bond.value, 0)

      const totalValue = stocksTotal + cryptoTotal + bondsTotal

      // Calculate total change (mock calculation)
      const totalChange =
        stocks.reduce((sum, stock) => sum + (stock.change * stock.value) / stock.price, 0) +
        crypto.reduce((sum, coin) => sum + (coin.change * coin.value) / coin.price, 0)

      const totalChangePercent = totalValue > 0 ? (totalChange / totalValue) * 100 : 0

      return {
        stocks,
        crypto,
        bonds,
        totalValue,
        totalChange,
        totalChangePercent,
      }
    } catch (error) {
      console.error('Error aggregating portfolio data:', error)

      // Return mock data on error
      return {
        stocks: [],
        crypto: [],
        bonds: [],
        totalValue: 1000000,
        totalChange: 25000,
        totalChangePercent: 2.5,
      }
    }
  }
}

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Helper function to format percentage
export const formatPercentage = (percent: number): string => {
  const sign = percent >= 0 ? '+' : ''
  return `${sign}${percent.toFixed(2)}%`
}

// Environment configuration - simplified for personal dashboard
export const getApiConfig = () => ({
  // Smallcase Gateway - use your personal connected user token
  smallcaseGatewayName: process.env.SMALLCASE_GATEWAY_NAME || 'gatewaydemo',
  smallcaseGatewaySecret: process.env.SMALLCASE_GATEWAY_SECRET || 'gatewayDemo_secret',
  smallcaseAuthToken: process.env.SMALLCASE_AUTH_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzbWFsbGNhc2VBdXRoSWQiOiI2MzFmYWQwMWQ5ZmU3YmEzNGI2YzBhM2EiLCJleHAiOjE5MDAwMDAwMDB9.-_6ykYyKke4xuKImlYEPTX9fJhLoMU86qMHRX0YY6eA',
  
  // Other platform APIs
  coinSwitchApiKey: process.env.COINSWITCH_API_KEY || 'mock-key',
  coinSwitchApiSecret: process.env.COINSWITCH_API_SECRET || 'mock-secret',
  wintWealthApiKey: process.env.WINT_WEALTH_API_KEY || 'mock-key',
  casParserApiKey: process.env.CAS_PARSER_API_KEY || 'mock-key',
})
