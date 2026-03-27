import random
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from insightlab.apps.studies.models import Study, Block
from .models import ParticipantSession, BlockResponse, HeatmapEvent, RecordingChunk
from .serializers import (
    SessionStartSerializer, ConsentSerializer,
    BlockResponseWriteSerializer, BlockResponseSerializer,
    HeatmapEventSerializer, SessionDetailSerializer,
)


# ── Session lifecycle (public – no auth) ──────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def session_start(request, token):
    """Create a new participant session for a published study."""
    study = get_object_or_404(Study, participant_token=token, status='published')
    ser = SessionStartSerializer(data=request.data)
    ser.is_valid(raise_exception=True)

    # Assign variant if study has variant blocks
    variant_blocks = study.blocks.filter(type='variant')
    variant_assigned = ''
    if variant_blocks.exists():
        vb = variant_blocks.first()
        variants = vb.content.get('variants', [])
        if variants:
            variant_assigned = random.choice(variants).get('name', '')

    session = ParticipantSession.objects.create(
        study=study,
        variant_assigned=variant_assigned,
        **ser.validated_data,
    )
    return Response({
        'sessionId': str(session.id),
        'sessionToken': str(session.participant_token),
        'variantAssigned': variant_assigned,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def session_consent(request, session_token):
    """Record participant consent."""
    session = get_object_or_404(ParticipantSession, participant_token=session_token)
    ser = ConsentSerializer(data=request.data)
    ser.is_valid(raise_exception=True)

    session.consent_screen_recording = ser.validated_data['screen_recording']
    session.consent_camera = ser.validated_data['camera']
    session.consent_audio = ser.validated_data['audio']
    session.consent_given_at = timezone.now()
    session.save()
    return Response({'status': 'consent_recorded'})


@api_view(['POST'])
@permission_classes([AllowAny])
def session_response(request, session_token):
    """Submit a response for one block."""
    session = get_object_or_404(ParticipantSession, participant_token=session_token)

    ser = BlockResponseWriteSerializer(data=request.data)
    ser.is_valid(raise_exception=True)

    block_id = ser.validated_data.pop('block_id')
    block = get_object_or_404(Block, pk=block_id, study=session.study)

    response_obj, _ = BlockResponse.objects.update_or_create(
        session=session,
        block=block,
        defaults={
            **ser.validated_data,
            'submitted_at': timezone.now(),
        },
    )

    # Advance progress
    block_ids = list(session.study.blocks.values_list('id', flat=True))
    try:
        idx = list(block_ids).index(block.id)
        session.current_block_index = max(session.current_block_index, idx + 1)
        session.save(update_fields=['current_block_index', 'last_activity_at'])
    except ValueError:
        pass

    return Response(BlockResponseSerializer(response_obj).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def session_complete(request, session_token):
    """Mark session as complete."""
    session = get_object_or_404(ParticipantSession, participant_token=session_token)
    session.completed = True
    session.completed_at = timezone.now()
    session.save()
    return Response({'status': 'completed'})


@api_view(['POST'])
@permission_classes([AllowAny])
def heatmap_batch(request, session_token):
    """Ingest a batch of heatmap / interaction events."""
    session = get_object_or_404(ParticipantSession, participant_token=session_token)
    events = request.data.get('events', [])
    created = []
    for ev in events:
        ser = HeatmapEventSerializer(data=ev)
        if not ser.is_valid():
            continue
        block_id = ser.validated_data.pop('block_id')
        block = Block.objects.filter(pk=block_id, study=session.study).first()
        if not block:
            continue
        obj = HeatmapEvent.objects.create(session=session, block=block, **ser.validated_data)
        created.append(str(obj.id))
    return Response({'created': len(created)}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def recording_upload(request, session_token):
    """Upload a recording chunk (screen / camera / audio blob)."""
    session = get_object_or_404(ParticipantSession, participant_token=session_token)
    file = request.FILES.get('file')
    if not file:
        return Response({'error': 'No file'}, status=400)

    recording_type = request.data.get('recording_type', 'screen')
    block_id = request.data.get('block_id')
    chunk_index = int(request.data.get('chunk_index', 0))
    block = Block.objects.filter(pk=block_id, study=session.study).first() if block_id else None

    chunk = RecordingChunk.objects.create(
        session=session,
        block=block,
        recording_type=recording_type,
        chunk_index=chunk_index,
        file=file,
    )
    chunk.url = request.build_absolute_uri(chunk.file.url)
    chunk.save()

    return Response({'chunkId': str(chunk.id), 'url': chunk.url}, status=status.HTTP_201_CREATED)


# ── Researcher-facing session views (authenticated) ───────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def study_sessions(request, study_pk):
    """List all sessions for a study owned by the researcher."""
    study = get_object_or_404(Study, pk=study_pk, owner=request.user)
    sessions = study.sessions.all()
    ser = SessionDetailSerializer(sessions, many=True)
    return Response({'sessions': ser.data, 'total': sessions.count()})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_detail(request, study_pk, session_pk):
    study = get_object_or_404(Study, pk=study_pk, owner=request.user)
    session = get_object_or_404(ParticipantSession, pk=session_pk, study=study)
    return Response(SessionDetailSerializer(session).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_heatmap(request, study_pk, block_pk):
    """Return aggregated heatmap data for a block."""
    study = get_object_or_404(Study, pk=study_pk, owner=request.user)
    block = get_object_or_404(Block, pk=block_pk, study=study)
    events = HeatmapEvent.objects.filter(block=block).values(
        'event_type', 'x', 'y', 'scroll_y', 'element_selector', 'element_text'
    )
    return Response({'block_id': str(block_pk), 'events': list(events)})
