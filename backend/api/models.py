from django.db import models
from django.utils import timezone


class NewsItem(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    date_published = models.DateField()
    source = models.CharField(max_length=100)

    def __str__(self):
        return self.title


class EducationalArticle(models.Model):
    title = models.CharField(max_length=255)
    markdown_content = models.TextField()
    category = models.CharField(max_length=100)

    def __str__(self):
        return self.title


class QAEntry(models.Model):
    """Kenyan-focused investment Q&A entries."""
    question = models.CharField(max_length=500)
    answer = models.TextField()
    category = models.CharField(max_length=100, default='General')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
        verbose_name = 'Q&A Entry'
        verbose_name_plural = 'Q&A Entries'

    def __str__(self):
        return self.question


class UserProfile(models.Model):
    """Represents a user session with risk profile and cash balance."""
    RISK_CHOICES = [
        ('CONSERVATIVE', 'Conservative'),
        ('MODERATE', 'Moderate'),
        ('AGGRESSIVE', 'Aggressive'),
    ]

    session_id = models.CharField(max_length=64, unique=True, db_index=True)
    risk_profile = models.CharField(
        max_length=20, choices=RISK_CHOICES, null=True, blank=True
    )
    cash_balance = models.DecimalField(
        max_digits=15, decimal_places=2, default=10000.00
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"User {self.session_id[:8]}... ({self.risk_profile or 'Unassessed'})"


class Portfolio(models.Model):
    """One-to-one portfolio linked to a user profile."""
    user = models.OneToOneField(
        UserProfile, on_delete=models.CASCADE, related_name='portfolio'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Portfolio for {self.user.session_id[:8]}..."


class AssetHolding(models.Model):
    """Tracks quantity and cost basis of a specific ticker in a portfolio."""
    portfolio = models.ForeignKey(
        Portfolio, on_delete=models.CASCADE, related_name='holdings'
    )
    ticker = models.CharField(max_length=10)
    quantity = models.DecimalField(max_digits=15, decimal_places=6, default=0)
    avg_cost_basis = models.DecimalField(max_digits=15, decimal_places=4, default=0)

    class Meta:
        unique_together = ('portfolio', 'ticker')

    def __str__(self):
        return f"{self.ticker}: {self.quantity} shares"


class Transaction(models.Model):
    """Records individual buy/sell transactions."""
    ACTION_CHOICES = [
        ('BUY', 'Buy'),
        ('SELL', 'Sell'),
    ]

    portfolio = models.ForeignKey(
        Portfolio, on_delete=models.CASCADE, related_name='transactions'
    )
    ticker = models.CharField(max_length=10)
    action = models.CharField(max_length=4, choices=ACTION_CHOICES)
    quantity = models.DecimalField(max_digits=15, decimal_places=6)
    price_per_share = models.DecimalField(max_digits=15, decimal_places=4)
    total_cost = models.DecimalField(max_digits=15, decimal_places=2)
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} {self.quantity} {self.ticker} @ ${self.price_per_share}"


class MarketDataCache(models.Model):
    """Stores cached FMP API raw responses to protect rate limits."""
    cache_key = models.CharField(max_length=255, unique=True, db_index=True)
    response_blob = models.JSONField()
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'market_data_cache'
        verbose_name = 'Market Data Cache'
        verbose_name_plural = 'Market Data Caches'

    def __str__(self):
        return f"Cache: {self.cache_key}"