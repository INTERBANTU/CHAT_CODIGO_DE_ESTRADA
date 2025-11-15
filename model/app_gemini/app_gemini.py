import streamlit as st
from dotenv import load_dotenv
import os
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from htmlTemplates import css, bot_template, user_template

def get_pdf_text(pdf_docs):
    text = ""
    total_pages = 0
    successful_pages = 0
    
    for pdf in pdf_docs:
        pdf_reader = PdfReader(pdf)
        total_pages += len(pdf_reader.pages)
        
        for i, page in enumerate(pdf_reader.pages):
            try:
                page_text = page.extract_text()
                if page_text and page_text.strip():
                    text += f"--- Documento: {pdf.name} | Página {i+1} ---\n{page_text}\n\n"
                    successful_pages += 1
                else:
                    st.warning(f"Página {i+1} do documento {pdf.name} retornou texto vazio")
            except Exception as e:
                st.error(f"Erro ao extrair página {i+1} do documento {pdf.name}: {str(e)}")
    
    st.info(f"Páginas processadas: {successful_pages}/{total_pages}")
    st.info(f"Total de caracteres extraídos: {len(text)}")
    
    return text

def get_text_chunks(text):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        separators=[r"\n{2,}", " "],
        is_separator_regex=True,
    )
    chunks = text_splitter.split_text(text)
    st.info(f"Criados {len(chunks)} chunks de texto")
    return chunks

def get_vectorstore(text_chunks):
    # Usando Hugging Face embeddings locais
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={'device': 'cpu'},  # Usa CPU para compatibilidade
        encode_kwargs={'normalize_embeddings': True}
    )
    vectorstore = FAISS.from_texts(texts=text_chunks, embedding=embeddings)
    return vectorstore

def get_qa_chain(vectorstore):
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-pro",
        temperature=0.1,
        convert_system_message_to_human=True
    )
    
    custom_prompt_template = """{context}

---
Given the context provided below, answer the question as accurately as possible.
Always reply in Portuguese.
Act as an academic assistant or expert. Provide clear explanations and, when appropriate, suggest possible actions, but do not state information as absolute authority.

Search for all relevant information related to the question.

Before answering, carefully read and consider the entire article, section, or subsection relevant to the question. 
Also read and consider the immediately preceding (previous) and immediately following (next) sections that surround that article/section to ensure accuracy and completeness.

Prioritize the article, section, or subsection that is most directly compatible with the question. Only after that, consider complementary information from other articles or documents.

If there are articles, sections, or documents that contain information in conflict with each other, present these differences clearly to the user, explaining possible reasons and implications.

Provide explanations including articles, section numbers, or subsections of the regulation whenever applicable.
Always state clearly the name of the document where the information can be found, noting that there may be multiple documents in the context.

⚠️ If the information is not found in the provided documents, do not invent or speculate. In this case, respond exactly as follows: 
"Lamento, mas não consigo fornecer essa informação no momento. Recomendo que entre em contato diretamente com o Registo Académico ou com a entidade responsável."

Be precise, clear, and concise, prioritizing verified information from the context.
Include additional information that may help to explain the topic, even if not directed asked, and always cite relevant articles.

Always insert references and sources directly within the paragraphs where the information is explained.
At the end of the answer, provide a complete list of all referenced documents and articles used.

Separate different points into different paragraphs for clarity.
Include references, articles, and sources whenever possible.

Context: {context}  
Question: {question}  

Answer:"""

    QA_PROMPT = PromptTemplate(
        template=custom_prompt_template,
        input_variables=["context", "question"]
    )
    
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vectorstore.as_retriever(
            search_type="mmr",
            search_kwargs={"k": 8, "fetch_k": 10, "lambda_mult": 0.6}
        ),
        return_source_documents=True,
        chain_type_kwargs={"prompt": QA_PROMPT}
    )
    return qa_chain

def handle_userinput(user_question):
    if st.session_state.conversation is None:
        st.error("Por favor, processe os PDFs primeiro antes de fazer perguntas.")
        return
        
    try:
        response = st.session_state.conversation({'query': user_question})
        
        st.write(bot_template.replace("{{MSG}}", response['result']), unsafe_allow_html=True)
        
        if 'source_documents' in response and response['source_documents']:
            with st.expander("📋 Ver fontes utilizadas para esta resposta"):
                for i, doc in enumerate(response['source_documents']):
                    st.write(f"**Fonte {i+1}:**")
                    st.write(f"{doc.page_content[:500]}..." if len(doc.page_content) > 500 else doc.page_content)
                    st.write("---")
                
    except Exception as e:
        st.error(f"Erro ao processar pergunta: {str(e)}")

def main():
    load_dotenv()
    st.set_page_config(page_title="Chat with multiple PDFs", page_icon=":books:")
    st.write(css, unsafe_allow_html=True)

    if "conversation" not in st.session_state:
        st.session_state.conversation = None

    st.header("Chat with multiple PDFs :books:")
    user_question = st.text_input("Ask your question about the uploaded PDFs:")
    
    if user_question:
        st.write(user_template.replace("{{MSG}}", user_question), unsafe_allow_html=True)
        handle_userinput(user_question)

    with st.sidebar:
        st.subheader("Your PDFs")
        pdf_docs = st.file_uploader(
            "Upload your PDFs here and click on 'Process'", 
            accept_multiple_files=True, 
            type=["pdf"]
        )
        
        st.info("🔧 Usando embeddings locais do Hugging Face")
        st.info("🤖 Chat: Gemini 1.5 Pro")
        
        if st.button("Process"):
            if not pdf_docs:
                st.error("Por favor, faça upload de pelo menos um arquivo PDF")
            else:
                with st.spinner("Processando PDFs com Hugging Face embeddings..."):
                    raw_text = get_pdf_text(pdf_docs)
                    
                    if not raw_text.strip():
                        st.error("Não foi possível extrair texto dos PDFs. Os arquivos podem ser imagens digitalizadas ou corrompidos.")
                        return
                    
                    text_chunks = get_text_chunks(raw_text)
                    
                    if not text_chunks:
                        st.error("Não foi possível criar chunks de texto")
                        return
                    
                    vectorstore = get_vectorstore(text_chunks)
                    
                    st.session_state.conversation = get_qa_chain(vectorstore)
                    st.success("Processamento concluído! Você já pode fazer perguntas.")

if __name__ == "__main__":
    main()