"""
save_model.py
=============
Trains the best model (Logistic Regression, V1 params) on the full
training set and saves it to disk as 'startup_model.pkl'.

Run this once. After that, use predict.py to make predictions.
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score

SEED = 42
import os
import kagglehub

# Downloads the Kaggle dataset on first run (cached afterwards)
DATA_PATH = os.path.join(
    kagglehub.dataset_download("dhrubangtalukdar/startup-funding-and-outcome-dataset"),
    "startup_success_dataset.csv",
)

# ── Load & prepare ──────────────────────────────────────────
df = pd.read_csv(DATA_PATH)
df["target"] = (df["outcome"] != "Failure").astype(int)

numeric_cols = [
    "funding_rounds", "founder_experience_years", "team_size",
    "market_size_billion", "product_traction_users",
    "burn_rate_million", "revenue_million"
]
categorical_cols = ["investor_type", "sector", "founder_background"]

X = df[numeric_cols + categorical_cols]
y = df["target"]

# Same split as before (SEED=42) so test set is comparable
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=SEED, stratify=y
)

# ── Build & train pipeline ───────────────────────────────────
preprocessor = ColumnTransformer(transformers=[
    ("num", StandardScaler(), numeric_cols),
    ("cat", OneHotEncoder(drop="first", handle_unknown="infrequent_if_exist"), categorical_cols),
])

pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", LogisticRegression(max_iter=1000, random_state=SEED, solver="lbfgs")),
])

print("Training model...")
pipeline.fit(X_train, y_train)

# ── Quick sanity check on test set ──────────────────────────
y_pred = pipeline.predict(X_test)
y_prob = pipeline.predict_proba(X_test)[:, 1]
print("\nTest set performance:")
print(classification_report(y_test, y_pred, target_names=["Failure", "Success"]))
print(f"ROC AUC: {roc_auc_score(y_test, y_prob):.4f}")

# ── Save everything needed ──────────────────────────────────
model_data = {
    "pipeline":         pipeline,          # preprocessor + model (all-in-one)
    "numeric_cols":     numeric_cols,      # feature names expected
    "categorical_cols": categorical_cols,
    "classes":          ["Failure", "Success"],
    "threshold":        0.5,               # default decision threshold
}

joblib.dump(model_data, "startup_model.pkl")
print("\nModel saved to: startup_model.pkl")
print("Use predict.py to make predictions on new startups.")
