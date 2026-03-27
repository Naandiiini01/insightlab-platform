import uuid
from django.db import models
from insightlab.apps.studies.models import Study, Block


class ParticipantSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='sessions')
    participant_token = models.UUIDField(default=uuid.uuid4, unique=True)

    # Device info
    device_type = models.CharField(max_length=20, blank=True)
    browser = models.CharField(max_length=100, blank=True)
    os = models.CharField(max_length=100, blank=True)
    screen_width = models.PositiveIntegerField(null=True, blank=True)
    screen_height = models.PositiveIntegerField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    # Variant
    variant_assigned = models.CharField(max_length=100, blank=True)

    # Consent
    consent_screen_recording = models.BooleanField(default=False)
    consent_camera = models.BooleanField(default=False)
    consent_audio = models.BooleanField(default=False)
    consent_given_at = models.DateTimeField(null=True, blank=True)

    # Progress
    current_block_index = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)
    dropped_off_at_block = models.ForeignKey(
        Block, on_delete=models.SET_NULL, null=True, blank=True, related_name='dropoffs'
    )

    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_activity_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'participant_sessions'
        ordering = ['-started_at']

    def __str__(self):
        return f'Session {self.id} – {self.study.title}'

    @property
    def duration_seconds(self):
        if self.completed_at:
            return (self.completed_at - self.started_at).seconds
        return None


class BlockResponse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ParticipantSession, on_delete=models.CASCADE, related_name='responses')
    block = models.ForeignKey(Block, on_delete=models.CASCADE, related_name='responses')

    # Task-specific
    task_completed = models.BooleanField(null=True, blank=True)
    task_completion_status = models.CharField(
        max_length=20,
        choices=[('success', 'Success'), ('fail', 'Fail'), ('skip', 'Skip')],
        blank=True,
    )

    # Question answer (flexible JSON)
    answer = models.JSONField(null=True, blank=True)

    # Timing
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    time_spent_seconds = models.PositiveIntegerField(default=0)

    # Recording reference
    recording_url = models.URLField(blank=True)
    recording_start_offset = models.FloatField(null=True, blank=True)
    recording_end_offset = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'block_responses'
        ordering = ['created_at']
        unique_together = [['session', 'block']]


class HeatmapEvent(models.Model):
    EVENT_TYPES = [
        ('click', 'Click'),
        ('tap', 'Tap'),
        ('scroll', 'Scroll'),
        ('mousemove', 'Mouse Move'),
        ('rage_click', 'Rage Click'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ParticipantSession, on_delete=models.CASCADE, related_name='heatmap_events')
    block = models.ForeignKey(Block, on_delete=models.CASCADE, related_name='heatmap_events')
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)

    # Normalised coordinates (0.0–1.0 relative to viewport)
    x = models.FloatField()
    y = models.FloatField()
    scroll_y = models.FloatField(null=True, blank=True)

    # Element target
    element_selector = models.CharField(max_length=500, blank=True)
    element_text = models.CharField(max_length=255, blank=True)

    timestamp_offset = models.FloatField()   # seconds from block start
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'heatmap_events'
        indexes = [
            models.Index(fields=['session', 'block']),
            models.Index(fields=['block', 'event_type']),
        ]


class RecordingChunk(models.Model):
    """Stores individual uploaded recording blob references."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ParticipantSession, on_delete=models.CASCADE, related_name='recording_chunks')
    block = models.ForeignKey(Block, on_delete=models.SET_NULL, null=True, blank=True)
    recording_type = models.CharField(
        max_length=20,
        choices=[('screen', 'Screen'), ('camera', 'Camera'), ('audio', 'Audio')],
    )
    chunk_index = models.PositiveIntegerField(default=0)
    file = models.FileField(upload_to='recordings/%Y/%m/')
    url = models.URLField(blank=True)
    duration_seconds = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'recording_chunks'
        ordering = ['chunk_index']
