from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Bem-vindo à API Sentinnell!"}

@router.get("/example")
async def example_route():
    return {"message": "Esta é uma rota de exemplo."}
