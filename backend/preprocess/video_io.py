import tempfile
import os

async def save_video(upload_file):
    suffix = os.path.splitext(upload_file.filename)[1] or ".webm"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)

    content = await upload_file.read()
    tmp.write(content)
    tmp.close()

    return tmp.name
