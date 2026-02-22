export type Stock = {
  ticker: string
  name: string
  sector: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  pe: number
  pbv: number
  dividendYield: number
  high52w: number
  low52w: number
  about: string
}

// IDX-listed stocks (Yahoo Finance suffix: .JK)
export const TICKERS = [
  'BBCA.JK', 'BBRI.JK', 'BMRI.JK', 'TLKM.JK', 'ASII.JK',
  'BYAN.JK', 'UNVR.JK', 'ICBP.JK', 'KLBF.JK', 'HMSP.JK',
  'GOTO.JK', 'BBNI.JK', 'INDF.JK', 'SMGR.JK', 'MNCN.JK',
  'CPIN.JK', 'ADRO.JK', 'PTBA.JK', 'INKP.JK', 'EXCL.JK',
  'SIDO.JK', 'ACES.JK', 'MAPI.JK', 'PWON.JK', 'BSDE.JK',
  'JPFA.JK', 'TKIM.JK', 'SMRA.JK', 'INTP.JK', 'TBIG.JK',
]
