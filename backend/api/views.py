from rest_framework import viewsets
from .models import NewsItem, EducationalArticle
from .serializers import NewsItemSerializer, EducationalArticleSerializer

class NewsItemViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NewsItem.objects.all().order_by('-date_published')
    serializer_class = NewsItemSerializer

class EducationalArticleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EducationalArticle.objects.all()
    serializer_class = EducationalArticleSerializer
