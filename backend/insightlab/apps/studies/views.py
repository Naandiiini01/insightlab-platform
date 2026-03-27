import uuid
import copy
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Study, Block, MediaAsset
from .serializers import (
    StudyListSerializer, StudyDetailSerializer,
    StudyWriteSerializer, BlockSerializer, MediaAssetSerializer,
)


# ── Studies ──────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def study_list(request):
    if request.method == 'GET':
        studies = Study.objects.filter(owner=request.user)
        ser = StudyListSerializer(studies, many=True)
        return Response({'studies': ser.data})

    # POST – create
    ser = StudyListSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    study = ser.save(owner=request.user)
    # Add default intro + thankyou blocks
    Block.objects.create(study=study, type='intro', order=0, content={
        'title': 'Welcome to our study',
        'description': 'Thank you for participating. This should take about 10 minutes.',
        'researcherNote': '', 'mediaUrl': None, 'continueLabel': 'Get started',
    })
    Block.objects.create(study=study, type='thankyou', order=1, content={
        'title': 'Thank you!',
        'message': 'Your responses have been recorded. We appreciate your time.',
        'nextSteps': '', 'redirectUrl': '', 'redirectLabel': '',
    })
    return Response({'study': StudyDetailSerializer(study).data}, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def study_detail(request, pk):
    study = get_object_or_404(Study, pk=pk, owner=request.user)

    if request.method == 'GET':
        return Response(StudyDetailSerializer(study).data)

    if request.method == 'PUT':
        ser = StudyWriteSerializer(study, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(StudyDetailSerializer(study).data)

    # DELETE
    study.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def study_publish(request, pk):
    study = get_object_or_404(Study, pk=pk, owner=request.user)
    if not study.participant_token:
        study.participant_token = uuid.uuid4()
    study.status = 'published'
    study.published_at = timezone.now()
    study.save()
    return Response({
        'status': study.status,
        'participantToken': study.participant_token,
        'participantUrl': f'/t/{study.participant_token}',
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def study_unpublish(request, pk):
    study = get_object_or_404(Study, pk=pk, owner=request.user)
    study.status = 'draft'
    study.save()
    return Response({'status': study.status})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def study_duplicate(request, pk):
    original = get_object_or_404(Study, pk=pk, owner=request.user)
    new_study = Study.objects.create(
        owner=request.user,
        title=f'{original.title} (copy)',
        description=original.description,
        device_target=original.device_target,
        status='draft',
    )
    for block in original.blocks.all():
        Block.objects.create(
            study=new_study,
            type=block.type,
            order=block.order,
            content=copy.deepcopy(block.content),
            media_assets=copy.deepcopy(block.media_assets),
            settings=copy.deepcopy(block.settings),
        )
    return Response({'study': StudyListSerializer(new_study).data}, status=status.HTTP_201_CREATED)


# ── Blocks ────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def block_create(request, study_pk):
    study = get_object_or_404(Study, pk=study_pk, owner=request.user)
    ser = BlockSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    block = ser.save(study=study)
    return Response(BlockSerializer(block).data, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def block_detail(request, study_pk, block_pk):
    study = get_object_or_404(Study, pk=study_pk, owner=request.user)
    block = get_object_or_404(Block, pk=block_pk, study=study)

    if request.method == 'PUT':
        ser = BlockSerializer(block, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(BlockSerializer(block).data)

    block.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def blocks_reorder(request, study_pk):
    """
    Expects: { "order": ["block-uuid-1", "block-uuid-2", ...] }
    """
    study = get_object_or_404(Study, pk=study_pk, owner=request.user)
    order = request.data.get('order', [])
    for idx, block_id in enumerate(order):
        Block.objects.filter(pk=block_id, study=study).update(order=idx)
    blocks = Block.objects.filter(study=study)
    return Response(BlockSerializer(blocks, many=True).data)


# ── Media uploads ─────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def media_upload(request, study_pk):
    study = get_object_or_404(Study, pk=study_pk, owner=request.user)
    file = request.FILES.get('file')
    if not file:
        return Response({'error': 'No file provided'}, status=400)

    content_type = file.content_type or ''
    if content_type.startswith('image/'):
        file_type = 'gif' if 'gif' in content_type else 'image'
    elif content_type.startswith('video/'):
        file_type = 'video'
    else:
        return Response({'error': 'Unsupported file type'}, status=400)

    from django.conf import settings as django_settings
    if file.size > django_settings.MAX_UPLOAD_SIZE:
        return Response({'error': 'File too large (max 100 MB)'}, status=400)

    block_id = request.data.get('block_id')
    block = None
    if block_id:
        block = Block.objects.filter(pk=block_id, study=study).first()

    asset = MediaAsset.objects.create(
        study=study,
        block=block,
        file=file,
        file_type=file_type,
        original_name=file.name,
        file_size=file.size,
        uploaded_by=request.user,
    )
    asset.url = request.build_absolute_uri(asset.file.url)
    asset.save()

    return Response(MediaAssetSerializer(asset).data, status=status.HTTP_201_CREATED)


# ── Public study access (for participant) ─────────────────────────────────────

@api_view(['GET'])
@permission_classes([])  # public
def study_public(request, token):
    study = get_object_or_404(Study, participant_token=token, status='published')
    # Only return blocks needed for participant, exclude owner data
    blocks = BlockSerializer(study.blocks.all(), many=True).data
    return Response({
        'id': str(study.id),
        'title': study.title,
        'description': study.description,
        'deviceTarget': study.device_target,
        'blocks': blocks,
    })
