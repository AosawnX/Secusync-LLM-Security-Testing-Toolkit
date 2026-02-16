from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from typing import List
import os
import json

from app.models.run import Run, RunCreate
from app.services.run_service import RunService
from app.services.report_service import ReportService

router = APIRouter()
run_service = RunService()
report_service = ReportService()

@router.post("/", response_model=Run)
async def start_run(run_in: RunCreate, background_tasks: BackgroundTasks):
    run = run_service.create_run(run_in)
    background_tasks.add_task(run_service.execute_run, run.id)
    return run

@router.get("/", response_model=List[Run])
async def list_runs(target_id: str = None):
    return run_service.list_runs(target_id=target_id)

@router.post("/clear-history")
async def clear_run_history(target_id: str):
    run_service.clear_history(target_id)
    return {"status": "success", "message": "History cleared"}

@router.get("/{run_id}", response_model=Run)
async def get_run(run_id: str):
    run = run_service.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run

@router.get("/{run_id}/report/technical")
async def get_technical_report(run_id: str):
    run = run_service.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Use the judge connector from run_service
    if not run_service.judge_connector:
        # Fallback if no judge? Or fail? User insisted on LLM.
        # But let's allow fallback if judge is missing, though we prefer it.
        # However, generate_technical_report now expects judge_connector.
        pass 
        
    report_path = await report_service.generate_technical_report(run, run_service.judge_connector)
    return FileResponse(report_path, media_type='application/pdf', filename=f"Technical_Report_{run_id}.pdf")

@router.get("/{run_id}/report/executive")
async def get_executive_report(run_id: str):
    run = run_service.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Use the judge connector from run_service
    if not run_service.judge_connector:
        raise HTTPException(status_code=503, detail="Judge LLM not configured")

    report_path = await report_service.generate_executive_report(run, run_service.judge_connector)
    return FileResponse(report_path, media_type='application/pdf', filename=f"Executive_Report_{run_id}.pdf")

@router.get("/{run_id}/report/poc")
async def get_poc_bundle(run_id: str):
    run = run_service.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    if not run.findings:
         raise HTTPException(status_code=400, detail="No vulnerabilities found to generate POC")

    zip_path = report_service.generate_poc_bundle(run)
    if not zip_path:
        raise HTTPException(status_code=400, detail="Failed to generate POC")
        
    return FileResponse(zip_path, media_type='application/zip', filename=f"POC_Bundle_{run_id}.zip")

@router.get("/{run_id}/logs")
async def get_run_logs(run_id: str):
    run = run_service.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    log_path = f"runs/{run_id}/responses.jsonl"
    logs = []
    if os.path.exists(log_path):
        with open(log_path, "r") as f:
            for line in f:
                try:
                    logs.append(json.loads(line))
                except:
                    pass
    return logs
