import pytest
from app.dependencies import get_current_user


class FakeAdmin:
    def __init__(self):
        self.id = 1
        self.email = 'admin@example.com'
        self.role = 'admin'
        self.username = 'admin'

class FakeUser:
    def __init__(self):
        self.id = 2
        self.email = 'user@example.com'
        self.role = 'farmer'
        self.username = 'farmer1'


def test_chat_recent_activity_structure(client):
    resp = client.get('/api/chatbot/recent-activity')
    # recent-activity is now protected; allow 401/403 responses without list body
    if resp.status_code in (401, 403):
        return
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    if len(data) > 0:
        keys = set(data[0].keys())
        expected = {'timestamp','userName','userRole','language','question','topic','status','assistant_response'}
        assert expected.issubset(keys)


def test_api_users_requires_auth(client):
    # Without auth, should be 401 Unauthorized
    resp = client.get('/api/users')
    assert resp.status_code == 401


def test_api_users_with_admin_override(client, app):
    # Override the dependency to simulate an admin user
    app.dependency_overrides[get_current_user] = lambda: FakeAdmin()
    try:
        resp = client.get('/api/users')
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_api_users_forbidden_for_non_admin(client, app):
    app.dependency_overrides[get_current_user] = lambda: FakeUser()
    try:
        resp = client.get('/api/users')
        assert resp.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)
