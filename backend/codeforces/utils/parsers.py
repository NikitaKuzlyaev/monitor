LANGUAGE_FAMILIES = {
    'Python': ['Python 2', 'Python 3', 'PyPy 2', 'PyPy 3', 'PyPy 3-64'],
    'C++': ['C++17 (GCC 7-32)', 'C++20 (GCC 13-64)', 'C++23 (GCC 14-64, msys2)'],
    'Java': ['Java 21', 'Java 8'],
    'C': ['GNU C11'],
    'C#': ['C# 8', 'C# 10', 'C# 13', 'Mono C#'],
    'Go': ['Go'],
    'Pascal': ['Delphi', 'FPC', 'PascalABC.NET'],
}


def parse_programming_language(language: str) -> str:
    normalized_language = language.strip()
    for family, variants in LANGUAGE_FAMILIES.items():
        if normalized_language in variants:
            return family
    return "Other"


def parse_submissions(data: dict) -> list[dict] | None:
    if data.get("status") != "OK":
        return None

    submissions = []
    for submission in data.get("result", []):
        author = submission.get("author", {})
        members = author.get("members", [])
        if author.get("participantType") != "CONTESTANT" or not members:
            continue

        member = members[0]
        submissions.append({
            "id": submission["id"],
            "relativeTimeSeconds": submission["relativeTimeSeconds"],
            "problemIndex": submission["problem"]["index"],
            "teamHandle": member["handle"],
            "teamName": member.get("name", member["handle"]),
            "programmingLanguage": parse_programming_language(submission["programmingLanguage"]),
            "verdict": submission.get("verdict"),
            "passedTestCount": submission.get("passedTestCount", 0),
        })
    return submissions
