from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SECUSYNC API", version="0.1.0")

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from app.api.routes import targets, runs

app.include_router(targets.router, prefix="/api/targets", tags=["targets"])
app.include_router(runs.router, prefix="/api/runs", tags=["runs"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "SECUSYNC Backend Running", "version": "0.1.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
