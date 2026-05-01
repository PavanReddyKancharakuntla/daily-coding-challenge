"""Smoke tests that exercise the full request flow end-to-end."""

from datetime import date

from app.models.challenge import Challenge, TestCase
from app.services import streak_service


def _seed_challenge(db, *, slug="hello", difficulty="easy"):
    c = Challenge(
        slug=slug,
        title="Hello",
        prompt="Print hello",
        difficulty=difficulty,
        language="python",
        starter_code="print('hello')",
        solution="print('hello')",
        source="seed",
        is_active=True,
    )
    db.add(c)
    db.flush()
    db.add(TestCase(challenge_id=c.id, stdin="", expected_stdout="hello", is_hidden=False))
    db.commit()
    db.refresh(c)
    return c


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_signup_and_login_flow(client):
    r = client.post(
        "/auth/signup",
        json={"email": "a@b.com", "username": "alice", "password": "password123"},
    )
    assert r.status_code == 201, r.text
    token = r.json()["access_token"]
    assert token

    r = client.post("/auth/login", json={"email": "a@b.com", "password": "password123"})
    assert r.status_code == 200
    assert r.json()["user"]["username"] == "alice"

    r = client.post("/auth/login", json={"email": "a@b.com", "password": "WRONG"})
    assert r.status_code == 401


def test_todays_challenge_uses_seed(client, db_session):
    _seed_challenge(db_session, slug="seed-1", difficulty="easy")

    r = client.get("/challenges/today", params={"difficulty": "easy"})
    assert r.status_code == 200
    body = r.json()
    assert body["difficulty"] == "easy"
    assert body["challenge"]["slug"] == "seed-1"

    # A second call on the same day must return the same pinned challenge.
    r2 = client.get("/challenges/today", params={"difficulty": "easy"})
    assert r2.json()["challenge"]["slug"] == "seed-1"


def test_submit_accepted_awards_score_and_streak(client, db_session):
    challenge = _seed_challenge(db_session, slug="say-hello", difficulty="easy")

    client.post(
        "/auth/signup",
        json={"email": "b@b.com", "username": "bob", "password": "password123"},
    )
    token = client.post(
        "/auth/login", json={"email": "b@b.com", "password": "password123"}
    ).json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    r = client.post(
        "/submissions",
        headers=headers,
        json={
            "challenge_id": challenge.id,
            "language": "python",
            "code": "print('hello')",
        },
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["status"] == "accepted"
    assert body["passed_count"] == 1
    assert body["total_count"] == 1
    assert body["score_awarded"] > 0

    me = client.get("/me", headers=headers).json()
    assert me["current_streak"] == 1
    assert me["total_score"] > 0


def test_streak_service_logic():
    class FakeDB:
        def add(self, *_): pass
        def commit(self): pass
        def refresh(self, *_): pass

    class FakeUser:
        def __init__(self):
            self.total_score = 0
            self.current_streak = 0
            self.longest_streak = 0
            self.last_solved_date = None

    db = FakeDB()
    u = FakeUser()
    today = date(2026, 4, 30)

    awarded = streak_service.apply_accepted_submission(db, user=u, difficulty="easy", today=today)
    assert awarded > 0
    assert u.current_streak == 1

    # Same day -> no double credit
    again = streak_service.apply_accepted_submission(db, user=u, difficulty="easy", today=today)
    assert again == 0
    assert u.current_streak == 1

    # Next day -> streak grows
    from datetime import timedelta
    streak_service.apply_accepted_submission(
        db, user=u, difficulty="easy", today=today + timedelta(days=1)
    )
    assert u.current_streak == 2

    # Skip a day -> streak resets to 1
    streak_service.apply_accepted_submission(
        db, user=u, difficulty="easy", today=today + timedelta(days=5)
    )
    assert u.current_streak == 1


def test_leaderboard(client, db_session):
    for name in ("ulead1", "ulead2"):
        r = client.post(
            "/auth/signup",
            json={
                "email": f"{name}@example.com",
                "username": name,
                "password": "password123",
            },
        )
        assert r.status_code == 201, r.text  # surface the real error if signup fails

    r = client.get("/leaderboard?limit=200")
    assert r.status_code == 200
    usernames = {row["username"] for row in r.json()}
    assert {"ulead1", "ulead2"}.issubset(usernames), usernames
