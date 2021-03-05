def intersection_matches(dict1, dict2, *keys):
    for key in keys:
        if key in dict1 and key in dict2 and dict1[key] != dict2[key]:
            return False
    return True
