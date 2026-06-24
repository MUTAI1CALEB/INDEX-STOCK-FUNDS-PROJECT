from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NewsItemViewSet, EducationalArticleViewSet, QAEntryViewSet,
    quiz_view, dashboard_view, trade_view,
    quotes_view, historical_view, dividends_view,
    market_news_view,
)

router = DefaultRouter()
router.register(r'news', NewsItemViewSet)
router.register(r'articles', EducationalArticleViewSet)
router.register(r'qa', QAEntryViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Onboarding
    path('onboarding/quiz/', quiz_view, name='quiz'),
    # Portfolio
    path('portfolio/dashboard/', dashboard_view, name='dashboard'),
    path('portfolio/trade/', trade_view, name='trade'),
    path('portfolio/dividends/', dividends_view, name='dividends'),
    # Market data
    path('market/quotes/', quotes_view, name='quotes'),
    path('market/historical/<str:ticker>/', historical_view, name='historical'),
    path('market/news/', market_news_view, name='market-news'),
]
