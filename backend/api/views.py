from decimal import Decimal

from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes

from .models import (
    NewsItem, EducationalArticle, QAEntry,
    UserProfile, Portfolio, AssetHolding, Transaction,
)
from .serializers import (
    NewsItemSerializer, EducationalArticleSerializer, QAEntrySerializer,
    QuizSubmissionSerializer, TradeSerializer, TransactionSerializer,
)
from .market_data import get_fmp_client


# ── Existing ViewSets (preserved) ───────────────────────────────────────

class NewsItemViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NewsItem.objects.all().order_by('-date_published')
    serializer_class = NewsItemSerializer


class EducationalArticleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EducationalArticle.objects.all()
    serializer_class = EducationalArticleSerializer


# ── Helper: get or create user profile from middleware session ID ────────

def _get_or_create_user(request):
    """
    Uses the session_id attached by SessionIDMiddleware to find or create
    a UserProfile and associated Portfolio.
    """
    session_id = getattr(request, 'session_id', None)
    if not session_id:
        return None, None

    user, created = UserProfile.objects.get_or_create(
        session_id=session_id,
        defaults={'cash_balance': Decimal('10000.00')}
    )
    if created or not hasattr(user, 'portfolio'):
        Portfolio.objects.get_or_create(user=user)

    return user, user.portfolio


# ── Risk Advisor Quiz ───────────────────────────────────────────────────

RISK_ALLOCATION = {
    'CONSERVATIVE': {
        'label': 'Conservative',
        'description': 'Focus on capital preservation with stable, dividend-paying assets.',
        'allocation': [
            {'name': 'Bonds & Fixed Income', 'value': 50, 'color': '#3b82f6'},
            {'name': 'Blue-Chip Stocks', 'value': 25, 'color': '#6366f1'},
            {'name': 'Index Funds (VOO/SPY)', 'value': 15, 'color': '#8b5cf6'},
            {'name': 'Cash Reserve', 'value': 10, 'color': '#a78bfa'},
        ],
        'suggested_tickers': ['KO', 'JPM', 'V', 'VOO'],
    },
    'MODERATE': {
        'label': 'Moderate',
        'description': 'Balanced growth with diversified exposure across sectors.',
        'allocation': [
            {'name': 'Growth Stocks', 'value': 35, 'color': '#3b82f6'},
            {'name': 'Index Funds (VOO/SPY)', 'value': 30, 'color': '#6366f1'},
            {'name': 'Blue-Chip Dividend', 'value': 25, 'color': '#8b5cf6'},
            {'name': 'Cash Reserve', 'value': 10, 'color': '#a78bfa'},
        ],
        'suggested_tickers': ['AAPL', 'MSFT', 'VOO', 'JPM', 'V'],
    },
    'AGGRESSIVE': {
        'label': 'Aggressive',
        'description': 'High-growth strategy targeting maximum capital appreciation.',
        'allocation': [
            {'name': 'High-Growth Tech', 'value': 45, 'color': '#3b82f6'},
            {'name': 'Growth Stocks', 'value': 30, 'color': '#6366f1'},
            {'name': 'Index Funds (SPY)', 'value': 20, 'color': '#8b5cf6'},
            {'name': 'Cash Reserve', 'value': 5, 'color': '#a78bfa'},
        ],
        'suggested_tickers': ['TSLA', 'AMZN', 'GOOGL', 'AAPL', 'MSFT'],
    },
}


def _compute_risk_profile(timeline, volatility_response, income_source):
    """
    Score-based risk classification from quiz answers.
    Each answer contributes points; total determines profile.
    """
    score = 0

    # Timeline scoring
    if timeline == 'long':
        score += 3
    elif timeline == 'medium':
        score += 2
    else:
        score += 1

    # Volatility response scoring
    if volatility_response == 'buy_more':
        score += 3
    elif volatility_response == 'hold':
        score += 2
    else:
        score += 1

    # Income source scoring (international = more USD exposure tolerance)
    if income_source == 'international':
        score += 3
    elif income_source == 'mixed':
        score += 2
    else:
        score += 1

    # Classify
    if score >= 7:
        return 'AGGRESSIVE'
    elif score >= 5:
        return 'MODERATE'
    else:
        return 'CONSERVATIVE'

@extend_schema(
    summary="Submit Onboarding Quiz",
    request=QuizSubmissionSerializer,
    responses={200: OpenApiTypes.OBJECT}
    )
@api_view(['POST'])
def quiz_view(request):
    """
    POST /api/onboarding/quiz/
    Accepts quiz answers, computes risk profile, returns allocation.
    """
    serializer = QuizSubmissionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    profile = _compute_risk_profile(
        data['timeline'],
        data['volatility_response'],
        data['income_source'],
    )

    # Save to user profile
    user, portfolio = _get_or_create_user(request)
    if user:
        user.risk_profile = profile
        user.save(update_fields=['risk_profile'])

    allocation_data = RISK_ALLOCATION[profile]

    return Response({
        'risk_profile': profile,
        'label': allocation_data['label'],
        'description': allocation_data['description'],
        'allocation': allocation_data['allocation'],
        'suggested_tickers': allocation_data['suggested_tickers'],
    })


# ── Portfolio Dashboard ─────────────────────────────────────────────────

@api_view(['GET'])
def dashboard_view(request):
    """
    GET /api/portfolio/dashboard/
    Returns full portfolio summary with real-time valuations.
    """
    user, portfolio = _get_or_create_user(request)
    if not user:
        return Response({'error': 'Session not found'}, status=400)

    fmp = get_fmp_client()
    holdings = portfolio.holdings.all()

    # Fetch quotes for held tickers
    held_tickers = [h.ticker for h in holdings]
    all_quotes = fmp.get_batch_quotes()

    # Build holdings with live prices
    holdings_data = []
    total_invested = Decimal('0')
    total_market_value = Decimal('0')

    for holding in holdings:
        if holding.quantity <= 0:
            continue
        quote = all_quotes.get(holding.ticker, {})
        current_price = Decimal(str(quote.get('price', 0)))
        market_value = holding.quantity * current_price
        cost_basis_total = holding.quantity * holding.avg_cost_basis
        gain_loss = market_value - cost_basis_total
        gain_loss_pct = (
            (gain_loss / cost_basis_total * 100) if cost_basis_total > 0 else Decimal('0')
        )

        total_invested += cost_basis_total
        total_market_value += market_value

        holdings_data.append({
            'ticker': holding.ticker,
            'name': quote.get('name', holding.ticker),
            'quantity': float(holding.quantity),
            'avg_cost_basis': float(holding.avg_cost_basis),
            'current_price': float(current_price),
            'market_value': float(market_value),
            'gain_loss': float(gain_loss),
            'gain_loss_pct': float(gain_loss_pct),
        })

    total_portfolio_value = user.cash_balance + total_market_value
    total_gain_loss = total_market_value - total_invested

    # Recent transactions
    recent_transactions = portfolio.transactions.all()[:20]
    transactions_data = TransactionSerializer(recent_transactions, many=True).data

    return Response({
        'cash_balance': float(user.cash_balance),
        'total_invested': float(total_invested),
        'total_market_value': float(total_market_value),
        'total_portfolio_value': float(total_portfolio_value),
        'total_gain_loss': float(total_gain_loss),
        'total_gain_loss_pct': float(
            (total_gain_loss / total_invested * 100) if total_invested > 0 else 0
        ),
        'risk_profile': user.risk_profile,
        'holdings': holdings_data,
        'transactions': transactions_data,
    })


# ── Trade Execution ─────────────────────────────────────────────────────

@extend_schema(
    summary="Simulates BUY or SELL",
    request=TradeSerializer,
    responses=TradeSerializer)
@api_view(['POST'])
def trade_view(request):
    """
    POST /api/portfolio/trade/
    Executes a simulated BUY or SELL at the current real-time price.
    """
    serializer = TradeSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    ticker = data['ticker'].upper()
    action = data['action']
    quantity = data['quantity']

    # Tickers are now unrestricted to allow trading any asset.

    user, portfolio = _get_or_create_user(request)
    if not user:
        return Response({'error': 'Session not found'}, status=400)

    # Fetch real-time price
    fmp = get_fmp_client()
    quote = fmp.get_quote(ticker)
    price = Decimal(str(quote.get('price', 0)))

    if price <= 0:
        return Response(
            {'error': 'Unable to fetch current price. Please try again.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    total_cost = price * quantity

    if action == 'BUY':
        # Check sufficient cash
        if total_cost > user.cash_balance:
            return Response(
                {
                    'error': 'Insufficient funds.',
                    'required': float(total_cost),
                    'available': float(user.cash_balance),
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Deduct cash
        user.cash_balance -= total_cost
        user.save(update_fields=['cash_balance'])

        # Update or create holding
        holding, created = AssetHolding.objects.get_or_create(
            portfolio=portfolio, ticker=ticker,
            defaults={'quantity': Decimal('0'), 'avg_cost_basis': Decimal('0')}
        )

        # Recalculate average cost basis
        old_total = holding.quantity * holding.avg_cost_basis
        new_total = old_total + total_cost
        holding.quantity += quantity
        holding.avg_cost_basis = new_total / holding.quantity if holding.quantity > 0 else Decimal('0')
        holding.save()

    elif action == 'SELL':
        # Check sufficient shares
        try:
            holding = AssetHolding.objects.get(portfolio=portfolio, ticker=ticker)
        except AssetHolding.DoesNotExist:
            return Response(
                {'error': f'You do not hold any {ticker} shares.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity > holding.quantity:
            return Response(
                {
                    'error': 'Insufficient shares.',
                    'requested': float(quantity),
                    'available': float(holding.quantity),
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Credit cash
        user.cash_balance += total_cost
        user.save(update_fields=['cash_balance'])

        # Reduce holding
        holding.quantity -= quantity
        if holding.quantity <= 0:
            holding.delete()
        else:
            holding.save()

    # Record transaction
    Transaction.objects.create(
        portfolio=portfolio,
        ticker=ticker,
        action=action,
        quantity=quantity,
        price_per_share=price,
        total_cost=total_cost,
    )

    return Response({
        'message': f'{action} {float(quantity)} shares of {ticker} at ${float(price):.2f}',
        'ticker': ticker,
        'action': action,
        'quantity': float(quantity),
        'price_per_share': float(price),
        'total_cost': float(total_cost),
        'new_cash_balance': float(user.cash_balance),
    })


# ── Market Quotes ───────────────────────────────────────────────────────

@api_view(['GET'])
def quotes_view(request):
    """GET /api/market/quotes/ — Returns live quotes."""
    fmp = get_fmp_client()
    tickers_param = request.query_params.get('tickers', '')
    if tickers_param:
        tickers = [t.strip().upper() for t in tickers_param.split(',') if t.strip()]
        quotes = fmp.get_batch_quotes(tickers)
    else:
        quotes = fmp.get_batch_quotes()
    return Response(list(quotes.values()))


# ── Historical Prices ───────────────────────────────────────────────────

@api_view(['GET'])
def historical_view(request, ticker):
    """GET /api/market/historical/<ticker>/ — Returns daily price history."""
    ticker = ticker.upper()

    days = int(request.query_params.get('days', 90))
    fmp = get_fmp_client()
    history = fmp.get_historical(ticker, days=days)
    return Response(history)

@api_view(['GET'])
def bulk_historical_view(request):
    """GET /api/portfolio/history/ — Returns daily price history for multiple tickers."""
    tickers_param = request.query_params.get('tickers', '')
    if not tickers_param:
        return Response({'error': 'No tickers provided'}, status=400)
    
    tickers = [t.strip().upper() for t in tickers_param.split(',')]
    valid_tickers = tickers
    
    days = int(request.query_params.get('days', 90))
    fmp = get_fmp_client()
    histories = fmp.get_bulk_historical(valid_tickers, days=days)
    return Response(histories)


# ── Dividend Tracker ────────────────────────────────────────────────────

@api_view(['GET'])
def dividends_view(request):
    """
    GET /api/portfolio/dividends/
    Calculates estimated annual dividend income from user holdings.
    """
    user, portfolio = _get_or_create_user(request)
    if not user:
        return Response({'error': 'Session not found'}, status=400)

    fmp = get_fmp_client()
    holdings = portfolio.holdings.filter(quantity__gt=0)

    dividend_data = []
    total_annual_income = Decimal('0')

    for holding in holdings:
        div_info = fmp.get_dividend_info(holding.ticker)
        annual_div_per_share = Decimal(str(div_info.get('annualDividend', 0)))
        div_yield = float(div_info.get('dividendYield', 0))

        estimated_annual = holding.quantity * annual_div_per_share
        total_annual_income += estimated_annual

        quote = fmp.get_quote(holding.ticker)

        dividend_data.append({
            'ticker': holding.ticker,
            'name': quote.get('name', holding.ticker),
            'quantity': float(holding.quantity),
            'current_price': float(quote.get('price', 0)),
            'annual_dividend_per_share': float(annual_div_per_share),
            'dividend_yield': div_yield,
            'estimated_annual_income': float(estimated_annual),
        })

    return Response({
        'total_annual_dividend_income': float(total_annual_income),
        'holdings': dividend_data,
    })


# ── Live Market News ────────────────────────────────────────────────────

@api_view(['GET'])
def market_news_view(request):
    """GET /api/market/news/ — Returns live market news from FMP."""
    fmp = get_fmp_client()
    news = fmp.get_market_news()
    return Response(news)


# ── Kenyan Q&A Hub ──────────────────────────────────────────────────────

class QAEntryViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/qa/ — Returns Kenyan-focused investment Q&A entries."""
    queryset = QAEntry.objects.all()
    serializer_class = QAEntrySerializer
