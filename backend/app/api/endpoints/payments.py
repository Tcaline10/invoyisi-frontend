from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.dependencies.auth import get_current_active_user
from app.db.session import get_db
from app.models.payment import Payment
from app.models.invoice import Invoice, InvoiceStatus
from app.models.user import User
from app.schemas.payment import Payment as PaymentSchema, PaymentCreate, PaymentUpdate

router = APIRouter()


@router.get("", response_model=List[PaymentSchema])
def read_payments(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    invoice_id: int = Query(None, description="Filter by invoice"),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve payments for the current user
    """
    query = db.query(Payment).filter(Payment.user_id == current_user.id)
    
    if invoice_id:
        query = query.filter(Payment.invoice_id == invoice_id)
    
    payments = query.offset(skip).limit(limit).all()
    return payments


@router.post("", response_model=PaymentSchema)
def create_payment(
    *,
    db: Session = Depends(get_db),
    payment_in: PaymentCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create new payment
    """
    # Check if invoice exists and belongs to user
    invoice = db.query(Invoice).filter(
        Invoice.id == payment_in.invoice_id, Invoice.user_id == current_user.id
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )
    
    # Create payment
    payment = Payment(**payment_in.dict(), user_id=current_user.id)
    db.add(payment)
    
    # Update invoice status if payment covers the total
    total_paid = db.query(Payment).filter(
        Payment.invoice_id == invoice.id
    ).with_entities(db.func.sum(Payment.amount)).scalar() or 0
    
    total_paid += payment_in.amount
    
    if total_paid >= invoice.total:
        invoice.status = InvoiceStatus.PAID
        db.add(invoice)
    
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/{payment_id}", response_model=PaymentSchema)
def read_payment(
    *,
    db: Session = Depends(get_db),
    payment_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get payment by ID
    """
    payment = db.query(Payment).filter(
        Payment.id == payment_id, Payment.user_id == current_user.id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )
    return payment


@router.put("/{payment_id}", response_model=PaymentSchema)
def update_payment(
    *,
    db: Session = Depends(get_db),
    payment_id: int,
    payment_in: PaymentUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update payment
    """
    payment = db.query(Payment).filter(
        Payment.id == payment_id, Payment.user_id == current_user.id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )
    
    # Update payment fields
    update_data = payment_in.dict(exclude_unset=True)
    
    # If invoice_id is being changed, verify the new invoice exists and belongs to user
    if "invoice_id" in update_data and update_data["invoice_id"] != payment.invoice_id:
        invoice = db.query(Invoice).filter(
            Invoice.id == update_data["invoice_id"], Invoice.user_id == current_user.id
        ).first()
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found",
            )
    
    for field, value in update_data.items():
        setattr(payment, field, value)
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.delete("/{payment_id}", response_model=PaymentSchema)
def delete_payment(
    *,
    db: Session = Depends(get_db),
    payment_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete payment
    """
    payment = db.query(Payment).filter(
        Payment.id == payment_id, Payment.user_id == current_user.id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )
    
    # Get the invoice to update its status after payment deletion
    invoice_id = payment.invoice_id
    
    db.delete(payment)
    db.commit()
    
    # Update invoice status after payment deletion
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if invoice:
        total_paid = db.query(Payment).filter(
            Payment.invoice_id == invoice.id
        ).with_entities(db.func.sum(Payment.amount)).scalar() or 0
        
        if total_paid < invoice.total and invoice.status == InvoiceStatus.PAID:
            invoice.status = InvoiceStatus.PENDING
            db.add(invoice)
            db.commit()
    
    return payment
