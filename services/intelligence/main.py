"""HemoNexus intelligence service - deterministic numerical forecasting only.
No LLM generates numbers here. All outputs are typed and include a state."""
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Optional
import numpy as np

try:
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    HAVE_STATS = True
except Exception:
    HAVE_STATS = False

MODEL_VERSION = "hw-statsmodels-v1"
MIN_OBS, MIN_FALLBACK = 104, 52

app = FastAPI(title="HemoNexus Intelligence", version="1.0.0")

class ForecastIn(BaseModel):
    series: List[float]
    horizon: int = Field(default=4, ge=1, le=12)
    method: str = "ets"

class ScoreIn(BaseModel):
    usable_stock: float
    forecast_weekly_demand: float
    trailing_demand: float
    inbound: float
    expiring_14d: float
    nearby_surplus: Optional[float] = None
    policy_days: float = 5

class SimulationIn(BaseModel):
    baseline_stock: float
    baseline_demand: float
    surge_pct: float = 30
    days: int = 7

def state_for(series, method):
    n = len(series)
    if n < MIN_FALLBACK:
        return "INSUFFICIENT_DATA", "HISTORY_CRITICAL", "moving"
    if method == "ets" and n < MIN_OBS:
        return "INSUFFICIENT_DATA", "HISTORY_SHORT", "moving"
    if all(v == 0 for v in series):
        return "NO_SIGNAL", "ALL_ZERO_DEMAND", method
    if any(v == 0 for v in series):
        return "LOW_VOLUME", None, method
    return "OK", None, method

@app.get("/health")
def health():
    return {"status": "ok", "service": "hemonexus-intelligence", "model_version": MODEL_VERSION, "statsmodels": HAVE_STATS}

@app.post("/v1/forecast")
def forecast(inp: ForecastIn):
    state, reason, method = state_for(inp.series, inp.method)
    if state == "INSUFFICIENT_DATA" and reason == "HISTORY_CRITICAL":
        return {"point": [], "low": [], "high": [], "state": state, "reason": reason, "model_version": MODEL_VERSION}
    arr = np.asarray(inp.series, dtype=float)
    if method == "moving":
        point = [float(np.mean(arr[-4:]))] * inp.horizon
    elif method == "naive" or not HAVE_STATS or len(arr) < 104:
        point = [float(arr[-52 + i] if len(arr) >= 52 else arr[-1]) for i in range(inp.horizon)]
    else:
        try:
            model = ExponentialSmoothing(arr, trend="add", seasonal="add", seasonal_periods=52).fit(optimized=True)
            point = [max(0.0, float(v)) for v in model.forecast(inp.horizon)]
        except Exception:
            point = [float(arr[-52 + i] if len(arr) >= 52 else arr[-1]) for i in range(inp.horizon)]
    spread = max(0.5, float(np.std(arr[-13:])) * 1.28)
    return {
        "point": point,
        "low": [max(0.0, v - spread) for v in point],
        "high": [v + spread for v in point],
        "state": state, "reason": reason, "method": method, "model_version": MODEL_VERSION,
    }

def clamp(v):
    return max(0.0, min(1.0, v))

@app.post("/v1/score")
def score(inp: ScoreIn):
    daily = max(0.01, inp.forecast_weekly_demand / 7)
    cover_days = inp.usable_stock / daily
    factors = {
        "cover_risk": clamp((inp.policy_days - cover_days) / inp.policy_days),
        "demand_pressure": clamp((inp.forecast_weekly_demand - inp.trailing_demand) / max(1, inp.trailing_demand)),
        "supply_gap": clamp(1 - inp.inbound / max(1, inp.forecast_weekly_demand)),
        "expiry_pressure": clamp(inp.expiring_14d / max(1, inp.usable_stock)),
        "network_scarcity": 0.0 if inp.nearby_surplus is None else clamp(1 - inp.nearby_surplus / max(1, inp.forecast_weekly_demand)),
    }
    w = {"cover": .40, "demand": .20, "supply": .15, "expiry": .10, "network": .15}
    if inp.nearby_surplus is None:
        total = w["cover"] + w["demand"] + w["supply"] + w["expiry"]
        for k in ("cover", "demand", "supply", "expiry"):
            w[k] /= total
        w["network"] = 0.0
    raw = clamp(sum(w[k] * v for k, v in zip(["cover", "demand", "supply", "expiry", "network"],
                                              [factors["cover_risk"], factors["demand_pressure"], factors["supply_gap"], factors["expiry_pressure"], factors["network_scarcity"]])))
    band = "CRITICAL" if raw >= .70 else "HIGH" if raw >= .50 else "MODERATE" if raw >= .30 else "STABLE"
    forced = None
    if cover_days < 1:
        band, forced = "CRITICAL", "days_of_cover < 1"
    return {"band": band, "raw": round(raw, 4), "factors": factors, "weights_version": "weights-v1", "state": "OK", "forced": forced}

@app.post("/v1/simulate")
def simulate(inp: SimulationIn):
    simulated_demand = inp.baseline_demand * (1 + inp.surge_pct / 100)
    delta = int(round(simulated_demand - inp.baseline_demand))
    return {
        "mode": "SIMULATION",
        "assumptions": [f"scenario surge={inp.surge_pct}%", f"days={inp.days}", "cloned snapshot"],
        "result": {
            "baselineAvailable": inp.baseline_stock,
            "projectedAvailable": max(0, int(inp.baseline_stock) - delta),
            "simulatedDemand": round(simulated_demand, 2),
            "deltaUnits": -delta,
        },
    }
