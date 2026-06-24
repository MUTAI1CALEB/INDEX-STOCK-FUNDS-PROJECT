from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NewsItemViewSet, EducationalArticleViewSet

router = DefaultRouter()
router.register(r'news', NewsItemViewSet)
router.register(r'articles', EducationalArticleViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
