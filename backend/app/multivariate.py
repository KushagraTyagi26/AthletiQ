"""Six-input polynomial model and real-data API for AthletiQ."""

from __future__ import annotations

import hashlib
import io
import warnings
from functools import lru_cache
from pathlib import Path
from zipfile import ZipFile

import numpy as np
import openpyxl
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler

ROOT = Path(__file__).resolve().parents[2]
ARCHIVE = ROOT / "data" / "raw" / "graded_tests.zip"
SOURCE_MD5 = "f64cb1bf4d66129daed6c1954ea6ca9f"

FEATURES = ("power", "heart_rate", "vo2", "height", "weight", "age")
LABELS = dict(zip(
    FEATURES,
    ("Cycling Power", "Heart Rate", "VO₂", "Height", "Weight", "Age"),
))
UNITS = dict(zip(
    FEATURES,
    ("W", "bpm", "mL/kg/min", "m", "kg", "years"),
))

router = APIRouter(prefix="/api")


class Inputs(BaseModel):
    power: float = Field(ge=0, le=600)
    heart_rate: float = Field(ge=40, le=220)
    vo2: float = Field(gt=0, le=90)
    height: float = Field(ge=1, le=2.5)
    weight: float = Field(ge=30, le=150)
    age: float = Field(ge=10, le=90)


def load_rows() -> pd.DataFrame:
    """Extract aligned, measured cycling stages from the verified archive."""
    if hashlib.md5(ARCHIVE.read_bytes()).hexdigest() != SOURCE_MD5:
        raise ValueError("Exercise-test archive checksum mismatch")

    records = []

    with ZipFile(ARCHIVE) as archive, warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)

        summary = openpyxl.load_workbook(
            io.BytesIO(archive.read("data/Data_Summary.xlsx")),
            read_only=True,
            data_only=True,
        )

        for record in list(summary.active.values)[1:]:
            if record[3] != "Cycling":
                continue

            filename = record[1]
            dob = record[6]
            date = record[7]
            height = record[11]
            weight = record[12]

            if not hasattr(dob, "date") or not hasattr(date, "date"):
                continue

            age = (date - dob).days / 365.2425

            if not 12 <= age <= 90:
                continue

            if not all(
                isinstance(value, (int, float)) and value > 0
                for value in (height, weight)
            ):
                continue

            try:
                book = openpyxl.load_workbook(
                    io.BytesIO(archive.read("data/" + filename)),
                    read_only=True,
                    data_only=True,
                )

                for stage in list(book.worksheets[1].values)[1:]:
                    if len(stage) < 4:
                        continue

                    power, heart_rate, vo2, lactate = stage[:4]

                    if not all(
                        isinstance(value, (int, float))
                        and not isinstance(value, bool)
                        for value in (power, heart_rate, vo2, lactate)
                    ):
                        continue

                    if (
                        0 < power <= 600
                        and 0 < lactate < 25
                        and heart_rate > 0
                        and vo2 > 0
                    ):
                        records.append((
                            filename,
                            power,
                            heart_rate,
                            vo2,
                            height,
                            weight,
                            age,
                            lactate,
                        ))

            except (KeyError, ValueError, TypeError, AttributeError):
                continue

    return pd.DataFrame(
        records,
        columns=["test_id", *FEATURES, "lactate"],
    )


def metrics(actual, predicted, name):
    return {
        "model_name": name,
        "split": "Held-out cycling test files (20%, seed 42)",
        "mae": round(float(mean_absolute_error(actual, predicted)), 4),
        "r2": round(float(r2_score(actual, predicted)), 4),
        "rmse": round(
            float(np.sqrt(mean_squared_error(actual, predicted))), 4
        ),
    }


@lru_cache(maxsize=1)
def state():
    """Load and train once per backend process."""
    data = load_rows()

    train_index, test_index = next(
        GroupShuffleSplit(
            test_size=0.2,
            random_state=42,
        ).split(data, groups=data.test_id)
    )

    train = data.iloc[train_index]
    test = data.iloc[test_index]

    six_input_model = make_pipeline(
        StandardScaler(),
        PolynomialFeatures(degree=2, include_bias=False),
        LinearRegression(),
    )
    watts_only_model = make_pipeline(
        PolynomialFeatures(degree=2, include_bias=False),
        LinearRegression(),
    )

    six_input_model.fit(train[list(FEATURES)], train.lactate)
    watts_only_model.fit(train[["power"]], train.lactate)

    six_predictions = six_input_model.predict(test[list(FEATURES)])
    watts_predictions = watts_only_model.predict(test[["power"]])

    return (
        data,
        train,
        test,
        six_input_model,
        watts_only_model,
        six_predictions,
        watts_predictions,
    )


def input_frame(inputs: Inputs) -> pd.DataFrame:
    return pd.DataFrame(
        [inputs.model_dump()],
        columns=list(FEATURES),
    )


def check_measured_ranges(inputs: Inputs) -> None:
    data, *_ = state()
    values = inputs.model_dump()

    outside = [
        feature
        for feature in FEATURES
        if not data[feature].min()
        <= values[feature]
        <= data[feature].max()
    ]

    if outside:
        raise HTTPException(
            status_code=422,
            detail="Outside measured range for: " + ", ".join(outside),
        )


@router.post("/predict/six-input")
def predict(inputs: Inputs):
    check_measured_ranges(inputs)
    _, _, _, model, *_ = state()

    prediction = model.predict(input_frame(inputs))[0]

    return {
        "lactate": round(float(prediction), 3),
        "unit": "mmol/L",
        "model": "Six-input polynomial regression (degree 2)",
    }


@router.get("/feature-stats")
def feature_stats():
    data, *_ = state()

    return [
        {
            "key": feature,
            "name": LABELS[feature],
            "unit": UNITS[feature],
            "min": round(float(data[feature].min()), 3),
            "max": round(float(data[feature].max()), 3),
            "count": int(data[feature].notna().sum()),
            "mean": round(float(data[feature].mean()), 3),
            "std": round(float(data[feature].std()), 3),
        }
        for feature in FEATURES
    ]


@router.get("/scatter")
def scatter(
    x: str = Query(...),
    y: str = Query(...),
):
    allowed = (*FEATURES, "lactate")

    if x not in allowed or y not in allowed:
        raise HTTPException(status_code=422, detail="Unknown feature")

    data, *_ = state()

    # Every point is measured; sampling limits the number sent to the browser.
    view = (
        data
        if len(data) <= 1200
        else data.sample(n=1200, random_state=42).sort_index()
    )

    return {
        "feature_x": x,
        "feature_y": y,
        "x_unit": UNITS.get(x, "mmol/L"),
        "y_unit": UNITS.get(y, "mmol/L"),
        "points": [
            {
                "x": round(float(row[x]), 3),
                "y": round(float(row[y]), 3),
                "lactate": round(float(row.lactate), 3),
            }
            for _, row in view.iterrows()
        ],
    }


@router.post("/model-response/{feature}")
def model_response(feature: str, inputs: Inputs):
    if feature not in FEATURES:
        raise HTTPException(status_code=422, detail="Unknown feature")

    check_measured_ranges(inputs)
    data, _, _, model, *_ = state()

    values = np.linspace(
        data[feature].min(),
        data[feature].max(),
        81,
    )

    frame = pd.DataFrame(
        [inputs.model_dump()] * len(values),
        columns=list(FEATURES),
    )
    frame[feature] = values

    predictions = model.predict(frame)

    return {
        "feature": feature,
        "unit": UNITS[feature],
        "current_value": getattr(inputs, feature),
        "points": [
            {
                "feature_value": round(float(value), 3),
                "lactate": round(float(prediction), 3),
            }
            for value, prediction in zip(values, predictions)
        ],
    }


@router.post("/response-curve")
def response_curve(inputs: Inputs):
    check_measured_ranges(inputs)
    data, _, _, model, *_ = state()

    minimum = float(data.power.min())
    maximum = float(data.power.max())

    values = np.linspace(minimum, maximum, 101)

    frame = pd.DataFrame(
        [inputs.model_dump()] * len(values),
        columns=list(FEATURES),
    )
    frame["power"] = values

    predictions = model.predict(frame)

    view = (
        data
        if len(data) <= 1200
        else data.sample(n=1200, random_state=42).sort_index()
    )

    return {
        "observed": [
            {
                "power": float(row.power),
                "lactate": float(row.lactate),
            }
            for _, row in view.iterrows()
        ],
        "curve": [
            {
                "power": round(float(power), 3),
                "lactate": round(float(lactate), 3),
            }
            for power, lactate in zip(values, predictions)
        ],
        "coverage_min": minimum,
        "coverage_max": maximum,
    }


@router.get("/data-insights")
def data_insights():
    data, *_ = state()

    power_bins = []

    for minimum, maximum in zip(
        np.arange(0, 551, 50)[:-1],
        np.arange(0, 551, 50)[1:],
    ):
        block = data[
            (data.power >= minimum)
            & (data.power < maximum)
        ]

        if len(block):
            power_bins.append({
                "bin_label": f"{minimum}–{maximum} W",
                "bin_min": int(minimum),
                "bin_max": int(maximum),
                "count": len(block),
                "mean_lactate": round(float(block.lactate.mean()), 3),
                "std_lactate": round(
                    float(block.lactate.std(ddof=0)), 3
                ),
            })

    lactate_bins = []

    for minimum in np.arange(0, 26, 2):
        maximum = minimum + 2

        count = int(
            (
                (data.lactate >= minimum)
                & (data.lactate < maximum)
            ).sum()
        )

        if count:
            lactate_bins.append({
                "bin_label": f"{minimum}–{maximum}",
                "count": count,
                "min": float(minimum),
                "max": float(maximum),
            })

    return {
        "power_bins": power_bins,
        "lactate_distribution": lactate_bins,
        "feature_ranges": feature_stats(),
    }


@router.get("/model-evaluation")
def model_evaluation():
    _, _, test, _, _, six_predictions, watts_predictions = state()
    actual = test.lactate.to_numpy()

    def paired_points(predictions):
        return [
            {
                "predicted": round(float(prediction), 3),
                "measured": round(float(measurement), 3),
                "residual": round(
                    float(prediction - measurement), 3
                ),
            }
            for prediction, measurement in zip(
                predictions,
                actual,
            )
        ]

    watts_points = paired_points(watts_predictions)
    six_points = paired_points(six_predictions)

    return {
        "watts_only": metrics(
            actual,
            watts_predictions,
            "Watts-only degree-2 polynomial",
        ),
        "six_input": metrics(
            actual,
            six_predictions,
            "Six-input degree-2 polynomial",
        ),
        "residuals": {
            "watts_only": watts_points,
            "six_input": six_points,
        },
        "predicted_vs_measured": {
            "watts_only": [
                {
                    "predicted": point["predicted"],
                    "measured": point["measured"],
                }
                for point in watts_points
            ],
            "six_input": [
                {
                    "predicted": point["predicted"],
                    "measured": point["measured"],
                }
                for point in six_points
            ],
        },
        "error_by_power": {
            "watts_only": [
                {
                    "power": float(power),
                    "error": round(
                        float(abs(prediction - measurement)),
                        3,
                    ),
                }
                for power, prediction, measurement in zip(
                    test.power,
                    watts_predictions,
                    actual,
                )
            ],
            "six_input": [
                {
                    "power": float(power),
                    "error": round(
                        float(abs(prediction - measurement)),
                        3,
                    ),
                }
                for power, prediction, measurement in zip(
                    test.power,
                    six_predictions,
                    actual,
                )
            ],
        },
    }
