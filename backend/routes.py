from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Bem-vindo à API Sentinnell!"}

@router.get("/categories")
async def get_categories():
    return {"message": "As categorias vêm dos arquivos JSON: categorias, nivel2 e nivel3."}
