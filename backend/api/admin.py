from django.contrib import admin
from .models import (
    NewsItem, EducationalArticle, QAEntry,
    UserProfile, Portfolio, AssetHolding, Transaction,
)

admin.site.register(NewsItem)
admin.site.register(EducationalArticle)
admin.site.register(QAEntry)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'risk_profile', 'cash_balance', 'created_at')
    list_filter = ('risk_profile',)


@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at')


@admin.register(AssetHolding)
class AssetHoldingAdmin(admin.ModelAdmin):
    list_display = ('portfolio', 'ticker', 'quantity', 'avg_cost_basis')
    list_filter = ('ticker',)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('portfolio', 'ticker', 'action', 'quantity', 'price_per_share', 'total_cost', 'timestamp')
    list_filter = ('action', 'ticker')
