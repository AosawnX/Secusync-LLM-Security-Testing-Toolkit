from typing import List, Optional
from app.models.target import TargetProfile, TargetProfileCreate
import json
import os

STORAGE_FILE = "runs/targets.json"

class TargetService:
    def __init__(self):
        os.makedirs("runs", exist_ok=True)
        if not os.path.exists(STORAGE_FILE):
             with open(STORAGE_FILE, "w") as f:
                 json.dump([], f)

    def _load_targets(self) -> List[dict]:
        try:
            with open(STORAGE_FILE, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []

    def _save_targets(self, targets: List[dict]):
        with open(STORAGE_FILE, "w") as f:
            json.dump(targets, f, indent=2, default=str)

    def create_target(self, profile_in: TargetProfileCreate) -> TargetProfile:
        targets = self._load_targets()
        profile = TargetProfile(**profile_in.dict())
        targets.append(json.loads(profile.json()))
        self._save_targets(targets)
        return profile

    def list_targets(self) -> List[TargetProfile]:
        data = self._load_targets()
        return [TargetProfile(**item) for item in data]

    def get_target(self, target_id: str) -> Optional[TargetProfile]:
        targets = self.list_targets()
        for t in targets:
            if t.id == target_id:
                return t
        return None

    def update_target(self, target_id: str, profile_in: TargetProfileCreate) -> Optional[TargetProfile]:
        targets = self._load_targets()
        for i, t in enumerate(targets):
            if t['id'] == target_id:
                # Update fields
                updated_data = t.copy()
                updated_data.update(profile_in.dict())
                # Keep ID and Created At
                updated_data['id'] = target_id
                updated_data['created_at'] = t['created_at']
                
                targets[i] = updated_data
                self._save_targets(targets)
                return TargetProfile(**updated_data)
        return None

    def delete_target(self, target_id: str) -> bool:
        targets = self._load_targets()
        initial_len = len(targets)
        targets = [t for t in targets if t['id'] != target_id]
        if len(targets) < initial_len:
            self._save_targets(targets)
            return True
        return False

target_service = TargetService()
