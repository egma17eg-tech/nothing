#!/usr/bin/env python3
import argparse, json, sys, os, urllib.request, time

CACHE_DIR = os.path.expanduser("~/.cache/whisper")

MODEL_MAP = {
    "tiny":     "tiny",
    "base":     "base", 
    "small":    "small",
    "medium":   "medium",
    "large-v3": "large-v3",
}

def emit(obj):
    print(json.dumps(obj, ensure_ascii=False), flush=True)

def get_model_url(model_name):
    try:
        import whisper
        urls = whisper._MODELS
        return urls.get(model_name)
    except:
        return None

def model_path(model_name):
    fname = model_name.split("/")[-1]
    if not fname.endswith(".pt"):
        fname = fname + ".pt"
    return os.path.join(CACHE_DIR, fname)

def check_model_exists(model_name):
    p = model_path(model_name)
    if not os.path.exists(p):
        return False
    size = os.path.getsize(p)
    return size > 10_000_000  # at least 10MB = valid model file

def download_model(model_name):
    url = get_model_url(model_name)
    if not url:
        emit({"type": "error", "message": f"Unknown model: {model_name}"})
        return False

    dest = model_path(model_name)
    os.makedirs(CACHE_DIR, exist_ok=True)

    if check_model_exists(model_name):
        emit({"type": "model_ready", "cached": True, "path": dest})
        return True

    # Get file size
    try:
        req = urllib.request.Request(url, method='HEAD')
        with urllib.request.urlopen(req, timeout=10) as r:
            total = int(r.headers.get('Content-Length', 0))
    except:
        total = 0

    emit({
        "type": "download_start",
        "model": model_name,
        "totalBytes": total,
        "totalMB": round(total / (1024*1024), 0),
    })

    tmp = dest + ".download"
    try:
        downloaded = 0
        last_emit = 0
        start_time = time.time()

        with urllib.request.urlopen(url, timeout=30) as response, open(tmp, 'wb') as f:
            if total == 0:
                total = int(response.headers.get('Content-Length', 1))
            chunk_size = 1024 * 256  # 256KB chunks
            while True:
                buf = response.read(chunk_size)
                if not buf:
                    break
                f.write(buf)
                downloaded += len(buf)
                now = time.time()
                # emit every 0.5s to not flood the IPC
                if now - last_emit >= 0.5 or downloaded == total:
                    last_emit = now
                    pct = min(99, int(downloaded * 100 / total)) if total > 0 else 0
                    elapsed = now - start_time
                    speed = downloaded / elapsed if elapsed > 0 else 0
                    remaining = (total - downloaded) / speed if speed > 0 else 0
                    emit({
                        "type": "download_progress",
                        "progress": pct,
                        "downloadedMB": round(downloaded / (1024*1024), 1),
                        "totalMB": round(total / (1024*1024), 1),
                        "speedMBs": round(speed / (1024*1024), 1),
                        "remainingSec": int(remaining),
                    })

        os.rename(tmp, dest)
        emit({"type": "model_ready", "cached": False, "path": dest})
        return True

    except Exception as e:
        if os.path.exists(tmp):
            os.remove(tmp)
        emit({"type": "error", "message": f"Download failed: {str(e)}"})
        return False

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--action', default='transcribe', choices=['transcribe','check','download'])
    parser.add_argument('--file', default='')
    parser.add_argument('--language', default='ar')
    parser.add_argument('--model', default='small')
    parser.add_argument('--words-per-cue', type=int, default=3)
    args = parser.parse_args()

    model_name = MODEL_MAP.get(args.model, args.model)

    if args.action == 'check':
        ready = check_model_exists(model_name)
        emit({"type": "check_result", "model": args.model, "ready": ready,
              "path": model_path(model_name)})
        return

    if args.action == 'download':
        download_model(model_name)
        return

    # Transcribe
    if not args.file or not os.path.exists(args.file):
        emit({"type": "error", "message": f"File not found: {args.file}"})
        sys.exit(1)

    if not check_model_exists(model_name):
        if not download_model(model_name):
            sys.exit(1)
    else:
        emit({"type": "model_ready", "cached": True})

    try:
        import whisper
    except ImportError:
        emit({"type": "setup", "stage": "Installing engine", "progress": 0})
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "openai-whisper", "-q"],
                       capture_output=True)
        import whisper

    emit({"type": "setup", "stage": "Loading engine", "progress": 50})
    model = whisper.load_model(model_name, download_root=CACHE_DIR)
    emit({"type": "running", "progress": 0, "wordsFound": 0})

    lang = args.language if args.language in ('ar', 'en') else None
    result = model.transcribe(
        args.file, language=lang, word_timestamps=True, task='transcribe',
    )

    all_words = []
    for seg in result.get('segments', []):
        for w in seg.get('words', []):
            word = w['word'].strip()
            if word:
                all_words.append({
                    'word': word,
                    'start': round(w['start'], 3),
                    'end': round(w['end'], 3),
                })

    wpc = max(1, args.words_per_cue)
    cues = []
    for i in range(0, len(all_words), wpc):
        chunk = all_words[i:i+wpc]
        cues.append({
            'i': len(cues)+1,
            'a': fmt_time(chunk[0]['start']),
            'b': fmt_time(chunk[-1]['end']),
            't': ' '.join(c['word'] for c in chunk),
        })

    srt = '\n'.join(f"{c['i']}\n{c['a']} --> {c['b']}\n{c['t']}\n" for c in cues)
    emit({
        'type': 'done',
        'language': result.get('language', '?'),
        'wordCount': len(all_words),
        'cueCount': len(cues),
        'srtText': srt,
        'cues': cues[:200],
    })

def fmt_time(sec):
    h, rem = divmod(int(sec), 3600)
    m, s = divmod(rem, 60)
    ms = int(round((sec - int(sec)) * 1000))
    return f"{h:02}:{m:02}:{s:02},{ms:03}"

if __name__ == '__main__':
    main()
