# similarity_engine.py

from data_models import clamp, gaussian_similarity, jaccard_similarity


def industry_match(exp, imp):
    return 1 if exp.Industry == imp.Industry else 0


def revenue_similarity(exp, imp):
    diff = abs(exp.Revenue_Size_USD - imp.Revenue_Size_USD)
    return clamp(1 - diff / max(exp.Revenue_Size_USD, imp.Revenue_Size_USD, 1))


def capacity_fit(exp, imp):
    ratio = imp.Avg_Order_Tons / max(exp.Manufacturing_Capacity_Tons, 1)

    if ratio <= 0.7:
        return 1
    elif ratio <= 1:
        return 0.8
    elif ratio <= 1.2:
        return 0.5
    else:
        return 0


def team_similarity(exp, imp):
    return gaussian_similarity(exp.Team_Size, imp.Team_Size)


def certification_match(exp, imp):
    return jaccard_similarity(exp.Certification, imp.Certification)


def trust_score(exp, imp):
    return (exp.Good_Payment_Terms + imp.Good_Payment_History) / 2


def response_alignment(exp, imp):
    return (exp.Prompt_Response_Score + imp.Prompt_Response) / 2


def growth_alignment(exp, imp):
    return (exp.Hiring_Signal + imp.Hiring_Growth) / 2


def engagement_score(exp, imp):
    return (exp.LinkedIn_Activity + imp.Engagement_Spike) / 2


def intent_alignment(exp, imp):
    return (exp.Intent_Score + imp.Intent_Score) / 2