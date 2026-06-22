from django.db import models

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
