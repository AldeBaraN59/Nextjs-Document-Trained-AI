import time, hashlib, requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

# ================= CONFIG =================
NEXTJS_DOCS_BASE = "https://nextjs.org/docs"
CHROMA_DB_PATH   = "./nextjs_chroma_db"
COLLECTION_NAME  = "nextjs_docs"
CHUNK_SIZE       = 800
CHUNK_OVERLAP    = 100

print("🔧 Loading embedding model...")
embed_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
print("✅ Embedding model loaded")

# ================= CRAWLER =================
def get_all_doc_links(base_url):
    print("🌐 Crawling docs pages...")
    visited, to_visit, found = set(), [base_url], []

    while to_visit and len(found) < 50:  # reduced to 50 for debugging
        url = to_visit.pop(0)
        if url in visited:
            continue
        visited.add(url)

        print(f"  🔍 Fetching: {url}")
        try:
            r = requests.get(url, timeout=10)
            if not r.ok:
                print(f"  ❌ Failed HTTP {r.status_code}")
                continue

            soup = BeautifulSoup(r.text, "html.parser")
            found.append(url)

            for a in soup.find_all("a", href=True):
                href = urljoin(base_url, a["href"])
                if href.startswith(NEXTJS_DOCS_BASE) and href not in visited:
                    to_visit.append(href)

            time.sleep(0.2)

        except Exception as e:
            print(f"  ⚠️ Error crawling {url}: {e}")

    print(f"✅ Found {len(found)} doc pages")
    return found

# ================= SCRAPER =================
def scrape_page(url):
    print(f"📄 Scraping page: {url}")
    try:
        r = requests.get(url, timeout=15)
        if not r.ok:
            print(f"  ❌ HTTP error {r.status_code}")
            return None

        soup = BeautifulSoup(r.text, "html.parser")

        # remove junk
        for tag in soup.find_all(["nav","header","footer","aside","script","style"]):
            tag.decompose()

        title = soup.find("h1")
        title = title.get_text(strip=True) if title else "NO TITLE"

        main = soup.find("main") or soup.find("article") or soup.body
        if not main:
            print("  ⚠️ No main content found")
            return None

        text = "\n".join(l.strip() for l in main.get_text("\n").splitlines() if l.strip())
        print(f"  ✅ Extracted {len(text)} characters")

        return {"url": url, "title": title, "text": text}

    except Exception as e:
        print(f"  ❌ Error scraping {url}: {e}")
        return None

# ================= CHUNKER =================
def chunk_text(text):
    chunks, start = [], 0
    while start < len(text):
        chunk = text[start:start+CHUNK_SIZE]
        chunks.append(chunk)
        start += CHUNK_SIZE - CHUNK_OVERLAP
    print(f"  ✂️ Created {len(chunks)} chunks")
    return chunks

# ================= INGEST PIPELINE =================
def ingest():
    print("\n🚀 STARTING INGEST PIPELINE")
    print("📦 Initializing ChromaDB...")

    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    collection = client.get_or_create_collection(
        COLLECTION_NAME, embedding_function=embed_fn
    )

    print("✅ ChromaDB ready")

    urls = get_all_doc_links(NEXTJS_DOCS_BASE)
    total_chunks = 0

    for i, url in enumerate(urls):
        print(f"\n================ PAGE {i+1}/{len(urls)} =================")
        page = scrape_page(url)

        if not page or len(page["text"]) < 100:
            print("⚠️ Skipping small/empty page")
            continue

        chunks = chunk_text(page["text"])

        ids = [hashlib.md5(f"{url}_{j}".encode()).hexdigest() for j in range(len(chunks))]
        metas = [{"url": url, "title": page["title"], "chunk": j} for j in range(len(chunks))]

        print(f"💾 Inserting {len(chunks)} chunks into ChromaDB...")

        for b in range(0, len(ids), 50):
            collection.upsert(
                ids=ids[b:b+50],
                documents=chunks[b:b+50],
                metadatas=metas[b:b+50]
            )
            print(f"   ➕ Inserted batch {b} → {b+50}")

        total_chunks += len(chunks)
        time.sleep(0.1)

    print("\n================ DONE ================")
    print(f"✅ Stored {total_chunks} chunks from {len(urls)} pages")
    print(f"📂 Database path: {CHROMA_DB_PATH}")

# ================= RUN =================
if __name__ == "__main__":
    ingest()