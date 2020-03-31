from django.contrib import admin

from holvi_orders import models


@admin.register(models.HolviWebshop)
class HolviWebshopAdmin(admin.ModelAdmin):
    pass


class HolviPurchaseInline(admin.TabularInline):
    model = models.HolviPurchase
    extra = 0


@admin.register(models.HolviOrder)
class HolviOrderAdmin(admin.ModelAdmin):
    inlines = [HolviPurchaseInline]
