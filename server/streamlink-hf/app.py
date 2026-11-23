import os
import time
import shutil
import threading
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import FastAPI, Header, HTTPException, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import yt_dlp
import gradio as gr

# Satisfy Hugging Face ZeroGPU supervisor requirement
try:
    import spaces

    @spaces.GPU
    def _zerogpu_init():
        return True
except Exception:
    pass

API_KEY = os.getenv("API_KEY", "flexnit-streamlink-secret-2026")
DOWNLOAD_DIR = Path(os.getenv("DOWNLOAD_DIR", "/tmp/streamlink_downloads"))
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Flexnit StreamLink High-Speed Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory jobs tracking
jobs_lock = threading.Lock()
jobs: Dict[str, Dict[str, Any]] = {}
start_time = time.time()


class DownloadRequest(BaseModel):
    url: Optional[str] = None
    stream_url: Optional[str] = None
    format: Optional[str] = "mp4"


def verify_api_key(x_api_key: Optional[str] = Header(None)):
    if not API_KEY:
        return True
    if x_api_key and x_api_key == API_KEY:
        return True
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API Key")


def run_ytdlp_download(job_id: str, target_url: str):
    output_template = str(DOWNLOAD_DIR / f"{job_id}.%(ext)s")

    def progress_hook(d):
        with jobs_lock:
            if job_id not in jobs:
                return
            current_job = jobs[job_id]

            if d.get("status") == "downloading":
                total_bytes = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                downloaded_bytes = d.get("downloaded_bytes") or 0
                
                percent = 5.0
                if total_bytes > 0:
                    percent = min(round((downloaded_bytes / total_bytes) * 100, 1), 99.0)
                elif d.get("_percent_str"):
                    try:
                        clean_str = d["_percent_str"].replace("%", "").strip()
                        percent = min(float(clean_str), 99.0)
                    except:
                        pass

                speed_str = d.get("_speed_str") or (
                    f"{round(d['speed'] / 1024 / 1024, 2)} MB/s" if d.get("speed") else None
                )
                eta_str = d.get("_eta_str") or (f"{d['eta']}s" if d.get("eta") else None)

                current_job.update({
                    "status": "downloading",
                    "progress": percent,
                    "phase": f"Downloading stream ({percent}%)",
                    "speed": speed_str,
                    "eta": eta_str,
                    "updated_at": time.time(),
                })
            elif d.get("status") == "finished":
                current_job.update({
                    "status": "downloading",
                    "progress": 99.0,
                    "phase": "Finalizing MP4 remux...",
                    "updated_at": time.time(),
                })

    ydl_opts = {
        "format": "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bestvideo+bestaudio/best",
        "outtmpl": output_template,
        "concurrent_fragment_downloads": 8,  # High-speed parallel segment extraction
        "retries": 10,
        "fragment_retries": 10,
        "quiet": True,
        "no_warnings": True,
        "progress_hooks": [progress_hook],
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Referer": "https://vidspark.to/",
            "Origin": "https://vidspark.to",
        },
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([target_url])

        completed_file = None
        for candidate in DOWNLOAD_DIR.glob(f"{job_id}.*"):
            if candidate.suffix not in [".part", ".ytdl"]:
                completed_file = candidate
                break

        with jobs_lock:
            if completed_file and completed_file.exists():
                jobs[job_id].update({
                    "status": "completed",
                    "progress": 100.0,
                    "phase": "Ready (Saved)",
                    "file_path": str(completed_file),
                    "file_size": completed_file.stat().st_size,
                    "updated_at": time.time(),
                })
            else:
                jobs[job_id].update({
                    "status": "failed",
                    "progress": 0,
                    "phase": "Failed",
                    "error": "Media file not found after download completion",
                    "updated_at": time.time(),
                })
    except Exception as e:
        err_msg = str(e)
        with jobs_lock:
            jobs[job_id].update({
                "status": "failed",
                "progress": 0,
                "phase": "Failed",
                "error": err_msg,
                "updated_at": time.time(),
            })


# Periodic Background Disk Cleanup (deletes files older than 30 minutes)
def cleanup_old_files():
    while True:
        try:
            now = time.time()
            cutoff = now - 1800  # 30 minutes retention
            for item in DOWNLOAD_DIR.glob("*"):
                if item.is_file():
                    mtime = item.stat().st_mtime
                    if mtime < cutoff:
                        item.unlink(missing_ok=True)
            with jobs_lock:
                expired_keys = [
                    k for k, v in jobs.items() if (now - v.get("created_at", now)) > 3600
                ]
                for k in expired_keys:
                    del jobs[k]
        except Exception as e:
            print(f"Cleanup error: {e}")
        time.sleep(600)  # run every 10 minutes


threading.Thread(target=cleanup_old_files, daemon=True).start()


@app.get("/health")
def health():
    total, used, free = shutil.disk_usage(DOWNLOAD_DIR)
    return {
        "status": "ok",
        "service": "Flexnit StreamLink High-Speed Service",
        "uptime_seconds": int(time.time() - start_time),
        "active_jobs": len([j for j in jobs.values() if j.get("status") == "downloading"]),
        "disk_free_gb": round(free / (1024 ** 3), 2),
        "disk_total_gb": round(total / (1024 ** 3), 2),
    }


@app.post("/api/streamlink/download")
@app.post("/api/v1/download")
def start_download(
    req: DownloadRequest,
    background_tasks: BackgroundTasks,
    x_api_key: Optional[str] = Header(None),
):
    verify_api_key(x_api_key)
    target = req.stream_url or req.url
    if not target:
        raise HTTPException(status_code=400, detail="Missing target url or stream_url")

    job_id = f"sl_{int(time.time() * 1000)}"
    with jobs_lock:
        jobs[job_id] = {
            "id": job_id,
            "job_id": job_id,
            "status": "downloading",
            "progress": 2.0,
            "phase": "Connecting to high-speed stream...",
            "target_url": target,
            "created_at": time.time(),
            "updated_at": time.time(),
        }

    background_tasks.add_task(run_ytdlp_download, job_id, target)
    return {"job_id": job_id, "id": job_id, "status": "downloading"}


@app.get("/api/streamlink/jobs/{job_id}")
@app.get("/api/v1/jobs/{job_id}")
def get_job(job_id: str, x_api_key: Optional[str] = Header(None)):
    verify_api_key(x_api_key)
    with jobs_lock:
        job = jobs.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
        return job


@app.get("/api/streamlink/jobs/{job_id}/download")
@app.get("/api/v1/jobs/{job_id}/download")
def download_result(job_id: str, x_api_key: Optional[str] = Header(None)):
    verify_api_key(x_api_key)
    with jobs_lock:
        job = jobs.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        if job.get("status") != "completed" or not job.get("file_path"):
            raise HTTPException(status_code=400, detail="Job is not completed yet")
        file_path = Path(job["file_path"])

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Downloaded media file has expired or was deleted")

    return FileResponse(
        path=str(file_path),
        media_type="video/mp4",
        filename=file_path.name,
    )


# Mount Gradio UI so Hugging Face Space detects it as healthy and running
with gr.Blocks(title="Flexnit StreamLink High-Speed Service") as demo:
    gr.Markdown("# ⚡ Flexnit StreamLink High-Speed Service")
    gr.Markdown(
        "Dedicated **8-stream concurrent segment downloader & remuxer** powering offline downloads in Flexnit."
    )
    with gr.Row():
        status_box = gr.Textbox(label="Service Status", value="Operational (8 Concurrent Streams)")
        engine_box = gr.Textbox(label="Engine", value="yt-dlp + FFmpeg + FastAPI")

app = gr.mount_gradio_app(app, demo, path="/")

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=int(os.environ.get("PORT", 7860)))
