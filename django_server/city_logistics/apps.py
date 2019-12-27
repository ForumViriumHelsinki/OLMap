from django.contrib.admin.apps import AdminConfig


class AdminConfig(AdminConfig):
    default_site = 'city_logistics.admin_site.AdminSite'
