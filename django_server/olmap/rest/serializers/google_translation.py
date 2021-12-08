from django.conf import settings
from google.cloud import translate_v2 as translate
from rest_framework import serializers


class TranslationSerializerMixin(object):
    translated_fields = [] # Override in subclasses

    def get_requested_language(self):
        return self.context['request'].query_params.get('language', None)

    def create_translated_fields(self, instance):
        if len(self.translated_fields) == 0:
            return
        if hasattr(instance, self.translated_fields[0] + '_translated'):
            return
        self.prefill_translated_fields([([instance], self.translated_fields)])

    def prefill_translated_fields(self, instance_lists):
        language = self.get_requested_language()
        if not language:
            return

        instance_fields = []
        for instances, field_names in instance_lists:
            for instance in instances:
                for f in field_names:
                    if getattr(instance, f) and not getattr(instance, f + '_translated', None):
                        instance_fields.append((instance, f))

        if not len(instance_fields):
            return

        translate_client = translate.Client.from_service_account_json(settings.GOOGLE_ACCOUNT_JSON)
        values = [getattr(instance, f) for instance, f in instance_fields]
        result = translate_client.translate(values, target_language=language)

        for i, (instance, f) in enumerate(instance_fields):
            setattr(instance, f + '_translated', result[i]['translatedText'])
            setattr(instance, f + '_language', result[i]['detectedSourceLanguage'])


class TranslatedField(serializers.Field):
    def __init__(self, **kwargs):
        kwargs['source'] = '*'
        kwargs['read_only'] = True
        super().__init__(**kwargs)

    def to_representation(self, value):
        self.parent.create_translated_fields(value)
        return getattr(value, self.field_name, None)