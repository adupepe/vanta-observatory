import json
import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path
from unittest.mock import patch

import server


class ValidationTests(unittest.TestCase):
    def valid_payload(self):
        return {
            "name": "Jan Kowalski",
            "email": "jan@example.com",
            "guests": "2",
            "date": (date.today() + timedelta(days=2)).isoformat(),
            "mission": "deep",
            "message": "Pierwsza obserwacja.",
            "consent": True,
        }

    def test_valid_request_is_normalized(self):
        clean, errors = server.validate(self.valid_payload())
        self.assertEqual(errors, {})
        self.assertEqual(clean["email"], "jan@example.com")
        self.assertEqual(clean["guests"], "2")

    def test_rejects_invalid_fields(self):
        payload = self.valid_payload()
        payload.update(
            {
                "name": "X",
                "email": "invalid",
                "guests": "10",
                "date": date.today().isoformat(),
                "mission": "unknown",
                "consent": False,
            }
        )
        _, errors = server.validate(payload)
        self.assertEqual(set(errors), {"name", "email", "guests", "date", "mission", "consent"})

    def test_save_is_atomic_and_round_trips(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "visits.json"
            sample = [{"id": "VX-123", "status": "new"}]
            with patch.object(server, "DATA", Path(directory)), patch.object(server, "VISITS_FILE", path):
                server.save_visits(sample)
                self.assertEqual(server.load_visits(), sample)
                self.assertEqual(json.loads(path.read_text(encoding="utf-8")), sample)


if __name__ == "__main__":
    unittest.main()
