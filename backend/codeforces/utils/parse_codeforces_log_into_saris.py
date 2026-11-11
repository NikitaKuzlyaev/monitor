from backend.schemas.saris_log import Run, SarisLog

CONTEST_TAG = '@contest'
PROBLEM_TAG = '@p'
TEAM_TAG = '@t'
SUBMISSION_TAG = '@s'
REAL_TEAM_NAME = '@RTN'


def parse_codeforces_log_into_saris(data: str) -> SarisLog:
    params = {
        'contestName': '',
        'freezeTimeMinutesFromStart': 90,
        'problemLetters': [],
        'contestants': [],
        'runs': [],
    }

    contestants_by_ids = {}
    team_by_real_name = {}

    for line in data.splitlines():
        parts = line.strip().split()
        if not parts:
            continue
        type_, *other = parts

        if type_ == CONTEST_TAG:
            params['contestName'] = ' '.join(other)
            continue

        if type_ == REAL_TEAM_NAME:
            handle, *team_name = other
            team_name = ' '.join(team_name)
            team_by_real_name[handle] = team_name
            continue

        other = ' '.join(other)

        if type_ == SUBMISSION_TAG:
            team_id, problem_char, _, time_from_start, verdict = other.split(",")
            if verdict == 'CE':
                continue

            run = Run(
                contestant=contestants_by_ids[team_id],
                problemLetter=problem_char,
                timeMinutesFromStart=int(time_from_start) // 60,
                success=(verdict == 'OK')
            )
            params['runs'].append(run)
        elif type_ == TEAM_TAG:
            team_id, *_, team_name = other.split(",")
            team_name = "".join(team_name.split("=")[1:])
            real_team_name = (
                team_name if team_name not in team_by_real_name
                else team_by_real_name[team_name]
            )
            contestants_by_ids[team_id] = real_team_name
            params['contestants'].append(real_team_name)
        elif type_ == PROBLEM_TAG:
            char, *_ = other.split(",")
            params['problemLetters'].append(char)

    return SarisLog(**params)
