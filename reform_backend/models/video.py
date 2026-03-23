# models/video.py
import os
from urllib.parse import urlparse
import requests
import tempfile
#Manages video operations
class Video:
    
    def __init__(self, video_path: str):
        self.video_path = video_path
        self.temp_file = None
    
    # Download video from URL
    @classmethod
    def from_url(cls, video_url: str):
        # parse URL to check scheme
        parsed = urlparse(video_url)

        # allow only http and https
        if parsed.scheme not in ["http", "https"]:
            raise ValueError("Invalid URL scheme")
        # downloading video
        try:
            r = requests.get(video_url, stream=True, timeout=60)
            r.raise_for_status()
        except Exception:
            raise Exception("Failed to download video")
        # create temporary file to save video
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
        for chunk in r.iter_content(chunk_size=1024 * 1024):
            if chunk:
                tmp.write(chunk)
        tmp.close()
        # create Video object using downloaded file path
        video = cls(tmp.name)
        # store temp file path for later deletion
        video.temp_file = tmp.name
        return video
    
    def cleanup(self):
        # Remove temp file
        if self.temp_file and os.path.exists(self.temp_file):
            os.remove(self.temp_file)