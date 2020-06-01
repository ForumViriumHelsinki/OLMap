from django.contrib import admin
from django.utils.safestring import mark_safe

from holvi_orders import models


class HolviWebshopAdmin(admin.ModelAdmin):
    pass


class HolviPurchaseInline(admin.TabularInline):
    model = models.HolviPurchase
    extra = 0
    readonly_fields = ['answers']

    def answers(self, purchase):
        return mark_safe(''.join(f'<p>{a.label}:<br/>{a.answer}</p>' for a in purchase.answers.all()))


@admin.register(models.HolviOrder)
class HolviOrderAdmin(admin.ModelAdmin):
    list_display = ['code', 'shop_id', 'firstname', 'lastname', 'street', 'paid_time']
    list_filter = ['shop']
    date_hierarchy = 'paid_time'
    inlines = [HolviPurchaseInline]
