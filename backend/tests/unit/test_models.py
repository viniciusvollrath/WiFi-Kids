# tests/unit/test_models.py
"""Unit tests for database models."""

import pytest
from datetime import datetime, timedelta
from api.db.models import Router, Device, Session, Command, Challenge, compute_ends_at


class TestRouter:
    """Test Router model."""
    
    @pytest.mark.unit
    def test_router_creation(self, sample_router):
        """Test router creation with valid data."""
        router = Router(**sample_router)
        assert router.id == "aa:bb:cc:dd:ee:ff"
        assert router.router_key == "test-router-key-123"
        assert router.created_at is not None
    
    @pytest.mark.unit
    def test_router_mac_normalization(self):
        """Test MAC address normalization."""
        router = Router(
            id="AA-BB-CC-DD-EE-FF",
            router_key="test-key"
        )
        assert router.id == "aa:bb:cc:dd:ee:ff"
    
    @pytest.mark.unit
    def test_router_empty_mac(self):
        """Test router with empty MAC address."""
        router = Router(
            id="",
            router_key="test-key"
        )
        assert router.id == ""


class TestDevice:
    """Test Device model."""
    
    @pytest.mark.unit
    def test_device_creation(self, sample_device):
        """Test device creation with valid data."""
        device = Device(**sample_device)
        assert device.mac == "11:22:33:44:55:66"
        assert device.router_id == "aa:bb:cc:dd:ee:ff"
        assert device.created_at is not None
    
    @pytest.mark.unit
    def test_device_mac_normalization(self):
        """Test MAC address normalization."""
        device = Device(
            mac="11-22-33-44-55-66",
            router_id="AA-BB-CC-DD-EE-FF"
        )
        assert device.mac == "11:22:33:44:55:66"
        assert device.router_id == "aa:bb:cc:dd:ee:ff"


class TestSession:
    """Test Session model."""
    
    @pytest.mark.unit
    def test_session_creation(self):
        """Test session creation with valid data."""
        session = Session(
            mac="11:22:33:44:55:66",
            router_id="aa:bb:cc:dd:ee:ff",
            ttl_sec=900
        )
        assert session.mac == "11:22:33:44:55:66"
        assert session.router_id == "aa:bb:cc:dd:ee:ff"
        assert session.ttl_sec == 900
        assert session.status == "active"
        assert session.started_at is not None
        assert session.ends_at is not None
    
    @pytest.mark.unit
    def test_session_ends_at_calculation(self):
        """Test session end time calculation."""
        start_time = datetime.now()
        ttl_sec = 900
        ends_at = compute_ends_at(start_time, ttl_sec)
        expected_end = start_time + timedelta(seconds=ttl_sec)
        assert abs((ends_at - expected_end).total_seconds()) < 1


class TestCommand:
    """Test Command model."""
    
    @pytest.mark.unit
    def test_command_creation(self):
        """Test command creation with valid data."""
        command = Command(
            router_id="aa:bb:cc:dd:ee:ff",
            action="grant_session",
            mac="11:22:33:44:55:66",
            ttl_sec=900
        )
        assert command.router_id == "aa:bb:cc:dd:ee:ff"
        assert command.action == "grant_session"
        assert command.mac == "11:22:33:44:55:66"
        assert command.ttl_sec == 900
        assert command.created_at is not None
        assert command.delivered_at is None


class TestChallenge:
    """Test Challenge model."""
    
    @pytest.mark.unit
    def test_challenge_creation(self, sample_challenge):
        """Test challenge creation with valid data."""
        challenge = Challenge(**sample_challenge)
        assert challenge.id == "test-challenge-001"
        assert challenge.mac == "11:22:33:44:55:66"
        assert challenge.router_id == "aa:bb:cc:dd:ee:ff"
        assert challenge.attempts_left == 2
        assert challenge.status == "open"
        assert challenge.created_at is not None
        assert "questions" in challenge.payload
        assert "answer_key" in challenge.payload
        assert "metadata" in challenge.payload
    
    @pytest.mark.unit
    def test_challenge_mac_normalization(self):
        """Test MAC address normalization in challenge."""
        challenge = Challenge(
            id="test-001",
            mac="11-22-33-44-55-66",
            router_id="AA-BB-CC-DD-EE-FF",
            payload={"test": "data"},
            attempts_left=2
        )
        assert challenge.mac == "11:22:33:44:55:66"
        assert challenge.router_id == "aa:bb:cc:dd:ee:ff"
    
    @pytest.mark.unit
    def test_challenge_default_values(self):
        """Test challenge default values."""
        challenge = Challenge(
            id="test-001",
            mac="11:22:33:44:55:66",
            router_id="aa:bb:cc:dd:ee:ff",
            payload={"test": "data"}
        )
        assert challenge.attempts_left == 2
        assert challenge.status == "open"
    
    @pytest.mark.unit
    def test_challenge_payload_structure(self, sample_challenge):
        """Test challenge payload structure."""
        challenge = Challenge(**sample_challenge)
        payload = challenge.payload
        
        # Check questions structure
        assert "questions" in payload
        assert len(payload["questions"]) > 0
        question = payload["questions"][0]
        assert "id" in question
        assert "type" in question
        assert "prompt" in question
        assert "options" in question
        assert "answer_len" in question
        
        # Check answer key
        assert "answer_key" in payload
        assert "q1" in payload["answer_key"]
        
        # Check metadata
        assert "metadata" in payload
        metadata = payload["metadata"]
        assert "persona" in metadata
        assert "subject" in metadata
        assert "difficulty" in metadata
        assert "agent_type" in metadata


class TestModelValidation:
    """Test model validation and constraints."""
    
    @pytest.mark.unit
    def test_router_required_fields(self):
        """Test router required fields."""
        # Router should work with valid data
        router = Router(id="aa:bb:cc:dd:ee:ff", router_key="test-key")
        assert router.id == "aa:bb:cc:dd:ee:ff"
        assert router.router_key == "test-key"
    
    @pytest.mark.unit
    def test_device_required_fields(self):
        """Test device required fields."""
        # Device should work with valid data
        device = Device(mac="11:22:33:44:55:66", router_id="aa:bb:cc:dd:ee:ff")
        assert device.mac == "11:22:33:44:55:66"
        assert device.router_id == "aa:bb:cc:dd:ee:ff"
    
    @pytest.mark.unit
    def test_session_required_fields(self):
        """Test session required fields."""
        # Session should work with valid data
        session = Session(mac="11:22:33:44:55:66", router_id="aa:bb:cc:dd:ee:ff", ttl_sec=900)
        assert session.mac == "11:22:33:44:55:66"
        assert session.router_id == "aa:bb:cc:dd:ee:ff"
        assert session.ttl_sec == 900
    
    @pytest.mark.unit
    def test_command_required_fields(self):
        """Test command required fields."""
        # Command should work with valid data
        command = Command(router_id="aa:bb:cc:dd:ee:ff", action="grant_session", mac="11:22:33:44:55:66", ttl_sec=900)
        assert command.router_id == "aa:bb:cc:dd:ee:ff"
        assert command.action == "grant_session"
        assert command.mac == "11:22:33:44:55:66"
        assert command.ttl_sec == 900
    
    @pytest.mark.unit
    def test_challenge_required_fields(self):
        """Test challenge required fields."""
        # Challenge should work with valid data
        challenge = Challenge(id="test-001", mac="11:22:33:44:55:66", router_id="aa:bb:cc:dd:ee:ff", payload={"test": "data"})
        assert challenge.id == "test-001"
        assert challenge.mac == "11:22:33:44:55:66"
        assert challenge.router_id == "aa:bb:cc:dd:ee:ff"
        assert challenge.payload == {"test": "data"}


class TestModelRelationships:
    """Test model relationships and foreign keys."""
    
    @pytest.mark.unit
    def test_challenge_analytics_relationship(self, create_challenge):
        """Test challenge analytics relationship."""
        challenge = create_challenge
        # The relationship should be available
        assert hasattr(challenge, 'analytics')
        # Initially no analytics
        assert challenge.analytics is None
