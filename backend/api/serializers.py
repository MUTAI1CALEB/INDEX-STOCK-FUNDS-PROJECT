from decimal import Decimal
from rest_framework import serializers
from .models import (
    NewsItem, EducationalArticle, QAEntry,
    UserProfile, Portfolio, AssetHolding, Transaction,
)


class NewsItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsItem
        fields = '__all__'


class EducationalArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationalArticle
        fields = '__all__'


class QAEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = QAEntry
        fields = '__all__'


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'ticker', 'action', 'quantity', 'price_per_share', 'total_cost', 'timestamp']


class AssetHoldingSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetHolding
        fields = ['id', 'ticker', 'quantity', 'avg_cost_basis']


class PortfolioSerializer(serializers.ModelSerializer):
    holdings = AssetHoldingSerializer(many=True, read_only=True)
    transactions = TransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Portfolio
        fields = ['id', 'holdings', 'transactions', 'created_at']


class UserProfileSerializer(serializers.ModelSerializer):
    portfolio = PortfolioSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'session_id', 'risk_profile', 'cash_balance', 'portfolio', 'created_at']


# ── Request serializers (input validation) ──────────────────────────────

class QuizSubmissionSerializer(serializers.Serializer):
    """Validates the 3-question risk quiz submission."""
    timeline = serializers.ChoiceField(
        choices=['short', 'medium', 'long'],
        help_text="Investment timeline: short (<2y), medium (2-7y), long (7y+)"
    )
    volatility_response = serializers.ChoiceField(
        choices=['sell', 'hold', 'buy_more'],
        help_text="Response to 20% market drop: sell, hold, or buy_more"
    )
    income_source = serializers.ChoiceField(
        choices=['salary_ksh', 'mixed', 'international'],
        help_text="Primary income: salary_ksh (KES only), mixed, or international (USD/multi)"
    )


class TradeSerializer(serializers.Serializer):
    """Validates buy/sell trade requests."""
    ticker = serializers.CharField(max_length=10)
    action = serializers.ChoiceField(choices=['BUY', 'SELL'])
    quantity = serializers.DecimalField(max_digits=15, decimal_places=6, min_value=Decimal('0.000001'))
