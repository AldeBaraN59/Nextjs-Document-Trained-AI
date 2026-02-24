How to use:
Front-End Installations:
npm install react-markdown remark-gfm

Setup Python Virutal Enviornment (venv): 
i) python -m venv venv
ii) .\venv\Scripts\activate

Inside (venv) install the following pip installations
pip install requests beautifulsoup4 chromadb sentence-transformers groq python-dotenv

Run the: ingest.py file. It will generate the weights in nextjs_chromadb folder. It will take 5-10 mins. 

Go to --->   https://console.groq.com/keys
setup api key and put it .env file.

You may select different models provided but I like to use qwen model.

Run the: python ask.py --file example.txt . You may change the examples in the txt file.

EXPECTED TEXT IN VSCODE TERMINAL:

BertModel LOAD REPORT from: sentence-transformers/all-MiniLM-L6-v2
Key                     | Status     |  |
------------------------+------------+--+-
embeddings.position_ids | UNEXPECTED |  |

Notes:
- UNEXPECTED    :can be ignored when loading from different task/architecture; not ok if you expect identical arch.
📄 Loaded file: example.txt


Personal Observations:
It does use the features mentioned in the latest document and even surpasses the knowledge base of gpt and claude. 
Sometimes it may not fulfil your intended requests because what ever code you have may not need that feature. But it will still try to add optimization features. 

Nevertheless, the pipeline is still in developing phase and the embeddings, knowledge base and llm prompts should have lot of scope for improvements.
