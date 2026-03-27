import uuid
from django.db import models
from django.conf import settings


class Study(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('closed', 'Closed'),
    ]
    DEVICE_CHOICES = [
        ('desktop', 'Desktop'),
        ('laptop', 'Laptop'),
        ('tablet', 'Tablet'),
        ('mobile', 'Mobile'),
        ('responsive', 'Fully Responsive'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='studies')
    title = models.CharField(max_length=255, default='Untitled Study')
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    device_target = models.CharField(max_length=20, choices=DEVICE_CHOICES, default='responsive')
    participant_token = models.UUIDField(unique=True, null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'studies'
        ordering = ['-updated_at']

    def __str__(self):
        return self.title

    @property
    def response_count(self):
        return self.sessions.filter(completed=True).count()

    @property
    def block_count(self):
        return self.blocks.count()


class Block(models.Model):
    BLOCK_TYPES = [
        ('intro', 'Intro Screen'),
        ('context', 'Context Screen'),
        ('task', 'Task / Mission'),
        ('question', 'Question'),
        ('followup', 'Follow-up Question'),
        ('thankyou', 'Thank-you Screen'),
        ('variant', 'Variant Comparison'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='blocks')
    type = models.CharField(max_length=20, choices=BLOCK_TYPES)
    order = models.PositiveIntegerField(default=0)
    content = models.JSONField(default=dict)       # All block-specific config
    media_assets = models.JSONField(default=list)  # [{url, type, name}]
    settings = models.JSONField(default=dict)
    variant_reference = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'blocks'
        ordering = ['order']

    def __str__(self):
        return f'{self.type} – {self.study.title}'


class MediaAsset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='media_assets')
    block = models.ForeignKey(Block, on_delete=models.SET_NULL, null=True, blank=True, related_name='uploaded_assets')
    file = models.FileField(upload_to='studies/%Y/%m/')
    file_type = models.CharField(max_length=20)  # image | video | gif
    original_name = models.CharField(max_length=255)
    file_size = models.PositiveBigIntegerField(default=0)
    url = models.URLField(blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'media_assets'
