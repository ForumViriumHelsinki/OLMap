import uuid as uuid

from django.conf import settings
from django.core.mail import send_mail
from django.db import models
from django.db.models import Q
from django.utils.translation import gettext_lazy as _
from smsframework import Gateway, OutgoingMessage
from smsframework_gatewayapi import GatewayAPIProvider
from twilio.rest import Client

from .base import Address, TimestampedModel
from .courier_models import CourierCompany, Courier, Sender

if settings.SMS_PLATFORM == 'GatewayAPI':
    gateway = Gateway()
    gateway.add_provider('gapi', GatewayAPIProvider,
                         key=settings.GATEWAY_API['KEY'], secret=settings.GATEWAY_API['SECRET'])


class Package(TimestampedModel):
    name = models.CharField(max_length=64, blank=True)
    details = models.TextField(blank=True)
    pickup_at = models.ForeignKey(Address, verbose_name=_('pickup location'), related_name='outbound_packages',
                                  on_delete=models.PROTECT)
    deliver_to = models.ForeignKey(Address, verbose_name=_('destination'), related_name='inbound_packages',
                                   on_delete=models.PROTECT)

    height = models.PositiveIntegerField(verbose_name=_('height'), help_text=_('in cm'), null=True, blank=True)
    width = models.PositiveIntegerField(verbose_name=_('width'), help_text=_('in cm'), null=True, blank=True)
    depth = models.PositiveIntegerField(verbose_name=_('depth'), help_text=_('in cm'), null=True, blank=True)

    weight = models.DecimalField(verbose_name=_('weight'), help_text=_('in kg'),
                                 max_digits=7, decimal_places=2, null=True, blank=True)

    sender = models.ForeignKey(Sender, null=True, verbose_name=_('sender'), related_name='sent_packages', on_delete=models.PROTECT)

    recipient = models.CharField(max_length=128, verbose_name=_('recipient'))
    recipient_phone = models.CharField(max_length=32, verbose_name=_('recipient phone number'))
    delivery_instructions = models.CharField(max_length=256, blank=True)

    courier_company = models.ForeignKey(CourierCompany, related_name='packages', null=True, on_delete=models.SET_NULL)
    courier = models.ForeignKey(Courier, verbose_name=_('courier'), null=True, blank=True,
                                 related_name='delivered_packages', on_delete=models.PROTECT)

    earliest_pickup_time = models.DateTimeField(verbose_name=_('earliest pickup time'))
    latest_pickup_time = models.DateTimeField(verbose_name=_('latest pickup time'))

    earliest_delivery_time = models.DateTimeField(verbose_name=_('earliest delivery time'))
    latest_delivery_time = models.DateTimeField(verbose_name=_('latest delivery time'))

    picked_up_time = models.DateTimeField(verbose_name=_('picked up at'), blank=True, null=True)
    delivered_time = models.DateTimeField(verbose_name=_('delivered at'), blank=True, null=True)

    uuid = models.UUIDField(default=uuid.uuid4, editable=False)

    class Meta:
        verbose_name = _('package')
        verbose_name_plural = _('packages')
        ordering = ['-earliest_pickup_time']

    @classmethod
    def available_packages_for_courier(cls, courier):
        """
        Return all packages for which delivery has been requested but which are not yet reserved by any courier.
        """
        return cls.objects.filter(
            Q(courier_company=None) | Q(courier_company=courier.company_id),
            courier__isnull=True)

    def save(self, **kwargs):
        if not self.name:
            self.name = f'Package {self.id} to {self.recipient}'
        return super().save(**kwargs)

    @classmethod
    def sent_by_user(cls, user):
        return cls.objects.filter(sender__user=user)

    @classmethod
    def delivered_by_user(cls, user):
        return cls.objects.filter(courier__user=user)


class PackageSMS(TimestampedModel):
    message_types = [{
        'name': 'reservation',
        'subject': 'OLMap package reserved',
        'template': 'Your package to {recipient} was reserved by {courier}. See delivery progress: {url}'
    }, {
        'name': 'pickup',
        'subject': 'OLMap package picked up',
        'template': 'Your package from {sender} was picked up for delivery. See delivery progress: {url}'
    }, {
        'name': 'delivery',
        'subject': 'OLMap package delivered',
        'template': 'Your package to {recipient} has been delivered.'
    }, {
        'name': 'courier_notification',
        'subject': 'OLMap package available',
        'template': 'New package delivery request from {sender}: {url}'
    }, {
        'name': 'new_package',
        'subject': 'New delivery order',
        'template': 'New order from {recipient}: {url}'
    }]

    types_by_name = dict((t['name'], i) for i, t in enumerate(message_types))
    templates_by_name = dict((t['name'], t['template']) for t in message_types)
    subjects_by_name = dict((t['name'], t['subject']) for t in message_types)

    message_type = models.PositiveSmallIntegerField(choices=((i, t['name']) for i, t in enumerate(message_types)))
    recipient_number = models.CharField(max_length=32)
    twilio_sid = models.CharField(max_length=64, blank=True)
    package = models.ForeignKey(Package, on_delete=models.CASCADE, related_name='sms_messages')
    content = models.TextField()

    class Meta:
        ordering = ['-created_at']

    @classmethod
    def render_message(cls, message_type, package, referer=None):
        return cls.templates_by_name[message_type].format(
            recipient=package.recipient,
            sender=package.sender.get_full_name(),
            courier=package.courier and package.courier.get_full_name(),
            url='{}#/package/{}'.format(referer or settings.FRONTEND_ROOT, package.uuid))

    @classmethod
    def send_message(cls, package, message_type, to_number, referer=None, email=None):
        message = cls(
            package=package,
            message_type=cls.types_by_name[message_type],
            recipient_number=to_number,
            content=cls.render_message(message_type, package, referer))

        if not settings.TEST:
            if settings.SMS_PLATFORM == 'Twilio':
                client = cls.get_twilio_client()
                if client:
                    twilio_msg = client.messages.create(
                        body=message.content,
                        to=to_number,
                        from_=settings.TWILIO['SENDER_NR'])
                    message.twilio_sid = twilio_msg.sid

            elif settings.SMS_PLATFORM == 'GatewayAPI':
                gateway.send(OutgoingMessage(to_number, message.content))

        if email:
            from_email = settings.EMAIL_HOST_USER or 'olmap@olmap.org'
            send_mail(cls.subjects_by_name[message_type], message.content, from_email, [email])

        message.save()

    @classmethod
    def message_sender(cls, package, message_type, referer):
        cls.send_message(package, message_type, package.sender.phone_number, referer)

    @classmethod
    def notify_sender_of_order(cls, package, referer=None):
        cls.message_sender(package, 'new_package', referer)

    @classmethod
    def notify_sender_of_reservation(cls, package, referer):
        cls.message_sender(package, 'reservation', referer)

    @classmethod
    def notify_recipient_of_pickup(cls, package, referer):
        cls.send_message(package, 'pickup', package.recipient_phone, referer)

    @classmethod
    def notify_sender_of_delivery(cls, package, referer):
        cls.message_sender(package, 'delivery', referer)

    @classmethod
    def get_twilio_client(cls):
        if settings.TWILIO['ACCOUNT_SID'] != 'configure in local settings':
            return Client(settings.TWILIO['ACCOUNT_SID'], settings.TWILIO['AUTH_TOKEN'])
