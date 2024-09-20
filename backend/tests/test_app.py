import unittest
import io
from app import app


class AppTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_upload_data(self):
        response = self.app.post(
            "/api/data",
            data=dict(file=(io.BytesIO(b"col1,col2\n1,2\n3,4"), "test.csv")),
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("data", response.json)

    def test_visualize_data(self):
        data = {
            "data": {"col1": [1, 2, 3], "col2": [4, 5, 6]},
            "chartType": "histogram",
            "column": "col1",
        }
        response = self.app.post("/api/visualize", json=data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("image", response.json)


if __name__ == "__main__":
    unittest.main()
