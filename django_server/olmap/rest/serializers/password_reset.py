from dj_rest_auth.serializers import PasswordResetSerializer as BasePasswordResetSerializer
from django.conf import settings
from django.contrib.auth.forms import PasswordResetForm as BasePasswordResetForm


class PasswordResetForm(BasePasswordResetForm):
    def save(self, **kwargs):
        kwargs = dict(
            kwargs,
            domain_override="app.olmap.org",
            use_https=True,
            from_email=settings.EMAIL_HOST_USER or "olmap@olmap.org",
        )
        return super().save(**kwargs)


class PasswordResetSerializer(BasePasswordResetSerializer):
    password_reset_form_class = PasswordResetForm
