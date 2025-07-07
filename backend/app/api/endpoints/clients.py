from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.dependencies.auth import get_current_active_user
from app.db.session import get_db
from app.models.client import Client
from app.models.user import User
from app.schemas.client import Client as ClientSchema, ClientCreate, ClientUpdate

router = APIRouter()


@router.get("", response_model=List[ClientSchema])
def read_clients(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: str = Query(None, description="Search by name or email"),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve clients for the current user
    """
    query = db.query(Client).filter(Client.user_id == current_user.id)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Client.name.ilike(search_term)) | (Client.email.ilike(search_term))
        )
    
    clients = query.offset(skip).limit(limit).all()
    return clients


@router.post("", response_model=ClientSchema)
def create_client(
    *,
    db: Session = Depends(get_db),
    client_in: ClientCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create new client
    """
    client = Client(
        **client_in.dict(),
        user_id=current_user.id,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.get("/{client_id}", response_model=ClientSchema)
def read_client(
    *,
    db: Session = Depends(get_db),
    client_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get client by ID
    """
    client = db.query(Client).filter(
        Client.id == client_id, Client.user_id == current_user.id
    ).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    return client


@router.put("/{client_id}", response_model=ClientSchema)
def update_client(
    *,
    db: Session = Depends(get_db),
    client_id: int,
    client_in: ClientUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update client
    """
    client = db.query(Client).filter(
        Client.id == client_id, Client.user_id == current_user.id
    ).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    update_data = client_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)
    
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}", response_model=ClientSchema)
def delete_client(
    *,
    db: Session = Depends(get_db),
    client_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete client
    """
    client = db.query(Client).filter(
        Client.id == client_id, Client.user_id == current_user.id
    ).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    db.delete(client)
    db.commit()
    return client
