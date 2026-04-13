from django.db.models import Count, Avg, Q, F
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from insightlab.apps.studies.models import Study, Block
from insightlab.apps.participants.models import (
    ParticipantSession, BlockResponse, HeatmapEvent,
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def study_analytics(request, study_pk):
    """Top-level analytics for a study."""
    study = get_object_or_404(Study, pk=study_pk, owner=request.user)
    sessions = study.sessions.all()
    total = sessions.count()
    completed = sessions.filter(completed=True).count()
    completion_rate = round((completed / total * 100), 1) if total else 0

    avg_duration = sessions.filter(completed=True).aggregate(
        avg=Avg(F('completed_at') - F('started_at'))
    )['avg']
    avg_seconds = int(avg_duration.total_seconds()) if avg_duration else 0

    # Drop-off by block
    dropoffs = (
        sessions.filter(completed=False, dropped_off_at_block__isnull=False)
        .values('dropped_off_at_block__type', 'dropped_off_at_block__order')
        .annotate(count=Count('id'))
        .order_by('dropped_off_at_block__order')
    )

    # Device breakdown
    device_breakdown = (
        sessions.values('device_type')
        .annotate(count=Count('id'))
    )

    # Variant breakdown
    variant_breakdown = (
        sessions.values('variant_assigned')
        .annotate(
            total=Count('id'),
            completed=Count('id', filter=Q(completed=True)),
        )
    )

    # Daily response counts (last 30 days)
    from django.db.models.functions import TruncDate
    daily = (
        sessions.annotate(date=TruncDate('started_at'))
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )

    return Response({
        'total_sessions': total,
        'completed_sessions': completed,
        'completion_rate': completion_rate,
        'avg_duration_seconds': avg_seconds,
        'drop_off_by_block': list(dropoffs),
        'device_breakdown': list(device_breakdown),
        'variant_breakdown': list(variant_breakdown),
        'daily_responses': [
            {'date': str(d['date']), 'count': d['count']} for d in daily
        ],
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def block_analytics(request, study_pk, block_pk):
    """Per-block analytics – task completion, question answer summaries."""
    study = get_object_or_404(Study, pk=study_pk, owner=request.user)
    block = get_object_or_404(Block, pk=block_pk, study=study)
    responses = BlockResponse.objects.filter(block=block)
    total = responses.count()

    result = {
        'block_id': str(block.id),
        'block_type': block.type,
        'total_responses': total,
    }

    if block.type == 'task':
        success = responses.filter(task_completion_status='success').count()
        fail = responses.filter(task_completion_status='fail').count()
        skip = responses.filter(task_completion_status='skip').count()
        avg_time = responses.aggregate(avg=Avg('time_spent_seconds'))['avg'] or 0
        result.update({
            'success_count': success,
            'fail_count': fail,
            'skip_count': skip,
            'success_rate': round(success / total * 100, 1) if total else 0,
            'avg_time_seconds': round(avg_time, 1),
        })

    elif block.type in ('question', 'followup'):
        q_type = block.content.get('questionType', '')
        answers = list(responses.exclude(answer=None).values_list('answer', flat=True))

        if q_type in ('single_choice', 'yes_no', 'multiple_choice'):
            tally = {}
            for ans in answers:
                if isinstance(ans, list):
                    for a in ans:
                        tally[a] = tally.get(a, 0) + 1
                elif ans:
                    tally[str(ans)] = tally.get(str(ans), 0) + 1
            result['answer_distribution'] = tally

        elif q_type in ('rating', 'opinion', 'nps'):
            numeric = [float(a) for a in answers if a is not None]
            result['avg_score'] = round(sum(numeric) / len(numeric), 2) if numeric else 0
            result['score_distribution'] = {str(int(v)): numeric.count(v) for v in set(numeric)}

        elif q_type == 'ranking':
            result['raw_answers'] = answers[:50]

        else:  # open_text
            result['open_responses'] = [str(a) for a in answers[:100]]

    elif block.type == 'variant':
        variants = block.content.get('variants', [])
        sessions_by_variant = (
            ParticipantSession.objects.filter(study=study)
            .values('variant_assigned')
            .annotate(
                total=Count('id'),
                completed=Count('id', filter=Q(completed=True)),
                avg_duration=Avg(F('completed_at') - F('started_at')),
            )
        )
        result['variant_stats'] = list(sessions_by_variant)

    avg_time = responses.aggregate(avg=Avg('time_spent_seconds'))['avg'] or 0
    result['avg_time_seconds'] = round(avg_time, 1)

    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def report_summary(request, study_pk):
    """Full report data – all blocks + analytics combined."""
    study = get_object_or_404(Study, pk=study_pk, owner=request.user)
    from insightlab.apps.studies.serializers import StudyDetailSerializer
    study_data = StudyDetailSerializer(study).data

    blocks_analytics = []
    for block in study.blocks.all():
        responses = BlockResponse.objects.filter(block=block)
        blocks_analytics.append({
            'block_id': str(block.id),
            'block_type': block.type,
            'order': block.order,
            'total_responses': responses.count(),
            'avg_time_seconds': round(
                responses.aggregate(avg=Avg('time_spent_seconds'))['avg'] or 0, 1
            ),
        })

    sessions = study.sessions.all()
    total = sessions.count()
    completed = sessions.filter(completed=True).count()

    return Response({
        'study': study_data,
        'summary': {
            'total_sessions': total,
            'completed_sessions': completed,
            'completion_rate': round(completed / total * 100, 1) if total else 0,
        },
        'blocks_analytics': blocks_analytics,
    })
