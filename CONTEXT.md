# StocksX Market Information

StocksX, branded as StoxLyz in the application, helps retail investors explore the Indonesian stock market.

## Language

**Account**:
A person's registered identity for access to StocksX, identified by an email address and associated with a profile and role.
_Avoid_: Cloudflare account, stock holding

**Profile**:
The name, email address, role, and optional avatar shown for an account in StocksX.
_Avoid_: identity-provider user

**User**:
An account with access to standard market-information features.
_Avoid_: admin, superadmin

**Admin**:
An account with access to the administrative view in addition to standard market-information features.
_Avoid_: superadmin

**Superadmin**:
An account with elevated administrative privileges beyond the admin role.
_Avoid_: owner of the Cloudflare hosting account

**Dashboard**:
The authenticated market overview where investors start exploring stock prices, market movements, and related information.
_Avoid_: landing page

**Ownership record**:
Information about an investor's reported ownership percentage in an Indonesian listed stock, including its confidence and optional notes.
_Avoid_: StocksX account ownership, watchlist item

**Watchlist**:
A collection of stock tickers an investor chooses to follow.
_Avoid_: holdings, portfolio

**Price alert**:
An investor's chosen stock-price threshold and notification condition.
_Avoid_: trading order
