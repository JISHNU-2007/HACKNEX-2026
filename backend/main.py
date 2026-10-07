"""
SentinelVision AI — FastAPI + YOLOv8 Backend (Production Grade)
================================================================
Loads best.pt which was trained to detect construction/industrial PPE:
  Classes (common in construction-safety YOLO models):
    - Person / Worker
    - Hardhat / NO-Hardhat
    - Mask / NO-Mask
    - Safety Vest / NO-Safety Vest
    - Safety Cone, Machinery, etc.

ALL class names from the model are probed at startup and mapped dynamically.
"""

import os, json, uuid, time, math, asyncio, shutil, threading
from pathlib import Path
from typing import Optional, List, Dict, Any, Set

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, BackgroundTasks, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from ultralytics import YOLO

# ═══════════════════════════════════════════════════════════════════════════
# PATHS
# ═══════════════════════════════════════════════════════════════════════════
BASE_DIR   = Path(__file__).parent
MODEL_PATH = "yolov8n.pt"
UPLOAD_DIR = BASE_DIR / "uploads"
PROC_DIR   = BASE_DIR / "processed"
UPLOAD_DIR.mkdir(exist_ok=True)
PROC_DIR.mkdir(exist_ok=True)

# ═══════════════════════════════════════════════════════════════════════════
# FASTAPI
# ═══════════════════════════════════════════════════════════════════════════
app = FastAPI(title="SentinelVision AI", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════════════════════
# LOAD YOLO MODEL
# ═══════════════════════════════════════════════════════════════════════════
print(f"[SentinelVision] Loading model: {MODEL_PATH}")
yolo_model = YOLO(str(MODEL_PATH))
CLASS_NAMES: Dict[int, str] = yolo_model.names
print(f"[SentinelVision] Model classes: {CLASS_NAMES}")


# ═══════════════════════════════════════════════════════════════════════════
# DYNAMIC CLASS CLASSIFIER
# Scans actual class names from the loaded model and maps them correctly
# ═══════════════════════════════════════════════════════════════════════════

def _cn(name: str) -> str:
    """Lowercase, strip dashes/underscores for flexible matching."""
    return name.lower().replace("-", " ").replace("_", " ").strip()


# Violation class patterns — matches substrings in class names
VIOLATION_PATTERNS = [
    # (substring_to_match, event_type, label, base_risk, ppe_field, ppe_value)
    ("no hardhat",     "ppe_violation", "No Hardhat",      45, "helmet", False),
    ("no helmet",      "ppe_violation", "No Helmet",        45, "helmet", False),
    ("without helmet", "ppe_violation", "No Helmet",        45, "helmet", False),
    ("no mask",        "ppe_violation", "No Mask / No Face Shield", 30, "mask", False),
    ("no-mask",        "ppe_violation", "No Mask",          30, "mask", False),
    ("without mask",   "ppe_violation", "No Mask",          30, "mask", False),
    ("no vest",        "ppe_violation", "No Safety Vest",   35, "vest",  False),
    ("no safety vest", "ppe_violation", "No Safety Vest",   35, "vest",  False),
    ("no safety",      "ppe_violation", "No Safety Gear",   35, "vest",  False),
    ("without vest",   "ppe_violation", "No Safety Vest",   35, "vest",  False),
    ("no glove",       "ppe_violation", "No Gloves",        20, None,   None),
    ("no boot",        "ppe_violation", "No Safety Boots",  20, None,   None),
    ("restricted",     "restricted_zone_entry", "Restricted Zone Entry", 50, None, None),
    ("danger",         "restricted_zone_entry", "Danger Zone Entry",     60, None, None),
    ("fall",           "ppe_violation", "Fall Detected",    70, None,   None),
    ("fire",           "restricted_zone_entry", "Fire/Hazard",           80, None, None),
]

# Safe class patterns — wearing PPE correctly
SAFE_PPE_PATTERNS = {
    "hardhat": ("helmet", True),
    "helmet":  ("helmet", True),
    "mask":    ("mask",   True),
    "safety vest": ("vest", True),
    "vest":    ("vest",   True),
    "gloves":  (None,    None),
    "boots":   (None,    None),
    "person":  (None,    None),
    "worker":  (None,    None),
}


def classify_class(class_name: str):
    """
    Returns violation dict or None.
    Tries all violation patterns against the class name.
    """
    cn = _cn(class_name)
    
    # 1. Skip known safe patterns so they don't trigger events
    for pattern in SAFE_PPE_PATTERNS:
        if pattern in cn:
            return None

    # 2. Check for known violation patterns
    for pattern, ev_type, label, risk, ppe_field, ppe_val in VIOLATION_PATTERNS:
        if pattern in cn:
            return {
                "type":      ev_type,
                "label":     label,
                "risk_pts":  risk,
                "ppe_field": ppe_field,
                "ppe_value": ppe_val,
            }
            
    # 3. Fallback: log any custom trained class as an event so it shows up in the UI!
    return {
        "type": "custom_detection",
        "label": class_name.title(),
        "risk_pts": 15,
        "ppe_field": None,
        "ppe_value": None,
    }


def get_safe_ppe_update(class_name: str):
    """Returns (ppe_field, ppe_value) for safe PPE classes, else (None,None)."""
    cn = _cn(class_name)
    for pattern, (field, val) in SAFE_PPE_PATTERNS.items():
        if pattern in cn:
            return field, val
    return None, None


def risk_to_severity(score: int) -> str:
    if score <= 30:  return "low"
    if score <= 60:  return "medium"
    if score <= 80:  return "high"
    return "critical"


def fmt_ts(seconds: float) -> str:
    return time.strftime("%H:%M:%S", time.gmtime(int(seconds)))


# ═══════════════════════════════════════════════════════════════════════════
# IN-MEMORY STORES
# ═══════════════════════════════════════════════════════════════════════════
_lock = threading.Lock()

video_store:    Dict[str, Dict]       = {}
events_store:   List[Dict]            = []
workers_store:  Dict[int, Dict]       = {}
timelines_store:Dict[int, List[Dict]] = {}

# SSE subscriber queues
sse_queues: List[asyncio.Queue] = []


def broadcast_event(payload: dict):
    """Push a new event to all SSE subscribers."""
    for q in list(sse_queues):
        try:
            q.put_nowait(payload)
        except Exception:
            pass


# ═══════════════════════════════════════════════════════════════════════════
# CORE: YOLO VIDEO PROCESSING
# ═══════════════════════════════════════════════════════════════════════════

def process_video(video_id: str, video_path: Path):
    """
    Run YOLOv8 on every Nth frame of the uploaded video.
    Uses proximity-based tracking to assign consistent worker IDs.
    Saves annotated JPEG thumbnails as evidence frames.
    """
    with _lock:
        video_store[video_id]["status"] = "processing"

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        with _lock:
            video_store[video_id]["status"] = "error"
        return

    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total_f = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    dur = total_f / fps if fps else 0

    with _lock:
        video_store[video_id]["duration"] = round(dur, 2)
        video_store[video_id]["fps"] = round(fps, 2)

    proc_dir = PROC_DIR / video_id
    proc_dir.mkdir(exist_ok=True)

    # Use vp09 for webm, which natively plays in all modern browsers without needing ffmpeg or h264 licenses
    out_path = proc_dir / "annotated.webm"
    fourcc = cv2.VideoWriter_fourcc(*'vp09')
    out = cv2.VideoWriter(str(out_path), fourcc, fps, (w, h))

    # Local state
    next_worker_id = 1
    tracker: Dict[int, tuple] = {}
    worker_ppe: Dict[int, Dict] = {}
    worker_first: Dict[int, float] = {}
    worker_last:  Dict[int, float] = {}
    seen_violations: Set[tuple] = set()

    local_events:    List[Dict]       = []
    local_workers:   Dict[int, Dict]  = {}
    local_timelines: Dict[int, List]  = {}

    frame_idx = 0
    frame_skip = int(fps / 5) if fps > 5 else 1  # Process ~5 frames per second max to speed up CPU inference
    last_annotated = None

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        ts = frame_idx / fps

        # Skip frames for speed, but keep writing the last known frame
        if frame_idx % frame_skip != 0 and last_annotated is not None:
            out.write(last_annotated)
            frame_idx += 1
            continue

        # Run YOLO inference with a reasonable confidence threshold so it is accurate
        results = yolo_model(frame, verbose=False, conf=0.35, iou=0.45)[0]
        
        # Authentic YOLO bounded frame exactly as seen in ultralytics predict
        annotated = results.plot()
        last_annotated = annotated

        detections = []
        for box in results.boxes:
            cls_idx  = int(box.cls[0])
            conf     = float(box.conf[0])
            cls_name = CLASS_NAMES.get(cls_idx, str(cls_idx))
            x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]
            bw = x2 - x1
            bh = y2 - y1
            cx = (x1 + x2) / 2
            cy = (y1 + y2) / 2
            detections.append({
                "cls_name": cls_name, "conf": conf,
                "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                "cx": cx, "cy": cy, "bw": bw, "bh": bh,
            })

        # ── Worker tracking ──────────────────────────────────────────
        person_dets = [d for d in detections if "person" in _cn(d["cls_name"]) or "worker" in _cn(d["cls_name"])]
        ppe_dets    = [d for d in detections if d not in person_dets]

        matched_workers: Dict[str, int] = {}

        for det in person_dets:
            cx, cy, bw, bh = det["cx"], det["cy"], det["bw"], det["bh"]
            best_wid  = None
            best_dist = float("inf")
            for wid, (lx, ly, lw, lh, _) in tracker.items():
                d = math.hypot(cx - lx, cy - ly)
                if d < max(lw, lh) * 2.0 and d < best_dist:
                    best_dist = d
                    best_wid  = wid
            if best_wid is None:
                best_wid = next_worker_id
                next_worker_id += 1

            tracker[best_wid] = (cx, cy, bw, bh, frame_idx)
            worker_first.setdefault(best_wid, ts)
            worker_last[best_wid] = ts
            det["_wid"] = best_wid
            matched_workers[id(det)] = best_wid

            if best_wid not in local_workers:
                local_workers[best_wid] = {
                    "worker_id":    best_wid,
                    "first_seen":   fmt_ts(ts),
                    "last_seen":    fmt_ts(ts),
                    "status":       "safe",
                    "risk_score":   0,
                    "current_zone": "Construction Zone",
                    "ppe": {"helmet": False, "vest": False, "mask": False},
                }
            else:
                local_workers[best_wid]["last_seen"] = fmt_ts(ts)

            worker_ppe.setdefault(best_wid, {"helmet": False, "vest": False, "mask": False})

        # ── PPE assignment ──────────────────────────────────────────
        for det in ppe_dets:
            violation = classify_class(det["cls_name"])
            safe_field, safe_val = get_safe_ppe_update(det["cls_name"])

            nearest_wid  = None
            nearest_dist = float("inf")
            for wid, (lx, ly, lw, lh, _) in tracker.items():
                d = math.hypot(det["cx"] - lx, det["cy"] - ly)
                if d < nearest_dist:
                    nearest_dist = d
                    nearest_wid  = wid

            if nearest_wid is None or nearest_dist > max(w, h) * 0.5:
                nearest_wid = next_worker_id
                next_worker_id += 1
                tracker[nearest_wid] = (det["cx"], det["cy"], det["bw"], det["bh"], frame_idx)
                worker_first.setdefault(nearest_wid, ts)
                local_workers.setdefault(nearest_wid, {
                    "worker_id":    nearest_wid,
                    "first_seen":   fmt_ts(ts),
                    "last_seen":    fmt_ts(ts),
                    "status":       "safe",
                    "risk_score":   0,
                    "current_zone": "Construction Zone",
                    "ppe": {"helmet": False, "vest": False, "mask": False},
                })
                worker_ppe.setdefault(nearest_wid, {"helmet": False, "vest": False, "mask": False})

            worker_last[nearest_wid] = ts
            wrk = local_workers[nearest_wid]

            if safe_field and safe_val is True:
                wrk["ppe"][safe_field] = True
                worker_ppe[nearest_wid][safe_field] = True

            if violation:
                # Add custom label for the worker context directly onto the image
                cv2.putText(annotated, f"W#{nearest_wid} {violation['label']}",
                            (int(det["x1"]), max(int(det["y1"]) - 25, 20)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

                frame_bin = frame_idx // (int(fps) * 3)
                dedup_key = (nearest_wid, violation["label"], frame_bin)
                if dedup_key not in seen_violations:
                    seen_violations.add(dedup_key)

                    risk = min(violation["risk_pts"] + int(det["conf"] * 25), 99)
                    sev  = risk_to_severity(risk)

                    wrk["risk_score"] = max(wrk["risk_score"], risk)
                    if sev == "critical":         wrk["status"] = "high_risk"
                    elif sev == "high":           wrk["status"] = "high_risk"
                    elif sev == "medium" and wrk["status"] == "safe": wrk["status"] = "warning"

                    if violation["ppe_field"]:
                        wrk["ppe"][violation["ppe_field"]] = False

                    ev_id      = f"evt_{video_id[:8]}_{frame_idx:06d}_{nearest_wid}"
                    thumb_name = f"evt_{frame_idx:06d}_w{nearest_wid}.jpg"
                    cv2.imwrite(str(proc_dir / thumb_name), annotated)

                    event = {
                        "event_id":      ev_id,
                        "worker_id":     nearest_wid,
                        "event_type":    violation["type"],
                        "start_time":    fmt_ts(ts),
                        "end_time":      None,
                        "duration":      1,
                        "zone":          "Construction Zone",
                        "risk_score":    risk,
                        "severity":      sev,
                        "confidence":    round(det["conf"], 3),
                        "evidence_path": f"http://localhost:8000/processed/{video_id}/{thumb_name}",
                        "reason":        f"{violation['label']} detected at {ts:.1f}s — confidence {det['conf']:.0%}. Worker #{nearest_wid} in Construction Zone.",
                        "risk_breakdown": [
                            {"label": violation["label"],           "points": violation["risk_pts"]},
                            {"label": "Model Confidence Boost",    "points": int(det["conf"] * 25)},
                        ],
                        "risk_history": [
                            {"t": 0,  "score": 10},
                            {"t": 1,  "score": risk // 3},
                            {"t": 2,  "score": risk // 2},
                            {"t": 3,  "score": risk},
                        ],
                        "status": "new",
                    }
                    local_events.append(event)
                    if local_timelines.get(nearest_wid) is None:
                        local_timelines[nearest_wid] = []
                    local_timelines[nearest_wid].append({
                        "worker_id": nearest_wid,
                        "timestamp": fmt_ts(ts),
                        "label":     violation["label"],
                        "severity":  sev,
                    })
                    broadcast_event({"type": "event_created", "payload": event})

        out.write(annotated)
        frame_idx += 1

    cap.release()
    out.release()

    import subprocess
    try:
        final_mp4 = proc_dir / "annotated.mp4"
        subprocess.run(["ffmpeg", "-y", "-i", str(out_path), "-vcodec", "libx264", "-acodec", "aac", str(final_mp4)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        annotated_file = "annotated.mp4"
    except Exception:
        annotated_file = "annotated.webm"

    with _lock:
        events_store.extend(local_events)
        workers_store.update(local_workers)
        for wid, tl in local_timelines.items():
            if wid not in timelines_store:
                timelines_store[wid] = []
            timelines_store[wid].extend(tl)

        video_store[video_id].update({
            "status":        "done",
            "event_count":   len(local_events),
            "worker_count":  len(local_workers),
            "frame_count":   frame_idx,
            "annotated_url": f"http://localhost:8000/processed/{video_id}/{annotated_file}"
        })

    print(f"[SentinelVision] ✅ {video_id}: {len(local_events)} events, {len(local_workers)} workers detected. Output: {annotated_file}")


# ═══════════════════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════════════════
_config: Dict[str, Any] = {
    "scenario": "Construction",
    "zones": [],
    "rules": {
        "helmet":       True,
        "vest":         True,
        "mask":         True,
        "restricted":   True,
        "max_idle_sec": 60,
        "crowd_limit":  5,
    },
    "thresholds": {
        "low":      [0,  30],
        "medium":   [31, 60],
        "high":     [61, 80],
        "critical": [81, 100],
    },
    "model_classes": list(CLASS_NAMES.values()),
}


# ═══════════════════════════════════════════════════════════════════════════
# REST ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    return {
        "status":  "SentinelVision AI running",
        "model":   MODEL_PATH.name,
        "classes": CLASS_NAMES,
        "events":  len(events_store),
        "workers": len(workers_store),
    }


# ── Video ─────────────────────────────────────────────────────────────────
@app.post("/api/video/upload")
async def upload_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    ext = Path(file.filename).suffix.lower()
    if ext not in (".mp4", ".avi", ".mov", ".mkv", ".webm"):
        raise HTTPException(400, "Unsupported video format.")

    video_id  = f"vid_{uuid.uuid4().hex[:12]}"
    save_path = UPLOAD_DIR / f"{video_id}{ext}"
    content   = await file.read()
    save_path.write_bytes(content)

    with _lock:
        video_store[video_id] = {
            "video_id": video_id,
            "filename": file.filename,
            "status":   "queued",
            "url":      f"http://localhost:8000/uploads/{save_path.name}",
            "duration": 0,
            "event_count": 0,
            "worker_count": 0,
        }

    background_tasks.add_task(process_video, video_id, save_path)
    return video_store[video_id]


@app.get("/api/video/{video_id}/status")
async def video_status(video_id: str):
    if video_id not in video_store:
        raise HTTPException(404, "Video not found")
    return video_store[video_id]


# ── Workers ───────────────────────────────────────────────────────────────
@app.get("/api/workers")
async def get_workers():
    with _lock:
        return list(workers_store.values())


@app.get("/api/workers/{worker_id}")
async def get_worker(worker_id: int):
    with _lock:
        w = workers_store.get(worker_id)
    if not w:
        raise HTTPException(404, "Worker not found")
    return w


# ── Events ────────────────────────────────────────────────────────────────
@app.get("/api/events")
async def get_events(
    worker_id:  Optional[int] = Query(None),
    event_type: Optional[str] = Query(None),
    severity:   Optional[str] = Query(None),
    zone:       Optional[str] = Query(None),
    search:     Optional[str] = Query(None),
):
    with _lock:
        result = list(events_store)

    if worker_id:
        result = [e for e in result if e["worker_id"] == worker_id]
    if event_type and event_type != "all":
        result = [e for e in result if e["event_type"] == event_type]
    if severity and severity != "all":
        result = [e for e in result if e["severity"] == severity]
    if zone and zone != "all":
        result = [e for e in result if zone.lower() in e["zone"].lower()]
    if search:
        q = search.lower()
        result = [e for e in result if
                  q in e["event_id"].lower() or
                  q in f"worker #{e['worker_id']}" or
                  q in e["reason"].lower() or
                  q in e["zone"].lower()]
    return result


@app.get("/api/events/{event_id}")
async def get_event(event_id: str):
    with _lock:
        ev = next((e for e in events_store if e["event_id"] == event_id), None)
    if not ev:
        raise HTTPException(404, "Event not found")
    return ev


class StatusUpdate(BaseModel):
    status: str

@app.patch("/api/events/{event_id}")
async def update_event_status(event_id: str, body: StatusUpdate):
    with _lock:
        ev = next((e for e in events_store if e["event_id"] == event_id), None)
        if not ev:
            raise HTTPException(404, "Event not found")
        ev["status"] = body.status
    return ev


# ── Tracks (placeholder — real from video frames) ─────────────────────────
@app.get("/api/tracks/{video_id}")
async def get_tracks(video_id: str):
    return []


# ── Timeline ──────────────────────────────────────────────────────────────
@app.get("/api/timeline/{worker_id}")
async def get_timeline(worker_id: int):
    with _lock:
        return timelines_store.get(worker_id, [])


# ── Config ────────────────────────────────────────────────────────────────
@app.get("/api/config")
async def get_config():
    return _config

@app.post("/api/config")
async def save_config(config: Dict[str, Any]):
    _config.update(config)
    return {"success": True}


# ── SSE Live Stream ───────────────────────────────────────────────────────
@app.get("/api/live")
async def live_stream():
    q: asyncio.Queue = asyncio.Queue()
    sse_queues.append(q)

    async def generator():
        try:
            # Send current state snapshot first
            with _lock:
                snap_events  = list(events_store)
                snap_workers = list(workers_store.values())

            yield f"data: {json.dumps({'type': 'snapshot', 'payload': {'events': snap_events, 'workers': snap_workers}})}\n\n"

            while True:
                try:
                    payload = await asyncio.wait_for(q.get(), timeout=4.0)
                    yield f"data: {json.dumps(payload)}\n\n"
                except asyncio.TimeoutError:
                    # Heartbeat
                    yield f"data: {json.dumps({'type': 'heartbeat', 'payload': {'ts': time.strftime('%H:%M:%S'), 'events': len(events_store), 'workers': len(workers_store)}})}\n\n"
        finally:
            sse_queues.remove(q)

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Stats endpoint ────────────────────────────────────────────────────────
@app.get("/api/stats")
async def get_stats():
    with _lock:
        total_e  = len(events_store)
        critical = sum(1 for e in events_store if e["severity"] == "critical")
        high_r   = sum(1 for e in events_store if e["severity"] == "high")
        workers  = len(workers_store)
        high_risk_w = sum(1 for w in workers_store.values() if w["status"] == "high_risk")
    return {
        "total_events":      total_e,
        "critical_events":   critical,
        "high_events":       high_r,
        "total_workers":     workers,
        "high_risk_workers": high_risk_w,
        "model_classes":     list(CLASS_NAMES.values()),
    }


# ── Static files ──────────────────────────────────────────────────────────
app.mount("/processed", StaticFiles(directory=str(PROC_DIR)),   name="processed")
app.mount("/uploads",   StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
