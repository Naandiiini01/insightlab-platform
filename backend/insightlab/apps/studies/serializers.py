from rest_framework import serializers
from .models import Study, Block, MediaAsset


class BlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Block
        fields = ['id', 'type', 'order', 'content', 'media_assets', 'settings',
                  'variant_reference', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class MediaAssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaAsset
        fields = ['id', 'file_type', 'original_name', 'file_size', 'url', 'created_at']
        read_only_fields = ['id', 'url', 'created_at']


class StudyListSerializer(serializers.ModelSerializer):
    response_count = serializers.IntegerField(read_only=True)
    block_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Study
        fields = ['id', 'title', 'description', 'status', 'device_target',
                  'participant_token', 'response_count', 'block_count',
                  'published_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'participant_token', 'published_at',
                            'created_at', 'updated_at', 'response_count', 'block_count']


class StudyDetailSerializer(serializers.ModelSerializer):
    blocks = BlockSerializer(many=True, read_only=True)
    response_count = serializers.SerializerMethodField()

    class Meta:
        model = Study
        fields = ['id', 'title', 'description', 'status', 'device_target',
                  'participant_token', 'blocks', 'response_count',
                  'published_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'participant_token', 'published_at',
                            'created_at', 'updated_at']

    def get_response_count(self, obj):
        return obj.response_count


class StudyWriteSerializer(serializers.ModelSerializer):
    blocks = BlockSerializer(many=True, required=False)

    class Meta:
        model = Study
        fields = ['title', 'description', 'device_target', 'blocks']

    def update(self, instance, validated_data):
        blocks_data = validated_data.pop('blocks', None)
        # Update study fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Replace blocks if provided
        if blocks_data is not None:
            instance.blocks.all().delete()
            for block_data in blocks_data:
                Block.objects.create(study=instance, **block_data)

        return instance
