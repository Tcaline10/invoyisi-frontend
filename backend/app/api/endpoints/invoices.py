from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from app.api.dependencies.auth import get_current_active_user
from app.db.session import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.invoice_item import InvoiceItem
from app.models.user import User
from app.schemas.invoice import Invoice as InvoiceSchema, InvoiceCreate, InvoiceUpdate

router = APIRouter()


@router.get("", response_model=List[InvoiceSchema])
def read_invoices(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: InvoiceStatus = Query(None, description="Filter by status"),
    client_id: int = Query(None, description="Filter by client"),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve invoices for the current user
    """
    query = db.query(Invoice).filter(Invoice.user_id == current_user.id)
    
    if status:
        query = query.filter(Invoice.status == status)
    
    if client_id:
        query = query.filter(Invoice.client_id == client_id)
    
    invoices = query.options(joinedload(Invoice.items)).offset(skip).limit(limit).all()
    return invoices


@router.post("", response_model=InvoiceSchema)
def create_invoice(
    *,
    db: Session = Depends(get_db),
    invoice_in: InvoiceCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create new invoice
    """
    # Create invoice
    invoice_data = invoice_in.dict(exclude={"items"})
    invoice = Invoice(**invoice_data, user_id=current_user.id)
    db.add(invoice)
    db.flush()  # Get the invoice ID without committing
    
    # Create invoice items
    for item_data in invoice_in.items:
        item = InvoiceItem(**item_data.dict(), invoice_id=invoice.id)
        db.add(item)
    
    db.commit()
    db.refresh(invoice)
    return invoice


@router.get("/{invoice_id}", response_model=InvoiceSchema)
def read_invoice(
    *,
    db: Session = Depends(get_db),
    invoice_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get invoice by ID
    """
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id, Invoice.user_id == current_user.id
    ).options(joinedload(Invoice.items)).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )
    return invoice


@router.put("/{invoice_id}", response_model=InvoiceSchema)
def update_invoice(
    *,
    db: Session = Depends(get_db),
    invoice_id: int,
    invoice_in: InvoiceUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update invoice
    """
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id, Invoice.user_id == current_user.id
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )
    
    # Update invoice fields
    update_data = invoice_in.dict(exclude={"items"}, exclude_unset=True)
    for field, value in update_data.items():
        setattr(invoice, field, value)
    
    # Update items if provided
    if invoice_in.items is not None:
        # Delete existing items
        db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice.id).delete()
        
        # Create new items
        for item_data in invoice_in.items:
            item = InvoiceItem(**item_data.dict(), invoice_id=invoice.id)
            db.add(item)
    
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.delete("/{invoice_id}", response_model=InvoiceSchema)
def delete_invoice(
    *,
    db: Session = Depends(get_db),
    invoice_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete invoice
    """
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id, Invoice.user_id == current_user.id
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )
    
    db.delete(invoice)
    db.commit()
    return invoice
