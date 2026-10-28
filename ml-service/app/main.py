from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import HealthResponse, SpendingFeatures, SegmentationResponse
from app.segmentation import load_artifacts, predict_segmentation, _metadata


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_artifacts()
    yield


app = FastAPI(
    title="FinSight AI ML Microservice",
    description="Microservice providing machine learning predictions (K-Means user segmentation, anomalies, forecasting)",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for internal Express backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health_check():
    models_ready = load_artifacts()
    return HealthResponse(
        status="ok",
        service="FinSight AI ML Microservice",
        version="1.0.0",
        models_loaded=models_ready,
    )


@app.post("/segmentation/predict", response_model=SegmentationResponse)
def segment_user(features: SpendingFeatures):
    try:
        return predict_segmentation(features)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/segmentation/clusters")
def get_cluster_metadata():
    load_artifacts()
    if not _metadata:
        raise HTTPException(status_code=500, detail="Metadata not loaded")
    return _metadata
