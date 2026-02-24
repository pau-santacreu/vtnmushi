"""
VoiceNotes — Categories Endpoints
CRUD de categories per l'usuari autenticat.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.core.exceptions import NotFoundException, ConflictException
from app.api.deps import get_current_user

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=list[CategoryResponse])
async def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Llistar totes les categories de l'usuari."""
    categories = (
        db.query(Category)
        .filter(Category.user_id == current_user.id)
        .order_by(Category.name)
        .all()
    )
    return categories


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crear una nova categoria."""

    # Comprovar duplicat per nom dins el mateix usuari
    existing = (
        db.query(Category)
        .filter(Category.user_id == current_user.id, Category.name == data.name)
        .first()
    )
    if existing:
        raise ConflictException(f"Category '{data.name}' already exists")

    category = Category(
        user_id=current_user.id,
        name=data.name,
        color=data.color,
    )
    db.add(category)
    db.commit()
    db.refresh(category)

    return category


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: UUID,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Editar una categoria existent."""

    category = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == current_user.id)
        .first()
    )
    if not category:
        raise NotFoundException("Category")

    # Comprovar duplicat de nom si es canvia
    if data.name and data.name != category.name:
        existing = (
            db.query(Category)
            .filter(
                Category.user_id == current_user.id,
                Category.name == data.name,
                Category.id != category_id,
            )
            .first()
        )
        if existing:
            raise ConflictException(f"Category '{data.name}' already exists")

    # Actualitzar camps proporcionats
    if data.name is not None:
        category.name = data.name
    if data.color is not None:
        category.color = data.color

    db.commit()
    db.refresh(category)

    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Eliminar una categoria. Les notes associades queden sense categoria."""

    category = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == current_user.id)
        .first()
    )
    if not category:
        raise NotFoundException("Category")

    db.delete(category)
    db.commit()
