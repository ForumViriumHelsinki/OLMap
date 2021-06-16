import os
import re
import django
import sys

os.environ["DJANGO_SETTINGS_MODULE"] = 'olmap_config.settings'
django.setup()

from olmap.models import OSMImageNote, Workplace

WEEKDAYS_FI = ["ma", "ti", "ke", "to", "pe", "la"]

# Matches
weekday_re = re.compile(r"\b({})\b".format("|".join(WEEKDAYS_FI)), re.IGNORECASE)
su_re = re.compile(r"\bsu\b")

time_re = re.compile(r"\b({}\b)".format("|".join(WEEKDAYS_FI)), re.IGNORECASE)

WEEKDAYS_FI.append(("su"))
WEEKDAYS_EN = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]


def multiple_replace(dict_, text):
    return weekday_re.sub(lambda mo: dict_[mo.string.lower()[mo.start():mo.end()]], text)


ws = Workplace.objects.exclude(opening_hours="")
for w in ws:
    oh = w.opening_hours
    new_oh = w.opening_hours
    if weekday_re.findall(oh):
        new_oh = multiple_replace(dict(zip(WEEKDAYS_FI, WEEKDAYS_EN)), oh)
    if su_re.findall(new_oh):
        new_oh = su_re.sub("Su", new_oh)
    if new_oh != w.opening_hours:
        print(f"   {oh}\n-> {new_oh}\n")
        w.opening_hours = new_oh
        if len(sys.argv) > 1 and sys.argv[1] == "1":
            w.save()
        else:
            print("Add parameter '1' to this script to save results")
