import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

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


def test_dashboard_stats_matches_user_list_count(client, app):
    app.dependency_overrides[get_current_user] = lambda: FakeAdmin()
    try:
        stats_resp = client.get('/api/dashboard/stats')
        users_resp = client.get('/admin/users')
        assert stats_resp.status_code == 200
        assert users_resp.status_code == 200
        total_users = stats_resp.json()['total_users']
        user_list_len = len(users_resp.json())
        assert total_users == user_list_len, f"Inconsistency: stats total_users={total_users} but admin/users count={user_list_len}"
    finally:
        app.dependency_overrides.pop(get_current_user, None)

