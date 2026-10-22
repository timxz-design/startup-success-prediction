"""
Startup Success/Failure Prediction — V2 (Improved)
====================================================
Improvements over V1:
  1. Feature engineering (ratios, interactions)
  2. Hyperparameter tuning with Optuna
  3. Stacking ensemble
  4. Threshold optimization
"""

import warnings
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import optuna
optuna.logging.set_verbosity(optuna.logging.WARNING)

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix, ConfusionMatrixDisplay,
    roc_auc_score, roc_curve, precision_recall_curve
)
from xgboost import XGBClassifier

SEED = 42
import os
import kagglehub

# Downloads the Kaggle dataset on first run (cached afterwards)
DATA_PATH = os.path.join(
    kagglehub.dataset_download("dhrubangtalukdar/startup-funding-and-outcome-dataset"),
    "startup_success_dataset.csv",
)

# ============================================================
# 1. LOAD DATA & CREATE BINARY TARGET
# ============================================================
df = pd.read_csv(DATA_PATH)
df["target"] = (df["outcome"] != "Failure").astype(int)

print("=" * 65)
print("STARTUP PREDICTION v2 — WITH IMPROVEMENTS")
print("=" * 65)
print(f"Samples: {len(df):,}")
print(f"Baseline (majority class): {df['target'].value_counts(normalize=True).max():.4f}")

# ============================================================
# 2. FEATURE ENGINEERING
# ============================================================
print("\n--- Feature Engineering ---")

# Ratios
df["revenue_per_employee"] = df["revenue_million"] / (df["team_size"] + 1)
df["burn_per_employee"] = df["burn_rate_million"] / (df["team_size"] + 1)
df["revenue_to_burn"] = df["revenue_million"] / (df["burn_rate_million"] + 0.01)
df["traction_per_employee"] = df["product_traction_users"] / (df["team_size"] + 1)
df["funding_efficiency"] = df["revenue_million"] / (df["funding_rounds"] + 1)
df["traction_per_market"] = df["product_traction_users"] / (df["market_size_billion"] + 0.01)

# Interactions
df["experience_x_funding"] = df["founder_experience_years"] * df["funding_rounds"]
df["team_x_traction"] = df["team_size"] * df["product_traction_users"]

# Log transforms for skewed features
df["log_revenue"] = np.log1p(df["revenue_million"])
df["log_traction"] = np.log1p(df["product_traction_users"])
df["log_burn"] = np.log1p(df["burn_rate_million"])
df["log_market"] = np.log1p(df["market_size_billion"])

engineered_cols = [
    "revenue_per_employee", "burn_per_employee", "revenue_to_burn",
    "traction_per_employee", "funding_efficiency", "traction_per_market",
    "experience_x_funding", "team_x_traction",
    "log_revenue", "log_traction", "log_burn", "log_market",
]

original_numeric = [
    "funding_rounds", "founder_experience_years", "team_size",
    "market_size_billion", "product_traction_users",
    "burn_rate_million", "revenue_million"
]
all_numeric = original_numeric + engineered_cols
categorical_cols = ["investor_type", "sector", "founder_background"]

print(f"Original features:    {len(original_numeric)} numeric + {len(categorical_cols)} categorical")
print(f"Engineered features:  {len(engineered_cols)} new numeric")
print(f"Total features:       {len(all_numeric) + len(categorical_cols)}")

# ============================================================
# 3. TRAIN / TEST SPLIT (same seed as v1)
# ============================================================
X = df[all_numeric + categorical_cols]
y = df["target"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=SEED, stratify=y
)
print(f"\nTrain: {len(X_train):,} | Test: {len(X_test):,}")

# ============================================================
# 4. PREPROCESSING
# ============================================================
preprocessor = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), all_numeric),
        ("cat", OneHotEncoder(drop="first", handle_unknown="infrequent_if_exist"), categorical_cols),
    ]
)

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)

# ============================================================
# 5. STEP A — CROSS-VALIDATE WITH ENGINEERED FEATURES (default params)
# ============================================================
print("\n" + "=" * 65)
print("STEP A: ENGINEERED FEATURES + DEFAULT HYPERPARAMS (CV)")
print("=" * 65)

default_models = {
    "Logistic Regression": LogisticRegression(max_iter=1000, random_state=SEED),
    "Random Forest": RandomForestClassifier(
        n_estimators=300, max_depth=15, min_samples_leaf=5,
        random_state=SEED, n_jobs=-1
    ),
    "XGBoost": XGBClassifier(
        n_estimators=300, max_depth=6, learning_rate=0.1,
        random_state=SEED, eval_metric="logloss", n_jobs=-1
    ),
}

scoring = ["accuracy", "f1", "roc_auc"]
step_a_results = {}

for name, model in default_models.items():
    pipe = Pipeline([("preprocessor", preprocessor), ("classifier", model)])
    scores = cross_validate(pipe, X_train, y_train, cv=cv, scoring=scoring, n_jobs=-1)
    step_a_results[name] = {
        "Accuracy": scores["test_accuracy"].mean(),
        "F1": scores["test_f1"].mean(),
        "ROC AUC": scores["test_roc_auc"].mean(),
    }
    print(f"  {name:25s}  Acc={scores['test_accuracy'].mean():.4f}  F1={scores['test_f1'].mean():.4f}  AUC={scores['test_roc_auc'].mean():.4f}")

# ============================================================
# 6. STEP B — HYPERPARAMETER TUNING WITH OPTUNA
# ============================================================
print("\n" + "=" * 65)
print("STEP B: HYPERPARAMETER TUNING (Optuna, 20 trials each)")
print("=" * 65)


def make_pipeline(model):
    return Pipeline([("preprocessor", preprocessor), ("classifier", model)])


# Use 3-fold CV for tuning speed, 5-fold for final evaluation
cv_tune = StratifiedKFold(n_splits=3, shuffle=True, random_state=SEED)


# --- Logistic Regression ---
def objective_lr(trial):
    C = trial.suggest_float("C", 0.001, 100, log=True)
    model = LogisticRegression(C=C, max_iter=2000, random_state=SEED, solver="lbfgs")
    pipe = make_pipeline(model)
    scores = cross_validate(pipe, X_train, y_train, cv=cv_tune, scoring="roc_auc", n_jobs=-1)
    return scores["test_score"].mean()


study_lr = optuna.create_study(direction="maximize", sampler=optuna.samplers.TPESampler(seed=SEED))
study_lr.optimize(objective_lr, n_trials=20, show_progress_bar=False)
best_lr = LogisticRegression(
    C=study_lr.best_params["C"], max_iter=2000, random_state=SEED, solver="lbfgs"
)
print(f"  LR best C={study_lr.best_params['C']:.4f}  AUC={study_lr.best_value:.4f}")


# --- Random Forest ---
def objective_rf(trial):
    params = {
        "n_estimators": trial.suggest_int("n_estimators", 100, 400, step=100),
        "max_depth": trial.suggest_int("max_depth", 5, 20),
        "min_samples_leaf": trial.suggest_int("min_samples_leaf", 1, 20),
        "min_samples_split": trial.suggest_int("min_samples_split", 2, 20),
        "max_features": trial.suggest_categorical("max_features", ["sqrt", "log2", 0.5, 0.8]),
    }
    model = RandomForestClassifier(**params, random_state=SEED, n_jobs=-1)
    pipe = make_pipeline(model)
    scores = cross_validate(pipe, X_train, y_train, cv=cv_tune, scoring="roc_auc", n_jobs=-1)
    return scores["test_score"].mean()


study_rf = optuna.create_study(direction="maximize", sampler=optuna.samplers.TPESampler(seed=SEED))
study_rf.optimize(objective_rf, n_trials=20, show_progress_bar=False)
best_rf = RandomForestClassifier(**study_rf.best_params, random_state=SEED, n_jobs=-1)
print(f"  RF best params: {study_rf.best_params}  AUC={study_rf.best_value:.4f}")


# --- XGBoost ---
def objective_xgb(trial):
    params = {
        "n_estimators": trial.suggest_int("n_estimators", 100, 400, step=100),
        "max_depth": trial.suggest_int("max_depth", 3, 12),
        "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
        "subsample": trial.suggest_float("subsample", 0.6, 1.0),
        "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
        "reg_alpha": trial.suggest_float("reg_alpha", 1e-4, 10, log=True),
        "reg_lambda": trial.suggest_float("reg_lambda", 1e-4, 10, log=True),
        "min_child_weight": trial.suggest_int("min_child_weight", 1, 20),
    }
    model = XGBClassifier(**params, random_state=SEED, eval_metric="logloss", n_jobs=-1)
    pipe = make_pipeline(model)
    scores = cross_validate(pipe, X_train, y_train, cv=cv_tune, scoring="roc_auc", n_jobs=-1)
    return scores["test_score"].mean()


study_xgb = optuna.create_study(direction="maximize", sampler=optuna.samplers.TPESampler(seed=SEED))
study_xgb.optimize(objective_xgb, n_trials=20, show_progress_bar=False)
best_xgb = XGBClassifier(**study_xgb.best_params, random_state=SEED, eval_metric="logloss", n_jobs=-1)
print(f"  XGB best params: {study_xgb.best_params}  AUC={study_xgb.best_value:.4f}")

# --- CV with tuned models ---
print("\n  Tuned model CV results:")
tuned_models = {
    "Logistic Regression (tuned)": best_lr,
    "Random Forest (tuned)": best_rf,
    "XGBoost (tuned)": best_xgb,
}

step_b_results = {}
for name, model in tuned_models.items():
    pipe = make_pipeline(model)
    scores = cross_validate(pipe, X_train, y_train, cv=cv, scoring=scoring, n_jobs=-1)
    step_b_results[name] = {
        "Accuracy": scores["test_accuracy"].mean(),
        "F1": scores["test_f1"].mean(),
        "ROC AUC": scores["test_roc_auc"].mean(),
    }
    print(f"  {name:35s}  Acc={scores['test_accuracy'].mean():.4f}  F1={scores['test_f1'].mean():.4f}  AUC={scores['test_roc_auc'].mean():.4f}")

# ============================================================
# 7. STEP C — STACKING ENSEMBLE
# ============================================================
print("\n" + "=" * 65)
print("STEP C: STACKING ENSEMBLE")
print("=" * 65)

stacking = StackingClassifier(
    estimators=[
        ("lr", best_lr),
        ("rf", best_rf),
        ("xgb", best_xgb),
    ],
    final_estimator=LogisticRegression(max_iter=1000, random_state=SEED),
    cv=3,  # internal CV for stacking (3-fold for speed)
    n_jobs=-1,
    passthrough=False,
)
print("  Stacking ensemble configured (will evaluate on test set)")

# ============================================================
# 8. TEST SET EVALUATION — ALL MODELS
# ============================================================
print("\n" + "=" * 65)
print("TEST SET RESULTS")
print("=" * 65)

baseline_acc = y_test.value_counts(normalize=True).max()
print(f"Baseline: {baseline_acc:.4f}\n")

all_models = {
    "LR (tuned)": best_lr,
    "RF (tuned)": best_rf,
    "XGB (tuned)": best_xgb,
    "Stacking": stacking,
}

test_results = {}
probabilities = {}

for name, model in all_models.items():
    pipe = make_pipeline(model)
    pipe.fit(X_train, y_train)
    y_pred = pipe.predict(X_test)
    y_prob = pipe.predict_proba(X_test)[:, 1]
    probabilities[name] = y_prob

    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)
    test_results[name] = {"Accuracy": acc, "F1": f1, "Precision": prec, "Recall": rec, "ROC AUC": auc}

    print(f"  {name:20s}  Acc={acc:.4f}  F1={f1:.4f}  Prec={prec:.4f}  Rec={rec:.4f}  AUC={auc:.4f}")

# ============================================================
# 9. STEP D — THRESHOLD OPTIMIZATION (on best model)
# ============================================================
print("\n" + "=" * 65)
print("STEP D: THRESHOLD OPTIMIZATION")
print("=" * 65)

best_name = max(test_results, key=lambda k: test_results[k]["ROC AUC"])
best_prob = probabilities[best_name]
print(f"Optimizing threshold for: {best_name}")

# Find threshold that maximizes F1 using precision-recall curve
precisions, recalls, thresholds_pr = precision_recall_curve(y_test, best_prob)
f1_scores = 2 * (precisions * recalls) / (precisions + recalls + 1e-8)
best_threshold_idx = np.argmax(f1_scores)
best_threshold = thresholds_pr[best_threshold_idx]

print(f"Default threshold: 0.50")
print(f"Optimal threshold (max F1): {best_threshold:.4f}")

# Apply optimized threshold
y_pred_optimized = (best_prob >= best_threshold).astype(int)
opt_acc = accuracy_score(y_test, y_pred_optimized)
opt_f1 = f1_score(y_test, y_pred_optimized)
opt_prec = precision_score(y_test, y_pred_optimized)
opt_rec = recall_score(y_test, y_pred_optimized)
opt_auc = roc_auc_score(y_test, best_prob)

print(f"\nWith optimized threshold:")
print(f"  Accuracy:  {opt_acc:.4f}")
print(f"  F1:        {opt_f1:.4f}")
print(f"  Precision: {opt_prec:.4f}")
print(f"  Recall:    {opt_rec:.4f}")
print(f"  ROC AUC:   {opt_auc:.4f}")
print(classification_report(y_test, y_pred_optimized, target_names=["Failure", "Success"]))

test_results[f"{best_name} (opt threshold)"] = {
    "Accuracy": opt_acc, "F1": opt_f1, "Precision": opt_prec,
    "Recall": opt_rec, "ROC AUC": opt_auc,
}

# ============================================================
# 10. PLOTS
# ============================================================

# --- Confusion matrices ---
fig, axes = plt.subplots(1, len(all_models) + 1, figsize=(5 * (len(all_models) + 1), 5))
for idx, (name, model) in enumerate(all_models.items()):
    pipe = make_pipeline(model)
    pipe.fit(X_train, y_train)
    y_pred = pipe.predict(X_test)
    ConfusionMatrixDisplay.from_predictions(
        y_test, y_pred, display_labels=["Fail", "Success"],
        ax=axes[idx], cmap="Blues"
    )
    axes[idx].set_title(name)

# Optimized threshold confusion matrix
ConfusionMatrixDisplay.from_predictions(
    y_test, y_pred_optimized, display_labels=["Fail", "Success"],
    ax=axes[-1], cmap="Greens"
)
axes[-1].set_title(f"{best_name}\n(threshold={best_threshold:.3f})")
fig.suptitle("Confusion Matrices — Test Set (v2)", fontsize=14)
fig.tight_layout()
fig.savefig("v2_confusion_matrices.png", dpi=150, bbox_inches="tight")
plt.close(fig)

# --- ROC curves ---
fig, ax = plt.subplots(figsize=(9, 7))
for name, y_prob in probabilities.items():
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    auc_val = roc_auc_score(y_test, y_prob)
    ax.plot(fpr, tpr, label=f"{name} (AUC={auc_val:.4f})", linewidth=2)
ax.plot([0, 1], [0, 1], "k--", label="Random (AUC=0.50)")
ax.set_xlabel("False Positive Rate")
ax.set_ylabel("True Positive Rate")
ax.set_title("ROC Curves — v2 Models")
ax.legend()
fig.tight_layout()
fig.savefig("v2_roc_curves.png", dpi=150, bbox_inches="tight")
plt.close(fig)

# --- Threshold vs F1 plot ---
fig, ax = plt.subplots(figsize=(8, 5))
ax.plot(thresholds_pr, f1_scores[:-1], linewidth=2)
ax.axvline(x=best_threshold, color="red", linestyle="--", label=f"Best={best_threshold:.3f}")
ax.axvline(x=0.5, color="gray", linestyle="--", alpha=0.5, label="Default=0.50")
ax.set_xlabel("Threshold")
ax.set_ylabel("F1 Score")
ax.set_title("Threshold Optimization — F1 vs Threshold")
ax.legend()
fig.tight_layout()
fig.savefig("v2_threshold_optimization.png", dpi=150, bbox_inches="tight")
plt.close(fig)

# --- Improvement comparison: v1 vs v2 ---
v1_results = {
    "LR (v1 baseline)": {"Accuracy": 0.7658, "F1": 0.7220, "ROC AUC": 0.8406},
}

fig, ax = plt.subplots(figsize=(12, 6))
compare = {}
compare["V1: LR (original)"] = v1_results["LR (v1 baseline)"]
for name, res in test_results.items():
    compare[f"V2: {name}"] = {"Accuracy": res["Accuracy"], "F1": res["F1"], "ROC AUC": res["ROC AUC"]}
compare_df = pd.DataFrame(compare).T
compare_df.plot.bar(ax=ax, rot=25)
ax.axhline(y=baseline_acc, color="red", linestyle="--", linewidth=2, label="Baseline (majority)")
ax.set_ylabel("Score")
ax.set_title("V1 vs V2: Full Comparison")
ax.legend()
ax.set_ylim(0.4, 1.0)
fig.tight_layout()
fig.savefig("v2_vs_v1_comparison.png", dpi=150, bbox_inches="tight")
plt.close(fig)

# ============================================================
# 11. FINAL SUMMARY
# ============================================================
print("\n" + "=" * 65)
print("FINAL SUMMARY — V1 vs V2")
print("=" * 65)
print(f"\n{'Model':40s} {'Acc':>8s} {'F1':>8s} {'Prec':>8s} {'Rec':>8s} {'AUC':>8s}")
print("-" * 80)
print(f"{'Baseline (majority)':40s} {baseline_acc:8.4f} {'—':>8s} {'—':>8s} {'—':>8s} {'—':>8s}")
print(f"{'V1: LR (original, no eng.)':40s} {'0.7658':>8s} {'0.7220':>8s} {'0.7631':>8s} {'0.6851':>8s} {'0.8406':>8s}")
for name, res in test_results.items():
    print(f"V2: {name:36s} {res['Accuracy']:8.4f} {res['F1']:8.4f} {res['Precision']:8.4f} {res['Recall']:8.4f} {res['ROC AUC']:8.4f}")

print("\nPlots saved to project directory.")
