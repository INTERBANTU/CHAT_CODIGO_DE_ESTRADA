import streamlit as st
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI  # ✅ Mudado para GPT-4o
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
                    st.warning(f"Página {i+1} do documento {pdf.name} retornou texto vazio.")
            except Exception as e:
                st.error(f"Erro ao extrair página {i+1} do documento {pdf.name}: {str(e)}")

    st.info(f"Páginas processadas: {successful_pages}/{total_pages}")
    st.info(f"Total de caracteres extraídos: {len(text)}")

    return text


def get_text_chunks(text):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,
        chunk_overlap=700,
        separators=["\nArtigo", "\nARTIGO", "\nCapítulo", "\n", " "],
        is_separator_regex=False,
    )
    chunks = text_splitter.split_text(text)
    st.info(f"Criados {len(chunks)} chunks de texto (1500 chars, 400 overlap)")
    return chunks


def get_vectorstore(text_chunks):
    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
    vectorstore = FAISS.from_texts(texts=text_chunks, embedding=embeddings)
    return vectorstore


def get_qa_chain(vectorstore):
    # ✅ Mudado para GPT-4o
    llm = ChatOpenAI(
        model="gpt-4o", 
        temperature=0.1,
        max_tokens=2048,
    )

    custom_prompt_template = """{context}

---
Given the context provided below, answer the question as accurately as possible.
Always reply in Portuguese.
Act as an academic assistant or expert. Provide clear explanations and, when appropriate, suggest possible actions.

Before answering, carefully read and consider the entire article, section, or subsection relevant to the question.
Also analyze the immediately preceding and following sections to ensure completeness.

If the exact article number is not found but related content exists, use the most relevant parts and clearly say:
"O artigo exato não foi encontrado, mas utilizou-se conteúdo relacionado."

If conflicting information exists, explain both perspectives clearly.

Always reference the article number and document name when possible.

⚠️ If the information is not found in the provided documents, do NOT speculate.
Respond exactly as follows:
"Lamento, mas não consigo fornecer essa informação no momento. Recomendo que entre em contato diretamente com o Registo Académico ou com a entidade responsável."

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
            search_type="similarity",
            search_kwargs={"k": 12}
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
            with st.expander("📋 Fontes utilizadas para esta resposta"):
                for i, doc in enumerate(response['source_documents']):
                    preview = doc.page_content[:800] + "..." if len(doc.page_content) > 800 else doc.page_content
                    st.markdown(f"**Fonte {i+1}:**\n\n{preview}")
                    st.write("---")
        else:
            st.warning("⚠️ Nenhum documento relevante foi recuperado. Pode ser que o artigo não esteja bem indexado ou o número não corresponda ao texto.")

    except Exception as e:
        st.error(f"Erro ao processar pergunta: {str(e)}")


def main():
    load_dotenv()
    st.set_page_config(page_title="Chat with multiple PDFs", page_icon=":books:")
    st.write(css, unsafe_allow_html=True)

    if "conversation" not in st.session_state:
        st.session_state.conversation = None

    st.header("Chat with multiple PDFs :books:")
    user_question = st.text_input("Pergunte algo sobre os PDFs carregados:")

    if user_question:
        st.write(user_template.replace("{{MSG}}", user_question), unsafe_allow_html=True)
        handle_userinput(user_question)

    with st.sidebar:
        st.subheader("Seus PDFs")
        pdf_docs = st.file_uploader(
            "Carregue seus PDFs e clique em 'Processar'",
            accept_multiple_files=True,
            type=["pdf"]
        )

        if st.button("Processar"):
            if not pdf_docs:
                st.error("Por favor, envie pelo menos um arquivo PDF.")
            else:
                with st.spinner("Processando PDFs..."):
                    raw_text = get_pdf_text(pdf_docs)

                    if not raw_text.strip():
                        st.error("Não foi possível extrair texto dos PDFs. Eles podem ser imagens ou arquivos corrompidos.")
                        return

                    text_chunks = get_text_chunks(raw_text)
                    if not text_chunks:
                        st.error("Não foi possível criar os chunks de texto.")
                        return

                    vectorstore = get_vectorstore(text_chunks)
                    st.session_state.conversation = get_qa_chain(vectorstore)
                    st.success("✅ Processamento concluído! Agora pode fazer perguntas.")


if __name__ == "__main__":
    main()