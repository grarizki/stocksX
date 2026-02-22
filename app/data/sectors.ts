export type Sector = {
  id: string
  name: string
  etfTicker: string
  change: number
  marketCap: string
  stockCount: number
}

// IDX sector indices (Yahoo Finance tickers)
export const SECTOR_ETFS: { id: string; name: string; etfTicker: string }[] = [
  { id: 'energy', name: 'Energy', etfTicker: 'IDXENERGY.JK' },
  { id: 'basic-materials', name: 'Basic Materials', etfTicker: 'IDXBASIC.JK' },
  { id: 'industrials', name: 'Industrials', etfTicker: 'IDXINDUST.JK' },
  { id: 'consumer-non-cyclicals', name: 'Consumer Non-Cyclicals', etfTicker: 'IDXNONCYC.JK' },
  { id: 'consumer-cyclicals', name: 'Consumer Cyclicals', etfTicker: 'IDXCYCLIC.JK' },
  { id: 'health-care', name: 'Health Care', etfTicker: 'IDXHEALTH.JK' },
  { id: 'financials', name: 'Financials', etfTicker: 'IDXFINANCE.JK' },
  { id: 'properties', name: 'Properties & Real Estate', etfTicker: 'IDXPROPERT.JK' },
  { id: 'technology', name: 'Technology', etfTicker: 'IDXTECHNO.JK' },
  { id: 'infrastructure', name: 'Infrastructure', etfTicker: 'IDXINFRA.JK' },
  { id: 'transportation', name: 'Transportation & Logistics', etfTicker: 'IDXTRANS.JK' },
]
