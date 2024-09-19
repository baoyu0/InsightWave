   import unittest
   import json
   from app import app

   class TestApp(unittest.TestCase):
       def setUp(self):
           self.client = app.test_client()

       def test_upload_data(self):
           data = {'file': (io.BytesIO(b'test data'), 'test.csv')}
           response = self.client.post('/api/data', data=data, content_type='multipart/form-data')
           self.assertEqual(response.status_code, 200)

       def test_visualize_data(self):
           data = {
               'data': {'column1': [1, 2, 3]},
               'chartType': 'histogram',
               'column': 'column1'
           }
           response = self.client.post('/api/visualize', json=data)
           self.assertEqual(response.status_code, 200)

   if __name__ == '__main__':
       unittest.main()