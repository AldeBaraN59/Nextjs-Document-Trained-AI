import sys, os, re
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────
CHROMA_DB_PATH  = "./nextjs_chroma_db"
COLLECTION_NAME = "nextjs_docs"
GROQ_MODEL      = "qwen/qwen3-32b"
TOP_K           = 10

SYSTEM_PROMPT = """

You are a senior Next.js (App Router) and React expert focused on writing production-ready, optimized, and error-free code.

Do NOT output internal reasoning, thoughts, or analysis.
If code is missing, ask for it in one short sentence.

Your task:

* Analyze the provided code internally step by step.
* Identify logical issues, edge cases, performance problems, and potential runtime crashes.
* Refactor and optimize the code where appropriate.
* Ensure the final solution follows best practices for Next.js, React, and modern JavaScript/TypeScript.
* Prevent runtime errors (e.g., undefined values, improper async handling, invalid hooks usage, server/client mismatch).
* Improve readability, maintainability, and performance.

Output rules:

* ONLY output the final corrected and optimized code.
* After the code, include a very brief explanation (2–4 sentences max).
* Do NOT describe what was wrong.
* Do NOT show your reasoning.
* Do NOT include markdown headings.
* Ensure the code can run without crashing.

If assumptions are required, make the safest and most production-ready choice.


"""
# ── Singletons ────────────────────────────────────────────────────────────────
groq    = Groq(api_key=os.getenv("GROQ_API_KEY"))
chroma  = chromadb.PersistentClient(path=CHROMA_DB_PATH)
embed_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

def get_collection():
    return chroma.get_collection(COLLECTION_NAME, embedding_function=embed_fn)

# ── RAG Retrieval ─────────────────────────────────────────────────────────────
def retrieve(query: str) -> str:
    results = get_collection().query(query_texts=[query], n_results=TOP_K)
    return "\n\n".join(
        f"--- {m.get('title','')} ({m.get('url','')}) ---\n{d}"
        for d, m in zip(results["documents"][0], results["metadatas"][0])
    )

# ── Strip Qwen Thinking Mode ─────────────────────────────────────────────────
def strip_thinking(text: str) -> str:
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()

# ── Groq Call ─────────────────────────────────────────────────────────────────
def ask(user_message: str, history: list) -> str:
    context = retrieve(user_message)
    messages = (
        [{"role": "system", "content": SYSTEM_PROMPT}]
        + history
        + [{"role": "user", "content": f"Relevant Next.js docs:\n\n{context}\n\n---\n{user_message}"}]
    )

    response = groq.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        temperature=0.02,
        max_tokens=4096,
    )
    return strip_thinking(response.choices[0].message.content)

# ── Read File ────────────────────────────────────────────────────────────────
def read_text_file(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

# ── Chat Loop ────────────────────────────────────────────────────────────────
def chat():
    print(f"=== Next.js Docs AI | {GROQ_MODEL} ===")
    print("Paste code or ask a question. Empty line = submit. 'exit' to quit.\n")

    history = []
    while True:
        print("You: ", end="", flush=True)
        lines = []
        while True:
            line = input()
            if line.strip().lower() == "exit":
                sys.exit(0)
            if line == "":
                break
            lines.append(line)

        user_input = "\n".join(lines).strip()
        if not user_input:
            continue

        answer = ask(user_input, history)
        print(f"\nAI:\n{answer}\n")

        history += [
            {"role": "user", "content": user_input},
            {"role": "assistant", "content": answer},
        ]
        history = history[-20:]

# ── CLI Entry ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "--ask":
        print(ask(" ".join(sys.argv[2:]), []))

    elif len(sys.argv) > 2 and sys.argv[1] == "--file":
        file_path = sys.argv[2]
        text = read_text_file(file_path)
        print(f"📄 Loaded file: {file_path}\n")
        print(ask(text, []))

    else:
        chat()