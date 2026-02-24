from fastapi import FastAPI
from pydantic import BaseModel
from ask import ask   # import your ask() function
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all (for dev)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class Query(BaseModel):
    question: str

@app.post("/chat")
def chat(query: Query):
    answer = ask(query.question, [])
    return {"answer": answer}