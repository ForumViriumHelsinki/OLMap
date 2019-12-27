from django.contrib import admin


class AdminSite(admin.AdminSite):
    site_header = 'FVH City Logistics Admin'
    site_title = 'FVH City Logistics Admin'
    site_url = None
