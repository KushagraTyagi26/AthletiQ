"""Cache a fitted polynomial model, keyed by source file contents and training version."""
from hashlib import sha256
from io import BytesIO
from pathlib import Path
from threading import Lock
import joblib
import pandas as pd
from .model import train

MODEL_VERSION = 'quadratic-v2-group-split-2026-09'
ROOT = Path(__file__).resolve().parents[2]
ARTIFACT = ROOT / 'models' / 'athletiq_model.joblib'
_lock = Lock()
_cached_key = None
_cached_state = None

def build(raw_bytes: bytes, source: str):
    df,model,metrics,curve = train(pd.read_csv(BytesIO(raw_bytes)))
    sample = df.sample(min(len(df),350),random_state=42).sort_values('training_load')
    state = {
        'source': source,
        'model': model,
        'metrics': metrics,
        'curve': curve,
        'analysis': {
            'official_dataset': source == 'official',
            'rows': len(df),
            'athletes': int(df.athlete_id.nunique()),
            'target': 'Measured blood lactate (mmol/L)' if source == 'official' else 'Uploaded outcome units',
            'metrics': metrics,
            'curve': curve,
            'points': [{'load':float(x),'score':float(y)} for x,y in zip(sample.training_load,sample.performance_score)],
        },
    }
    return state

def _key(raw_bytes: bytes, source: str):
    return sha256(MODEL_VERSION.encode() + b'\0' + source.encode() + b'\0' + raw_bytes).hexdigest()

def _save(key: str, state: dict, artifact: Path):
    artifact.parent.mkdir(parents=True,exist_ok=True)
    temp = artifact.with_suffix('.tmp')
    joblib.dump({'key':key,'state':state},temp)
    temp.replace(artifact)

def get_state(source_file: Path, source: str, artifact: Path = ARTIFACT):
    """Load an existing local model or train once if dataset/version changed."""
    global _cached_key,_cached_state
    raw=source_file.read_bytes()
    key=_key(raw,source)
    with _lock:
        if artifact == ARTIFACT and key == _cached_key and _cached_state is not None:
            return _cached_state
        if artifact.exists():
            try:
                # Load only our own local artifact; pickle/joblib files are executable.
                saved=joblib.load(artifact)
                if saved.get('key') == key and saved.get('state',{}).get('model') is not None:
                    state=saved['state']
                    if artifact == ARTIFACT:_cached_key,_cached_state=key,state
                    return state
            except (OSError,ValueError,EOFError,KeyError,AttributeError,TypeError):
                pass
        state=build(raw,source)
        _save(key,state,artifact)
        if artifact == ARTIFACT:_cached_key,_cached_state=key,state
        return state

def activate(raw_bytes: bytes, source: str, state: dict, artifact: Path = ARTIFACT):
    """Persist an already-fitted state after the dataset has been committed."""
    global _cached_key,_cached_state
    key=_key(raw_bytes,source)
    with _lock:
        _save(key,state,artifact)
        if artifact == ARTIFACT:
            _cached_key,_cached_state=key,state
