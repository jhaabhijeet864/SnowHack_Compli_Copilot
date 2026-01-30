# Example usage for future API integration:
# from services.ocr import OCRService
# svc = OCRService()
# text = svc.extract_text_from_image(receipt_image_path_or_bytes)
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from api.auth import get_current_firebase_user
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_, and_
from database.session import get_db
from models.entities import Receipt
from models.schemas import ReceiptV2Create, ReceiptOut
import uuid
from pathlib import Path

router = APIRouter(
    prefix="/api/v1/receipts",
    tags=["receipts"],
)

# Define a directory to save uploads
UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

# Error model for consistent error responses
def error_response(code: str, message: str, details: Any = None) -> Dict[str, Any]:
    response = {"error": {"code": code, "message": message}}
    if details is not None:
        response["error"]["details"] = details
    return response


# New endpoint for multiple file upload and batch processing
@router.post("/batch", status_code=status.HTTP_201_CREATED, response_model=List[ReceiptOut])
async def create_receipts_batch(
    receipts: List[ReceiptV2Create],
    db: Session = Depends(get_db),
    current_user=Depends(get_current_firebase_user)
) -> Any:
    """
    Accepts a batch of receipt data in JSON format and creates receipt records in the database.
    """
    new_receipts = []
    for receipt_data in receipts:
        # Here you might want to associate the receipt with the user
        # For now, just creating the receipt object
        new_receipt = Receipt(
            id=str(uuid.uuid4()),
            vendor=receipt_data.vendor,
            date=receipt_data.date,
            amount=receipt_data.amount,
            gstin=receipt_data.gstin,
            filename=receipt_data.filename,
            mime_type=receipt_data.mime_type,
            status="processed",  # Or any other default status
            # user_id=current_user.id # If you add user association
        )
        db.add(new_receipt)
        new_receipts.append(new_receipt)

    db.commit()
    for r in new_receipts:
        db.refresh(r) # Refresh to get DB-generated values like timestamps

    return new_receipts


@router.get("/")
async def list_receipts(
    q: Optional[str] = None,
    gstin: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_firebase_user)
) -> Dict[str, Any]:
    """List receipts with optional filtering and pagination."""
    conditions = []
    if gstin:
        conditions.append(Receipt.gstin == gstin)
    if status:
        conditions.append(Receipt.status == status)
    if q:
        like = f"%{q}%"
        conditions.append(or_(Receipt.vendor.ilike(like), Receipt.category.ilike(like)))

    where_clause = and_(*conditions) if conditions else None

    # Total count
    total = db.scalar(select(func.count()).select_from(Receipt).where(where_clause)) if where_clause else db.scalar(select(func.count()).select_from(Receipt))

    # Page query
    stmt = select(Receipt).where(where_clause) if where_clause else select(Receipt)
    stmt = stmt.order_by(Receipt.created_at.desc()).offset((page - 1) * size).limit(size)
    rows = db.execute(stmt).scalars().all()

    def to_dict(obj: Receipt) -> Dict[str, Any]:
        return {
            "id": obj.id,
            "vendor": obj.vendor,
            "date": obj.date,
            "amount": obj.amount,
            "currency": obj.currency,
            "category": obj.category,
            "gstin": obj.gstin,
            "tax_amount": obj.tax_amount,
            "status": obj.status,
            "filename": obj.filename,
            "mime_type": obj.mime_type,
            "extracted": obj.extracted or {},
            "created_at": obj.created_at.isoformat() if obj.created_at else None,
            "updated_at": obj.updated_at.isoformat() if obj.updated_at else None,
        }

    return {
        "items": [to_dict(r) for r in rows],
        "total": int(total or 0),
        "page": page,
        "size": size,
    }

@router.get("/{id}")
async def get_receipt(
    id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_firebase_user)
) -> Dict[str, Any]:
    """Get details for a specific receipt by ID."""
    obj = db.get(Receipt, id)
    if not obj:
        raise HTTPException(status_code=404, detail=error_response("NOT_FOUND", f"Receipt with ID {id} not found"))
    return {
        "id": obj.id,
        "vendor": obj.vendor,
        "date": obj.date,
        "amount": obj.amount,
        "currency": obj.currency,
        "category": obj.category,
        "gstin": obj.gstin,
        "tax_amount": obj.tax_amount,
        "status": obj.status,
        "filename": obj.filename,
        "mime_type": obj.mime_type,
        "extracted": obj.extracted or {},
        "created_at": obj.created_at.isoformat() if obj.created_at else None,
        "updated_at": obj.updated_at.isoformat() if obj.updated_at else None,
    }

@router.patch("/{id}")
async def update_receipt(
    id: str,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_firebase_user)
) -> Dict[str, Any]:
    """Update a receipt with user-verified information."""
    obj = db.get(Receipt, id)
    if not obj:
        raise HTTPException(status_code=404, detail=error_response("NOT_FOUND", f"Receipt with ID {id} not found"))

    allowed = {"vendor", "date", "amount", "currency", "category", "gstin", "tax_amount", "status"}
    for k, v in payload.items():
        if k in allowed:
            setattr(obj, k, v)

    db.add(obj)
    db.commit()
    db.refresh(obj)

    return {
        "id": obj.id,
        "vendor": obj.vendor,
        "date": obj.date,
        "amount": obj.amount,
        "currency": obj.currency,
        "category": obj.category,
        "gstin": obj.gstin,
        "tax_amount": obj.tax_amount,
        "status": obj.status,
        "filename": obj.filename,
        "mime_type": obj.mime_type,
        "extracted": obj.extracted or {},
        "created_at": obj.created_at.isoformat() if obj.created_at else None,
        "updated_at": obj.updated_at.isoformat() if obj.updated_at else None,
    }

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_receipt(id: str, db: Session = Depends(get_db), current_user=Depends(get_current_firebase_user)) -> None:
    """Delete a receipt by ID."""
    obj = db.get(Receipt, id)
    if not obj:
        raise HTTPException(status_code=404, detail=error_response("NOT_FOUND", f"Receipt with ID {id} not found"))
    db.delete(obj)
    db.commit()
    return None
