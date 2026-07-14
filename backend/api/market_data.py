"""
Financial Modeling Prep (FMP) API Client with caching and graceful fallbacks.

All external market data flows through this module. If the FMP API key is
missing or rate-limited, hardcoded structural fallback data ensures the
application never crashes during a live presentation.
"""
import json
import logging
from datetime import datetime, timedelta
from decimal import Decimal

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# FALLBACK DATA — Structural defaults when API is unavailable
# ──────────────────────────────────────────────────────────────────────────────

FALLBACK_QUOTES = {
    "AAPL":  {"symbol": "AAPL",  "name": "Apple Inc.",               "price": 195.89, "changesPercentage": 0.52,  "change": 1.01, "marketCap": 3040000000000, "volume": 54230000},
    "MSFT":  {"symbol": "MSFT",  "name": "Microsoft Corporation",    "price": 430.16, "changesPercentage": 0.34,  "change": 1.46, "marketCap": 3200000000000, "volume": 22100000},
    "GOOGL": {"symbol": "GOOGL", "name": "Alphabet Inc.",            "price": 176.42, "changesPercentage": -0.18, "change": -0.32, "marketCap": 2180000000000, "volume": 26800000},
    "AMZN":  {"symbol": "AMZN",  "name": "Amazon.com Inc.",          "price": 187.34, "changesPercentage": 0.91,  "change": 1.69, "marketCap": 1950000000000, "volume": 48600000},
    "TSLA":  {"symbol": "TSLA",  "name": "Tesla Inc.",               "price": 248.52, "changesPercentage": -1.23, "change": -3.10, "marketCap": 790000000000,  "volume": 112000000},
    "VOO":   {"symbol": "VOO",   "name": "Vanguard S&P 500 ETF",     "price": 502.18, "changesPercentage": 0.22,  "change": 1.10, "marketCap": 0,              "volume": 4200000},
    "SPY":   {"symbol": "SPY",   "name": "SPDR S&P 500 ETF Trust",   "price": 545.30, "changesPercentage": 0.19,  "change": 1.04, "marketCap": 0,              "volume": 62000000},
    "V":     {"symbol": "V",     "name": "Visa Inc.",                 "price": 278.65, "changesPercentage": 0.41,  "change": 1.14, "marketCap": 570000000000,  "volume": 7900000},
    "JPM":   {"symbol": "JPM",   "name": "JPMorgan Chase & Co.",     "price": 196.82, "changesPercentage": 0.63,  "change": 1.23, "marketCap": 570000000000,  "volume": 9800000},
    "KO":    {"symbol": "KO",    "name": "The Coca-Cola Company",    "price": 63.45,  "changesPercentage": -0.07, "change": -0.04, "marketCap": 274000000000,  "volume": 12500000},
}

FALLBACK_DIVIDENDS = {
    "AAPL":  {"symbol": "AAPL",  "annualDividend": 0.96,  "dividendYield": 0.0049},
    "MSFT":  {"symbol": "MSFT",  "annualDividend": 3.00,  "dividendYield": 0.0070},
    "GOOGL": {"symbol": "GOOGL", "annualDividend": 0.80,  "dividendYield": 0.0045},
    "AMZN":  {"symbol": "AMZN",  "annualDividend": 0.00,  "dividendYield": 0.0000},
    "TSLA":  {"symbol": "TSLA",  "annualDividend": 0.00,  "dividendYield": 0.0000},
    "VOO":   {"symbol": "VOO",   "annualDividend": 6.70,  "dividendYield": 0.0133},
    "SPY":   {"symbol": "SPY",   "annualDividend": 6.80,  "dividendYield": 0.0125},
    "V":     {"symbol": "V",     "annualDividend": 2.08,  "dividendYield": 0.0075},
    "JPM":   {"symbol": "JPM",   "annualDividend": 4.60,  "dividendYield": 0.0234},
    "KO":    {"symbol": "KO",    "annualDividend": 1.94,  "dividendYield": 0.0306},
}

FALLBACK_NEWS = [
    {
        "title": "S&P 500 Reaches New All-Time Highs Amid Strong Earnings",
        "text": "The S&P 500 index closed at new record levels as major tech companies reported better-than-expected quarterly earnings, boosting investor sentiment across global markets.",
        "publishedDate": "2026-06-23T08:00:00.000Z",
        "site": "Market Watch",
        "url": "#",
        "image": "",
    },
    {
        "title": "Federal Reserve Signals Steady Rate Path Through Q3",
        "text": "The Federal Reserve indicated it would maintain current interest rates through the third quarter, citing balanced inflation data and resilient labor market conditions.",
        "publishedDate": "2026-06-22T14:30:00.000Z",
        "site": "Reuters",
        "url": "#",
        "image": "",
    },
    {
        "title": "Tech Sector Leads Global Markets Higher",
        "text": "Technology stocks continue to outperform as AI-driven revenue growth accelerates across the sector. Apple, Microsoft, and Alphabet all posted gains.",
        "publishedDate": "2026-06-21T10:15:00.000Z",
        "site": "Bloomberg",
        "url": "#",
        "image": "",
    },
    {
        "title": "Emerging Market Currencies Stabilize Against USD",
        "text": "Several emerging market currencies, including the Kenyan Shilling, have shown stabilization against the US Dollar following IMF policy guidance updates.",
        "publishedDate": "2026-06-20T16:45:00.000Z",
        "site": "Financial Times",
        "url": "#",
        "image": "",
    },
    {
        "title": "Dividend Aristocrats Continue Strong 2026 Performance",
        "text": "Companies with 25+ years of consecutive dividend increases are outperforming growth benchmarks year-to-date, attracting income-focused investors.",
        "publishedDate": "2026-06-19T09:00:00.000Z",
        "site": "Seeking Alpha",
        "url": "#",
        "image": "",
    },
]

# Cache TTLs (seconds)
QUOTE_CACHE_TTL = 300       # 5 minutes
HISTORICAL_CACHE_TTL = 1800  # 30 minutes
DIVIDEND_CACHE_TTL = 1800    # 30 minutes
NEWS_CACHE_TTL = 600         # 10 minutes

FMP_BASE_URL = "https://financialmodelingprep.com/api/v3"


class FMPClient:
    """
    Client for the Financial Modeling Prep API with built-in caching
    and graceful fallback to Yahoo Finance / hardcoded data on failure.
    """

    def __init__(self):
        self.api_key = settings.FMP_API_KEY
        self.base_url = FMP_BASE_URL

    def _has_api_key(self):
        return bool(self.api_key)

    def _make_request(self, endpoint, params=None):
        """Make a request to FMP API. Returns parsed JSON or None on failure."""
        if not self._has_api_key():
            logger.warning("FMP API key not configured — using fallback data")
            return None

        if params is None:
            params = {}
        params['apikey'] = self.api_key

        try:
            url = f"{self.base_url}/{endpoint}"
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            # FMP returns error messages in JSON when rate-limited
            if isinstance(data, dict) and 'Error Message' in data:
                logger.warning("FMP API error: %s", data['Error Message'])
                return None

            return data
        except requests.RequestException as e:
            logger.warning("FMP API request failed: %s", str(e))
            return None

    # ──────────────────────────────────────────────────────────────────────
    # YAHOO FINANCE SCRAPER HELPERS (KEYLESS LIVE FALLBACKS)
    # ──────────────────────────────────────────────────────────────────────

    def _get_yahoo_quotes(self, tickers):
        """Scrape quotes from Yahoo Finance chart endpoint as metadata."""
        import concurrent.futures
        result = {}
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        
        def fetch_quote(ticker):
            try:
                url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
                r = requests.get(url, params={"range": "1d"}, headers=headers, timeout=5)
                if r.status_code == 200:
                    data = r.json()
                    res = data.get("chart", {}).get("result", [{}])[0]
                    meta = res.get("meta", {})
                    price = float(meta.get("regularMarketPrice", 0))
                    prev_close = float(meta.get("previousClose", meta.get("chartPreviousClose", price)))
                    change = price - prev_close
                    change_pct = (change / prev_close * 100) if prev_close > 0 else 0.0
                    
                    return ticker, {
                        'symbol': ticker,
                        'name': meta.get('longName', meta.get('shortName', ticker)),
                        'price': price,
                        'changesPercentage': change_pct,
                        'change': change,
                        'marketCap': meta.get('marketCap', 0),
                        'volume': meta.get('regularMarketVolume', 0),
                    }
            except Exception as e:
                logger.warning("Yahoo Finance fallback failed for %s: %s", ticker, str(e))
            return ticker, None

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = {executor.submit(fetch_quote, t): t for t in tickers}
            for future in concurrent.futures.as_completed(futures):
                ticker, data = future.result()
                if data:
                    result[ticker] = data

        return result

    def _get_yahoo_historical(self, ticker, days=90):
        """Fetch historical price list from Yahoo Finance chart endpoint."""
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        try:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
            r = requests.get(url, params={"range": f"{days}d", "interval": "1d"}, headers=headers, timeout=5)
            if r.status_code == 200:
                data = r.json()
                res = data.get("chart", {}).get("result", [{}])[0]
                timestamps = res.get("timestamp", [])
                closes = res.get("indicators", {}).get("quote", [{}])[0].get("close", [])
                history = []
                for ts, val in zip(timestamps, closes):
                    if val is not None:
                        date_str = datetime.fromtimestamp(ts).strftime('%Y-%m-%d')
                        history.append({"date": date_str, "close": round(float(val), 2)})
                return history
        except Exception as e:
            logger.warning("Yahoo Finance historical fallback failed for %s: %s", ticker, str(e))
        return None

    def _get_yahoo_news(self, limit=15):
        """Scrape news from Yahoo Finance search endpoint."""
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        try:
            url = "https://query2.finance.yahoo.com/v1/finance/search"
            r = requests.get(url, params={"q": "market stocks", "newsCount": limit}, headers=headers, timeout=5)
            if r.status_code == 200:
                data = r.json()
                news_list = data.get("news", [])
                results = []
                for item in news_list[:limit]:
                    ts = item.get("providerPublishTime", 0)
                    date_str = datetime.fromtimestamp(ts).strftime('%Y-%m-%dT%H:%M:%SZ') if ts else ""
                    results.append({
                        'title': item.get('title', ''),
                        'text': f"Published by {item.get('publisher', 'Yahoo Finance')}.",
                        'publishedDate': date_str,
                        'site': item.get('publisher', 'Yahoo Finance'),
                        'url': item.get('link', '#'),
                        'image': '',
                    })
                return results
        except Exception as e:
            logger.warning("Yahoo Finance news fallback failed: %s", str(e))
        return None

    # ──────────────────────────────────────────────────────────────────────
    # QUOTES
    # ──────────────────────────────────────────────────────────────────────

    def get_batch_quotes(self, tickers=["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "VOO", "SPY", "V", "JPM", "KO"]):
        """
        Fetch real-time quotes for the curated tickers.
        Returns a dict of {ticker: quote_data}.
        """
        if tickers is None:
            tickers = settings.CURATED_TICKERS

        cache_key = f"fmp_quotes_{'_'.join(sorted(tickers))}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        # Attempt FMP request if key is available
        if self._has_api_key():
            symbols = ','.join(tickers)
            data = self._make_request(f"quote/{symbols}")
            if data and isinstance(data, list) and len(data) > 0:
                result = {}
                for item in data:
                    result[item['symbol']] = {
                        'symbol': item.get('symbol', ''),
                        'name': item.get('name', ''),
                        'price': float(item.get('price', 0)),
                        'changesPercentage': float(item.get('changesPercentage', 0)),
                        'change': float(item.get('change', 0)),
                        'marketCap': item.get('marketCap', 0),
                        'volume': item.get('volume', 0),
                    }
                cache.set(cache_key, result, QUOTE_CACHE_TTL)
                return result

        # Yahoo Finance fallback
        logger.info("Attempting Yahoo Finance quotes fallback for: %s", tickers)
        yahoo_data = self._get_yahoo_quotes(tickers)
        if yahoo_data:
            # fill in missing tickers from static fallback if necessary
            for t in tickers:
                if t not in yahoo_data and t in FALLBACK_QUOTES:
                    yahoo_data[t] = FALLBACK_QUOTES[t]
            cache.set(cache_key, yahoo_data, QUOTE_CACHE_TTL)
            return yahoo_data

        # Static fallback
        logger.info("Using hardcoded fallback quote data for tickers: %s", tickers)
        fallback = {t: FALLBACK_QUOTES[t] for t in tickers if t in FALLBACK_QUOTES}
        return fallback

    def get_quote(self, ticker):
        """Fetch a single real-time quote."""
        quotes = self.get_batch_quotes([ticker])
        return quotes.get(ticker, FALLBACK_QUOTES.get(ticker, {}))

    # ──────────────────────────────────────────────────────────────────────
    # HISTORICAL PRICES
    # ──────────────────────────────────────────────────────────────────────

    def get_historical(self, ticker, days=90):
        """
        Fetch historical daily closing prices for a ticker.
        Returns a list of {date, close} dicts sorted oldest to newest.
        """
        cache_key = f"fmp_hist_{ticker}_{days}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        # Attempt FMP request if key is available
        if self._has_api_key():
            data = self._make_request(
                f"historical-price-full/{ticker}",
                params={"timeseries": days}
            )
            if data and 'historical' in data:
                history = [
                    {"date": item["date"], "close": float(item["close"])}
                    for item in data["historical"]
                ]
                history.reverse()  # oldest first
                cache.set(cache_key, history, HISTORICAL_CACHE_TTL)
                return history

        # Yahoo Finance fallback
        logger.info("Attempting Yahoo Finance historical fallback for %s", ticker)
        yahoo_hist = self._get_yahoo_historical(ticker, days)
        if yahoo_hist:
            cache.set(cache_key, yahoo_hist, HISTORICAL_CACHE_TTL)
            return yahoo_hist

        # Static fallback: generate synthetic historical data
        logger.info("Using fallback historical data for %s", ticker)
        base_price = FALLBACK_QUOTES.get(ticker, {}).get('price', 100)
        history = []
        import random
        random.seed(hash(ticker))
        price = base_price * 0.85
        for i in range(days):
            date = (datetime.now() - timedelta(days=days - i)).strftime('%Y-%m-%d')
            price = price * (1 + random.uniform(-0.02, 0.025))
            history.append({"date": date, "close": round(price, 2)})
        return history

    # ──────────────────────────────────────────────────────────────────────
    # DIVIDENDS
    # ──────────────────────────────────────────────────────────────────────

    def get_dividend_info(self, ticker):
        """
        Fetch TTM dividend data for a ticker.
        Returns {symbol, annualDividend, dividendYield}.
        """
        cache_key = f"fmp_div_{ticker}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        # Attempt FMP request if key is available
        if self._has_api_key():
            data = self._make_request(
                f"key-metrics-ttm/{ticker}"
            )
            if data and isinstance(data, list) and len(data) > 0:
                metrics = data[0]
                result = {
                    'symbol': ticker,
                    'annualDividend': float(metrics.get('dividendPerShareTTM', 0) or 0),
                    'dividendYield': float(metrics.get('dividendYieldTTM', 0) or 0),
                }
                cache.set(cache_key, result, DIVIDEND_CACHE_TTL)
                return result

        # Fallback (calculate dynamically using static annual dividend and current live price)
        logger.info("Using fallback dividend data for %s", ticker)
        fb = FALLBACK_DIVIDENDS.get(ticker, {
            'symbol': ticker,
            'annualDividend': 0.0,
            'dividendYield': 0.0,
        }).copy()
        
        quote = self.get_quote(ticker)
        if quote and quote.get('price', 0) > 0:
            fb['dividendYield'] = fb['annualDividend'] / quote['price']
            
        cache.set(cache_key, fb, DIVIDEND_CACHE_TTL)
        return fb

    # ──────────────────────────────────────────────────────────────────────
    # MARKET NEWS
    # ──────────────────────────────────────────────────────────────────────

    def get_market_news(self, limit=15):
        """
        Fetch latest market news articles.
        Returns a list of news item dicts.
        """
        cache_key = "fmp_news"
        cached = cache.get(cache_key)
        if cached:
            return cached

        # Attempt FMP request if key is available
        if self._has_api_key():
            data = self._make_request("stock_news", params={"limit": limit})
            if data and isinstance(data, list) and len(data) > 0:
                news = [
                    {
                        'title': item.get('title', ''),
                        'text': item.get('text', ''),
                        'publishedDate': item.get('publishedDate', ''),
                        'site': item.get('site', ''),
                        'url': item.get('url', '#'),
                        'image': item.get('image', ''),
                    }
                    for item in data
                ]
                cache.set(cache_key, news, NEWS_CACHE_TTL)
                return news

        # Yahoo Finance fallback
        logger.info("Attempting Yahoo Finance news fallback")
        yahoo_news = self._get_yahoo_news(limit)
        if yahoo_news:
            cache.set(cache_key, yahoo_news, NEWS_CACHE_TTL)
            return yahoo_news

        # Fallback
        logger.info("Using hardcoded fallback news data")
        return FALLBACK_NEWS


# Singleton-like accessor
_client = None


def get_fmp_client():
    """Return a module-level FMPClient instance."""
    global _client
    if _client is None:
        _client = FMPClient()
    return _client
