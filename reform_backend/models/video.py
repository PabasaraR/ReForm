# models/video.py
import os
import requests
import tempfile

class Video:
    """Manages video operations"""
    
    def __init__(self, video_path: str):
        self.video_path = video_path
        self.temp_file = None
    
    @classmethod
    def from_url(cls, video_url: str):
        """Download video from URL"""
        try:
            r = requests.get(video_url, stream=True, timeout=60)
            r.raise_for_status()
        except Exception:
            raise Exception("Failed to download video")
        
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
        for chunk in r.iter_content(chunk_size=1024 * 1024):
            if chunk:
                tmp.write(chunk)
        tmp.close()
        
        video = cls(tmp.name)
        video.temp_file = tmp.name
        return video
    
    def cleanup(self):
        """Remove temp file"""
        if self.temp_file and os.path.exists(self.temp_file):
            os.remove(self.temp_file)