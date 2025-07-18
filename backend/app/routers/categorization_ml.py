from fastapi import APIRouter
from app.schemas.transaction import CategorizeMLRequest, CategorizeMLResponse
from app.services.transaction_ml_categorization_service import ml_categorize_transaction

router = APIRouter()

@router.post("/transactions/categorize-ml", response_model=CategorizeMLResponse)
def categorize_ml_endpoint(request: CategorizeMLRequest):
    category, confidence, alternatives = ml_categorize_transaction(request.description, request.amount)
    return CategorizeMLResponse(
        suggested_category=category,
        confidence=confidence,
        alternatives=alternatives
    ) 