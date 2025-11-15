
# 📄 PDF Chat Application

[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://www.python.org/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.50.0-orange)](https://streamlit.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-API-red)](https://openai.com/)
[![FAISS](https://img.shields.io/badge/FAISS-CPU-purple)](https://github.com/facebookresearch/faiss)

This application allows users to interact with the content of multiple **PDF files** through an **intelligent chat interface**.
It **processes uploaded documents**, extracts and organizes the text into smaller chunks, generates vector representations (embeddings), and stores them in a FAISS index.
This enables users to ask natural language questions about the PDFs and receive contextual answers based on the documents’ content in a conversational way.

The main goal is to simplify the exploration and understanding of large amounts of information contained in PDFs, offering a faster and more interactive way to access knowledge.

---

##  📸 Chat Interface
![PDF Chat Interface](https://github.com/DaltonChivambo/MULTIPLE_PDF_CHAT/blob/main/prints/chat_page.png?raw=true)
---

## 🚀 Features
- Upload multiple PDF files.
- Extract and process PDF text into chunks.
- Generate embeddings using OpenAI embeddings.
- Store vectors in FAISS for efficient semantic search.
- Interactive Streamlit interface for easy use.

---

## 🛠️ Technologies Used
- **[Streamlit](https://streamlit.io/)**: Web interface for uploading PDFs and interacting with the app.
- **[PyPDF2](https://pypi.org/project/PyPDF2/)**: Extract text from PDFs.
- **[LangChain](https://www.langchain.com/)**: Text splitting, embeddings integration, and vector store management.
- **[python-dotenv](https://pypi.org/project/python-dotenv/)**: Load environment variables like API keys.
- **[FAISS](https://github.com/facebookresearch/faiss)**: Efficient similarity search for embeddings.
- **[OpenAI](https://openai.com/)**: Generates high-quality text embeddings.
- **[Sentence Transformers](https://www.sbert.net/)** (optional for HuggingFace embeddings).

---

## ⚙️ Installation

1. Clone the repository:
```bash
git clone https://github.com/DaltonChivambo/MULTIPLE_PDF_CHAT.git
cd pdf-chat-app


2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create a `.env` file with your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key
```

---

## 📝 Usage

Run the Streamlit app:

```bash
streamlit run app.py
```

1. Open the app in your browser.
2. Upload PDF files.
3. Click **Process** to extract text, generate embeddings, and store in FAISS.
4. Query PDFs using semantic search (if implemented).

---

## 💡 How It Works

1. **PDF Text Extraction:**
   `PyPDF2` extracts text from uploaded PDFs.

2. **Text Chunking:**
   `RecursiveCharacterTextSplitter` splits text into manageable chunks.

3. **Embedding Generation:**
   `OpenAIEmbeddings` converts chunks into vectors.

4. **Vector Storage:**
   FAISS stores embeddings for similarity search.

---

## 🔑 OpenAI vs HuggingFace Embeddings

| Feature    | OpenAIEmbeddings | HuggingFaceInstructEmbeddings |
| ---------- | ---------------- | ----------------------------- |
| Execution  | Cloud (API)      | Local CPU/GPU                 |
| Cost       | Paid             | Free (compute cost)           |
| Dimensions | 1536             | 768                           |
| Privacy    | Sent to OpenAI   | Local processing              |
| Use Case   | General-purpose  | Task-specific                 |

> This project uses **OpenAI embeddings** for high-quality semantic search.

---

## 📂 Folder Structure

```
pdf-chat-app/
├─ app.py
├─ requirements.txt
├─ .env
├─ utils/
│  ├─ pdf_processing.py
│  ├─ embeddings.py
└─ README.md
```

---

## ⚠️ Notes

* FAISS indexes and embeddings are **not versioned**; they can be regenerated.
* OpenAI API usage may incur costs depending on volume.
* Querying interface can be extended for Q&A over PDFs.

---


## 📦 Requirements
```
Python 3.12
```

```txt
streamlit=1.50.0
pypdf2=3.0.1
langchain=0.3.27
python-dotenv=1.1.1
faiss-cpu=1.12.0

openai=1.109.1
tiktoken=0.11.0
langchain-community=0.3.30
#langchain-openai=0.3.27 --- IGNORE ---

# uncomment to use huggingface llms
#huggingface-hub=0.35.3

# uncomment to use instructor embeddings
#InstructorEmbedding=1.0.1
#sentence-transformers=5.1.1
```

---

## 📌 License

MIT License
