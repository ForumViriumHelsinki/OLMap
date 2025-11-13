from django.contrib import admin


class AdminSite(admin.AdminSite):
    site_header = "Open Logistics Map Admin"
    site_title = "Open Logistics Map Admin"
    site_url = None
