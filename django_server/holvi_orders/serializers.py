from rest_framework import serializers

from holvi_orders import models


class HolviPurchaseAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.HolviPurchaseAnswer
        exclude = ['purchase', 'id']


class HolviPurchaseSerializer(serializers.ModelSerializer):
    answers = HolviPurchaseAnswerSerializer(many=True)

    class Meta:
        model = models.HolviPurchase
        exclude = ['order', 'id']


class HolviOrderSerializer(serializers.ModelSerializer):
    purchases = HolviPurchaseSerializer(many=True)

    class Meta:
        model = models.HolviOrder
        fields = '__all__'

    def create(self, validated_data):
        purchases = validated_data.pop('purchases', [])
        instance = super().create(validated_data)
        self.save_purchases(instance, purchases)
        return instance

    def save_purchases(self, instance, purchases):
        for purchase_data in purchases:
            answers = purchase_data.pop('answers', [])
            purchase = instance.purchases.create(**purchase_data)
            for answer in answers:
                purchase.answers.create(**answer)
