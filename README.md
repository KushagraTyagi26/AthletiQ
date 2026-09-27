# AthletiQ — Cycling Workload & Lactate Curve Analyzer

A complete full-stack project using **real exercise-lab measurements** and **polynomial curve fitting (degree 2)**. The frontend uses Vite, the backend uses FastAPI and scikit-learn, and the repository includes Jupyter notebooks, tests, a reproducible data-preparation script, original research data, and `.gitignore`. There is no synthetic or demo CSV.

## Data and meaning

The original [Trinity College Dublin graded exercise-test dataset](https://zenodo.org/records/10841412) (Donne et al., version 2) is bundled in `data/raw/graded_tests.zip`. The source MD5 checksum is verified by `scripts/prepare_graded_tests.py`. The processed file `data/processed/cycling_lactate.csv` has **2,102 real cycling power/lactate pairs from 279 test files**. It fits **cycling workload in watts → measured blood lactate in mmol/L**. This is an acute physiological response curve, not a predictor of future match performance or long-term training effects. Read [docs/DATASET.md](docs/DATASET.md) for filtering, evaluation and attribution.

## Folder structure

```text
AthletiQ/
├── backend/
│   ├── app/{main.py,model.py,__init__.py}
│   ├── tests/test_model.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── src/{main.js,style.css}
│   ├── package.json
│   └── vite.config.js
├── notebooks/{01_data_exploration.ipynb,02_polynomial_model.ipynb,03_grouped_validation.ipynb}
├── scripts/prepare_graded_tests.py
├── data/
│   ├── raw/graded_tests.zip
│   └── processed/cycling_lactate.csv
├── docs/DATASET.md
├── models/.gitkeep
├── .env.example
└── .gitignore
```

## Run

Python 3.10+ and Node.js 20+ required. From the **AthletiQ root**:

```bash
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Visit http://127.0.0.1:5173 ; API docs: http://127.0.0.1:8000/docs. Vite proxies `/api` to the backend. For notebooks, install `jupyter matplotlib`; `openpyxl` is included in backend requirements for source reproduction. Recreate data using `python scripts/prepare_graded_tests.py`.

## Model

`PolynomialFeatures(degree=2)` followed by least-squares `LinearRegression` fits `lactate = c + a × power + b × power²`. Entire test files are held out together. On the training files only, five-fold grouped CV produced MAE 1.238 for the straight line, 1.076 for degree 2 and 1.070 for degree 3. The cubic improvement was only 0.006 mmol/L, so the simpler quadratic remains the deployed choice. On 422 observations from 56 unseen test files: **R² 0.584, MAE 0.955 mmol/L**; the linear baseline achieved **R² 0.535, MAE 1.151 mmol/L**. This is an actual nonlinear regression result on measured data. It is a pooled curve, not a personal lactate threshold or exercise prescription. Test-file IDs might include repeat human participants; see dataset notes.

## Custom uploads

Upload a UTF-8 CSV with `athlete_id,date,training_load,performance_score`; for lab data these columns mean `test_file_id,test_date,watts,lactate_mmol_L`. The uploader supports up to 5 MB and 100,000 rows. It saves `backend/data/uploaded.csv` locally until reset. The backend saves a trained artifact in `models/athletiq_model.joblib`, keyed by a SHA-256 digest of the dataset and model version. First use trains it; subsequent requests load or reuse it. A changed upload retrains the model. Keep the artifact local: joblib uses pickle and must never load files supplied by untrusted users. The API has no authentication, so restrict it before public hosting.

## Test

```bash
python -m unittest discover -s backend/tests -v
cd frontend && npm run build
```

API: `GET /api/health`, `GET /api/analysis`, `POST /api/predict` with `{"training_load":250}`, `POST /api/upload`, `POST /api/reset`.
