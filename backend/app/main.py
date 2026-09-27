from pathlib import Path

import pandas as pd
from sklearn.model_selection import GroupShuffleSplit

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .store import get_state, build, activate
from .model import validate
from .multivariate import router as multivariate_router


ROOT = Path(__file__).resolve().parents[2]
ACTIVE = ROOT / "backend" / "data" / "uploaded.csv"
DEFAULT = ROOT / "data" / "processed" / "cycling_lactate.csv"

ACTIVE.parent.mkdir(exist_ok=True)

app = FastAPI(title="AthletiQ API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Six-input prediction, feature charts, response curves, and evaluation.
app.include_router(multivariate_router)


class Prediction(BaseModel):
    training_load: float = Field(ge=0, le=10000)


class PowerPrediction(BaseModel):
    power_watts: float = Field(ge=0, le=10000)


def current():
    official = not ACTIVE.exists()

    try:
        return get_state(
            DEFAULT if official else ACTIVE,
            "official" if official else "upload",
        )
    except (OSError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/analysis")
def analysis():
    return current()["analysis"]


@app.post("/api/predict")
def predict(payload: Prediction):
    state = current()
    x = payload.training_load
    metrics = state["metrics"]

    if not metrics["load_min"] <= x <= metrics["load_max"]:
        raise HTTPException(
            status_code=422,
            detail=(
                f'Load must be within '
                f'{metrics["load_min"]}–{metrics["load_max"]}.'
            ),
        )

    estimate = state["model"].predict(
        pd.DataFrame({"training_load": [x]})
    )[0]

    return {
        "predicted_score": round(float(estimate), 2),
        "units": (
            "mmol/L lactate"
            if state["source"] == "official"
            else "uploaded outcome units"
        ),
        "official_dataset": state["source"] == "official",
    }


@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=422,
            detail="Upload a CSV file.",
        )

    raw = await file.read(5_000_001)

    if len(raw) > 5_000_000:
        raise HTTPException(
            status_code=413,
            detail="Maximum upload size is 5 MB.",
        )

    try:
        # Validate and fit before replacing the current upload.
        state = build(raw, "upload")

        temp = ACTIVE.with_suffix(".tmp")
        temp.write_bytes(raw)
        temp.replace(ACTIVE)

        activate(raw, "upload", state)

        return {
            "status": "trained",
            "rows": state["analysis"]["rows"],
        }

    except (ValueError, OSError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/reset")
def reset():
    ACTIVE.unlink(missing_ok=True)
    return {"status": "official lab dataset restored"}


@app.get("/api/v2/analysis")
def analysis_v2():
    state = current()
    data = state["analysis"]
    metrics = state["metrics"]

    return {
        "dataset": {
            "source": state["source"],
            "observations": data["rows"],
            "test_files": data["athletes"],
            "target": data["target"],
        },
        "model": {
            "algorithm": "degree-2 polynomial regression",
            "equation": metrics["equation"],
            "metrics": metrics,
        },
        "observations": [
            {
                "power_watts": point["load"],
                "lactate_mmol_l": point["score"],
            }
            for point in data["points"]
        ],
        "curve": [
            {
                "power_watts": point["load"],
                "lactate_mmol_l": point["score"],
            }
            for point in state["curve"]
        ],
    }


@app.post("/api/v2/predict")
def predict_v2(payload: PowerPrediction):
    state = current()
    watts = payload.power_watts
    metrics = state["metrics"]

    if not metrics["load_min"] <= watts <= metrics["load_max"]:
        raise HTTPException(
            status_code=422,
            detail=(
                f'Power must be between {metrics["load_min"]} '
                f'and {metrics["load_max"]} W.'
            ),
        )

    estimate = state["model"].predict(
        pd.DataFrame({"training_load": [watts]})
    )[0]

    return {
        "power_watts": watts,
        "predicted_lactate_mmol_l": round(float(estimate), 2),
        "dataset_source": state["source"],
    }


@app.get("/api/v2/evaluation")
def evaluation_v2():
    state = current()
    source_file = DEFAULT if state["source"] == "official" else ACTIVE

    try:
        df = validate(pd.read_csv(source_file))
    except (OSError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    # Match the split and row order used by the original model.
    splitter = GroupShuffleSplit(
        n_splits=1,
        test_size=0.2,
        random_state=42,
    )
    _, test_indices = next(
        splitter.split(df, groups=df.athlete_id)
    )

    test_df = df.iloc[test_indices]
    predictions = state["model"].predict(
        test_df[["training_load"]]
    )

    holdout = [
        {
            "power_watts": float(watts),
            "measured_lactate_mmol_l": float(actual),
            "predicted_lactate_mmol_l": round(float(predicted), 4),
            "residual_mmol_l": round(
                float(actual - predicted), 4
            ),
        }
        for watts, actual, predicted in zip(
            test_df.training_load,
            test_df.performance_score,
            predictions,
        )
    ]

    # Summarize every valid observation, rather than only sampled chart points.
    bin_width = 40
    first = int(df.training_load.min() // bin_width) * bin_width
    last = (int(df.training_load.max() // bin_width) + 1) * bin_width

    power_bins = []

    for left in range(first, last, bin_width):
        right = left + bin_width

        group = df[
            (df.training_load >= left)
            & (df.training_load < right)
        ].performance_score

        if group.empty:
            continue

        power_bins.append({
            "min_watts": left,
            "max_watts": right,
            "median_lactate_mmol_l": round(
                float(group.median()), 4
            ),
            "q1_lactate_mmol_l": round(
                float(group.quantile(0.25)), 4
            ),
            "q3_lactate_mmol_l": round(
                float(group.quantile(0.75)), 4
            ),
            "count": int(group.size),
        })

    return {
        "holdout": holdout,
        "power_bins": power_bins,
        "test_observations": len(test_df),
        "test_files": int(test_df.athlete_id.nunique()),
    }
