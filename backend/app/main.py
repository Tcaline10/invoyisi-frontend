from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import auth, users, clients, invoices, payments

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="InvoiceAI API - A smart invoice management system",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:3000"],  # Hardcoded for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(clients.router, prefix="/api/clients", tags=["Clients"])
app.include_router(invoices.router, prefix="/api/invoices", tags=["Invoices"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])

@app.get("/api/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint to verify the API is running
    """
    return {"status": "healthy", "version": settings.APP_VERSION}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
