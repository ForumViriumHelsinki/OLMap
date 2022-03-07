from rest_framework import serializers

from olmap import models


class MapFeatureSerializer(serializers.ModelSerializer):
    lat = serializers.FloatField(source='image_note.lat')
    lon = serializers.FloatField(source='image_note.lon')
    image = serializers.ImageField(source='image_note.image', read_only=True)
    created_by = serializers.PrimaryKeyRelatedField(source='image_note.created_by', read_only=True)
    created_at = serializers.DateTimeField(source='image_note.created_at', read_only=True)
    image_note_id = serializers.PrimaryKeyRelatedField(
        queryset=models.OSMImageNote.objects.all(), required=False)
    id = serializers.IntegerField(required=False)

    class Meta:
        model = models.MapFeature
        fields = ['lat', 'lon', 'image_note_id', 'id', 'image', 'osm_feature', 'created_by', 'created_at']

    def update(self, instance, validated_data):
        note_fields = validated_data.pop('image_note', None)

        note_or_id = validated_data.pop('image_note_id', None)
        if note_or_id:
            field = 'image_note_id' if isinstance(note_or_id, int) else 'image_note'
            validated_data[field] = note_or_id
        ret = super().update(instance, validated_data)
        if note_fields:
            self.update_note(instance, note_fields)
        return ret

    def update_note(self, instance, note_fields):
        for (f, v) in note_fields.items():
            setattr(instance.image_note, f, v)
        instance.image_note.save()

    def create(self, validated_data):
        note_fields = validated_data.pop('image_note', {})
        note_id = validated_data.get('image_note_id', None)

        if not note_id:
            user_id = self.context['request'].user.id
            note = models.OSMImageNote.objects.create(
                tags=[self.Meta.model.__name__], created_by_id=user_id, **note_fields)
            validated_data['image_note_id'] = note.id

        instance = super().create(validated_data)

        if note_id:
            self.update_note(instance, note_fields)

        return instance

    def is_valid(self, raise_exception=False):
        self.ensure_osm_feature(self.initial_data)
        return super().is_valid(raise_exception)

    def ensure_osm_feature(self, data):
        id = data.get('osm_feature', None)
        if id:
            models.OSMFeature.objects.get_or_create(id=id)


mf_fields = MapFeatureSerializer.Meta.fields


class UnloadingPlaceSerializer(MapFeatureSerializer):
    class Meta:
        model = models.UnloadingPlace
        fields = mf_fields + ['access_points', 'layer', 'length', 'width', 'entrances',
                              'max_weight', 'description', 'opening_hours']


class EntranceSerializer(MapFeatureSerializer):
    unloading_places = UnloadingPlaceSerializer(many=True, required=False)

    class Meta:
        model = models.Entrance
        fields = mf_fields + ['street', 'housenumber', 'unit', 'type', 'description',
                              'loadingdock', 'layer', 'unloading_places', 'access',
                              'width', 'height', 'buzzer', 'keycode', 'phone', 'opening_hours', 'wheelchair']

    def update(self, instance, validated_data):
        unloading_places = validated_data.pop('unloading_places', [])
        entrance = super().update(instance, validated_data)
        self.update_unloading_places(entrance, unloading_places)
        return entrance

    def update_unloading_places(self, entrance, unloading_places_data):
        extra_ups = entrance.unloading_places.exclude(
            id__in=[f['id'] for f in unloading_places_data if f.get('id', None)])
        if len(extra_ups):
            for up in extra_ups:
                entrance.unloading_places.remove(up)
        serializer = UnloadingPlaceSerializer(context=self.context)
        for up_data in unloading_places_data:
            id = up_data.get('id', None)
            if id:
                up = models.UnloadingPlace.objects.select_related('image_note').get(id=id)
                serializer.update(up, up_data)
            else:
                up = serializer.create(up_data)
            entrance.unloading_places.add(up)

    def create(self, validated_data):
        unloading_places = validated_data.pop('unloading_places', [])

        entrance = super().create(validated_data)

        self.update_unloading_places(entrance, unloading_places)
        return entrance


class WorkplaceEntranceSerializer(serializers.ModelSerializer):
    lat = serializers.FloatField(source='entrance.image_note.lat')
    lon = serializers.FloatField(source='entrance.image_note.lon')
    image = serializers.ImageField(source='entrance.image_note.image', required=False, allow_null=True)
    created_by = serializers.PrimaryKeyRelatedField(source='entrance.image_note.created_by', read_only=True)
    created_at = serializers.DateTimeField(source='entrance.image_note.created_at', read_only=True)
    osm_feature = serializers.IntegerField(source='entrance.osm_feature_id', required=False, allow_null=True)
    image_note_id = serializers.IntegerField(source='entrance.image_note_id', required=False)
    unloading_places = UnloadingPlaceSerializer(many=True, required=False, source='entrance.unloading_places')
    entrance_id = serializers.PrimaryKeyRelatedField(queryset=models.Entrance.objects.all(), required=False)
    entrance_fields = EntranceSerializer(source='entrance')
    id = serializers.IntegerField(required=False)

    class Meta:
        model = models.WorkplaceEntrance
        fields = mf_fields + ['entrance_id', 'deliveries', 'unloading_places', 'description', 'entrance_fields']

    def is_valid(self, raise_exception=False):
        try:
            self.initial_data['entrance_fields']['unloading_places'] = self.initial_data['unloading_places']
        except KeyError:
            pass
        return super().is_valid(raise_exception)

    def update(self, instance, validated_data):
        entrance_fields = self.extract_entrance(validated_data)
        validated_data['entrance'] = validated_data.pop('entrance_id', None)
        ret = super().update(instance, validated_data)
        self.update_entrance(instance, entrance_fields)
        return ret

    def extract_entrance(self, validated_data):
        return validated_data.pop('entrance', {})

    def update_entrance(self, instance, entrance_data):
        serializer = EntranceSerializer(context=self.context)
        serializer.update(instance.entrance, entrance_data)

    def create(self, validated_data):
        entrance_fields = self.extract_entrance(validated_data)
        entrance_or_id = validated_data.pop('entrance_id', None)
        field = 'entrance_id' if isinstance(entrance_or_id, int) else 'entrance'
        validated_data[field] = entrance_or_id

        if not entrance_or_id:
            serializer = EntranceSerializer(context=self.context)
            osm_id = entrance_fields.get('osm_feature_id', None)
            if osm_id:
                models.OSMFeature.objects.get_or_create(id=osm_id)
            entrance = serializer.create(entrance_fields)
            validated_data['entrance_id'] = entrance.id

        wp_entrance = super().create(validated_data)

        if entrance_or_id:
            self.update_entrance(wp_entrance, entrance_fields)

        return wp_entrance


class WorkplaceSerializer(MapFeatureSerializer):
    workplace_entrances = WorkplaceEntranceSerializer(many=True, required=False)

    class Meta:
        model = models.Workplace
        fields = mf_fields + ['street', 'housenumber', 'unit', 'osm_feature', 'workplace_entrances',
                              'name', 'delivery_instructions', 'max_vehicle_height']

    def is_valid(self, raise_exception=False):
        for e in self.initial_data['workplace_entrances']:
            try:
                e['entrance_fields']['unloading_places'] = e['unloading_places']
            except KeyError:
                pass
        return super().is_valid(raise_exception)

    def update(self, instance, validated_data):
        entrances = validated_data.pop('workplace_entrances', [])
        workplace = super().update(instance, validated_data)
        self.update_entrances(workplace, entrances)
        return workplace

    def update_entrances(self, workplace, entrances_data):
        workplace.workplace_entrances.exclude(id__in=[f['id'] for f in entrances_data if f.get('id', None)]).delete()
        serializer = WorkplaceEntranceSerializer(context=self.context)
        for entrance_data in entrances_data:
            id = entrance_data.get('id', None)
            if id:
                entrance = workplace.workplace_entrances\
                    .select_related('entrance__image_note')\
                    .get(id=id)
                serializer.update(entrance, entrance_data)
            else:
                serializer.create(dict(entrance_data, workplace=workplace))

    def create(self, validated_data):
        entrances = validated_data.pop('workplace_entrances', [])
        wpt = models.WorkplaceType.objects.get_or_create(label='Company')[0]
        validated_data['type'] = wpt

        workplace = super().create(validated_data)

        self.update_entrances(workplace, entrances)
        return workplace
