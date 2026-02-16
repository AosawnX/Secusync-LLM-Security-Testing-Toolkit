from fastapi import APIRouter, HTTPException
from typing import List
from app.models.target import TargetProfile, TargetProfileCreate
from app.services.target_service import target_service

router = APIRouter()

@router.post("/", response_model=TargetProfile)
def create_target(profile: TargetProfileCreate):
    return target_service.create_target(profile)

@router.get("/", response_model=List[TargetProfile])
def list_targets():
    return target_service.list_targets()

@router.get("/{target_id}", response_model=TargetProfile)
def get_target(target_id: str):
    target = target_service.get_target(target_id)
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    return target

@router.put("/{target_id}", response_model=TargetProfile)
def update_target(target_id: str, profile: TargetProfileCreate):
    target = target_service.update_target(target_id, profile)
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    return target

@router.delete("/{target_id}")
def delete_target(target_id: str):
    success = target_service.delete_target(target_id)
    if not success:
        raise HTTPException(status_code=404, detail="Target not found")
    return {"status": "success", "message": "Target deleted"}
