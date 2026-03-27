from rest_framework import serializers
from .models import ParticipantSession, BlockResponse, HeatmapEvent, RecordingChunk


class SessionStartSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParticipantSession
        fields = [
            'device_type', 'browser', 'os',
            'screen_width', 'screen_height', 'user_agent',
        ]


class ConsentSerializer(serializers.Serializer):
    screen_recording = serializers.BooleanField(default=False)
    camera = serializers.BooleanField(default=False)
    audio = serializers.BooleanField(default=False)


class BlockResponseSerializer(serializers.ModelSerializer):
    block_id = serializers.UUIDField(source='block.id', read_only=True)

    class Meta:
        model = BlockResponse
        fields = [
            'id', 'block_id', 'task_completed', 'task_completion_status',
            'answer', 'time_spent_seconds', 'recording_url',
            'recording_start_offset', 'recording_end_offset', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class BlockResponseWriteSerializer(serializers.ModelSerializer):
    block_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = BlockResponse
        fields = [
            'block_id', 'task_completed', 'task_completion_status',
            'answer', 'time_spent_seconds',
            'recording_start_offset', 'recording_end_offset',
        ]


class HeatmapEventSerializer(serializers.ModelSerializer):
    block_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = HeatmapEvent
        fields = [
            'block_id', 'event_type', 'x', 'y', 'scroll_y',
            'element_selector', 'element_text', 'timestamp_offset',
        ]


class SessionDetailSerializer(serializers.ModelSerializer):
    responses = BlockResponseSerializer(many=True, read_only=True)
    duration_seconds = serializers.IntegerField(read_only=True)

    class Meta:
        model = ParticipantSession
        fields = [
            'id', 'participant_token', 'device_type', 'browser', 'os',
            'screen_width', 'screen_height', 'variant_assigned',
            'consent_screen_recording', 'consent_camera', 'consent_audio',
            'consent_given_at', 'current_block_index', 'completed',
            'started_at', 'completed_at', 'duration_seconds', 'responses',
        ]
        read_only_fields = ['id', 'participant_token', 'started_at']
