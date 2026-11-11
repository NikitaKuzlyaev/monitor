from backend.codeforces.utils.parsers import parse_programming_language, parse_submissions


def test_parse_submissions_keeps_contestants_only() -> None:
    payload = {
        "status": "OK",
        "result": [
            {
                "id": 1,
                "relativeTimeSeconds": 12,
                "problem": {"index": "A"},
                "author": {"participantType": "CONTESTANT", "members": [{"handle": "one"}]},
                "programmingLanguage": "Python 3",
                "verdict": "OK",
                "passedTestCount": 3,
            },
            {
                "id": 2,
                "author": {"participantType": "PRACTICE", "members": [{"handle": "two"}]},
            },
        ],
    }

    assert parse_submissions(payload) == [
        {
            "id": 1,
            "relativeTimeSeconds": 12,
            "problemIndex": "A",
            "teamHandle": "one",
            "teamName": "one",
            "programmingLanguage": "Python",
            "verdict": "OK",
            "passedTestCount": 3,
        }
    ]


def test_parse_programming_language_marks_unknown_values() -> None:
    assert parse_programming_language("Rust 1.75") == "Other"
