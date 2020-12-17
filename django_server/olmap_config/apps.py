from django.contrib.admin.apps import AdminConfig


class AdminConfig(AdminConfig):
    default_site = 'olmap_config.admin_site.AdminSite'
