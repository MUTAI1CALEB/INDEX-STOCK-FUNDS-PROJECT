from rest_framework import serializers
from .models import NewsItem, EducationalArticle

class NewsItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsItem
        fields = '__all__'

class EducationalArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationalArticle
        fields = '__all__'
