import time, hashlib, requests, re
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
import tiktoken

# ================= CONFIG =================
BASE = "https://nextjs.org/docs"
DB_PATH = "./nextjs_chroma_db"
COLLECTION = "nextjs_docs"
MAX_PAGES = 200
TOKENS_PER_CHUNK = 500
OVERLAP_TOKENS = 80

# embedding model
embed_fn = SentenceTransformerEmbeddingFunction("all-MiniLM-L6-v2")
tokenizer = tiktoken.get_encoding("cl100k_base")

# ================= CRAWLER =================
def get_links():
    visited = set()
    queue = [BASE]
    urls = []

    while queue and len(urls) < MAX_PAGES:
        url = queue.pop(0)
        if url in visited:
            continue
        visited.add(url)

        print("Crawl:", url)
        try:
            r = requests.get(url, timeout=10)
            if not r.ok:
                continue

            soup = BeautifulSoup(r.text, "html.parser")
            urls.append(url)

            for a in soup.find_all("a", href=True):
                href = urljoin(BASE, a["href"])

                # filter junk
                if not href.startswith(BASE):
                    continue
                if "#" in href or "api" in href or "_next" in href:
                    continue

                if href not in visited:
                    queue.append(href)

            time.sleep(0.3)

        except Exception as e:
            print("Error:", e)

    return list(set(urls))

# ================= SCRAPER =================
def scrape(url):
    try:
        r = requests.get(url, timeout=15)
        if not r.ok:
            return None

        soup = BeautifulSoup(r.text, "html.parser")

        for tag in soup(["nav","footer","header","script","style","aside"]):
            tag.decompose()

        title = soup.find("h1")
        title = title.text.strip() if title else "NO TITLE"

        main = soup.find("main") or soup.body
        if not main:
            return None

        text = "\n".join(x.strip() for x in main.get_text("\n").splitlines() if x.strip())
        return {"url": url, "title": title, "text": text}

    except:
        return None

# ================= TOKEN CHUNKER =================
def chunk_text(text):
    tokens = tokenizer.encode(text)
    chunks = []

    start = 0
    while start < len(tokens):
        end = start + TOKENS_PER_CHUNK
        chunk = tokenizer.decode(tokens[start:end])
        chunks.append(chunk)
        start += TOKENS_PER_CHUNK - OVERLAP_TOKENS

    return chunks

# ================= INGEST =================
def ingest():
    client = chromadb.PersistentClient(path=DB_PATH)
    col = client.get_or_create_collection(COLLECTION, embedding_function=embed_fn)

    urls = get_links()
    print("Found pages:", len(urls))

    seen_hashes = set()
    total = 0

    for i, url in enumerate(urls):
        print(f"\n[{i+1}/{len(urls)}] Scraping {url}")
        page = scrape(url)
        if not page or len(page["text"]) < 200:
            continue

        chunks = chunk_text(page["text"])

        for j, chunk in enumerate(chunks):
            h = hashlib.md5(chunk.encode()).hexdigest()
            if h in seen_hashes:
                continue
            seen_hashes.add(h)

            cid = hashlib.md5(f"{url}_{j}".encode()).hexdigest()

            col.upsert(
                ids=[cid],
                documents=[chunk],
                metadatas=[{
                    "url": url,
                    "title": page["title"],
                    "chunk": j,
                    "tokens": len(tokenizer.encode(chunk))
                }]
            )

        total += len(chunks)
        time.sleep(0.1)

    print("DONE. Total chunks:", total)

# ================= RUN =================
if __name__ == "__main__":
    ingest()