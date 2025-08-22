def intersection_matches(dict1, dict2, *keys):
    for key in keys:
        if key in dict1 and key in dict2:
            if hasattr(dict1[key], "lower") and hasattr(dict2[key], "lower"):
                if dict1[key].lower() != dict2[key].lower():
                    return False
            elif dict1[key] != dict2[key]:
                return False
    return True
