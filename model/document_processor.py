"""
Processador de documentos PDF para o sistema IB - EstradaResponde.
Usa ChromaDB como banco de dados vetorial.
"""

import os
import time
import shutil
import gc
from typing import List, Optional
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
import chromadb
from chromadb.config import Settings
from config import (
    CHROMA_DB_PATH, 
    CHROMA_COLLECTION_NAME,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    EMBEDDING_MODEL,
    EMBEDDING_PROVIDER
)


class DocumentProcessor:
    """Processador de documentos PDF com ChromaDB."""
    
    def __init__(self):
        """Inicializa o processador de documentos."""
        self.embeddings = self._get_embeddings()
        # Separadores otimizados para preservar estrutura de artigos
        # Prioriza quebras de linha duplas, títulos de artigos, e depois espaços
        # REMOVIDO separador de números seguidos de maiúsculas para não quebrar no meio de artigos
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            length_function=len,
            separators=[
                r"\n\n+",  # Múltiplas quebras de linha (parágrafos)
                r"\nArtigo\s+\d+",  # Início de artigos (Artigo 1, Artigo 2, etc.)
                r"\nArt\.\s+\d+",  # Abreviação de artigo (Art. 1, Art. 2, etc.)
                r"\nCAPÍTULO\s+[IVX]+",  # Capítulos romanos
                r"\nCAPÍTULO\s+\d+",  # Capítulos numéricos
                r"\nSECÇÃO\s+[IVX]+",  # Seções romanas
                r"\nSECÇÃO\s+\d+",  # Seções numéricas
                # REMOVIDO: r"\n\d+\.\s+[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÔÃÕÇ]" - estava quebrando no meio de artigos (ex: "5. A contravenção...")
                r"\n",  # Quebra de linha simples
                ". ",  # Pontos seguidos de espaço
                " ",  # Espaços
            ],
            is_separator_regex=True,
        )
        self.vectorstore = None
        # Usar caminho absoluto normalizado para evitar conflitos de singleton
        self.chroma_db_path = os.path.abspath(CHROMA_DB_PATH)
    
    def _get_embeddings(self):
        """Obtém o modelo de embeddings configurado."""
        if EMBEDDING_PROVIDER == 'openai':
            return OpenAIEmbeddings(model=EMBEDDING_MODEL)
        else:
            # Por padrão usa OpenAI
            return OpenAIEmbeddings(model=EMBEDDING_MODEL)
    
    def _clear_chromadb_cache(self):
        """Limpa o cache do singleton do ChromaDB de forma mais agressiva."""
        try:
            from chromadb.api.client import SharedSystemClient
            if hasattr(SharedSystemClient, '_identifer_to_system'):
                # Normalizar caminho para encontrar todas as variações
                abs_path = self.chroma_db_path
                # Também verificar caminho relativo normalizado
                rel_path = os.path.normpath(CHROMA_DB_PATH)
                rel_path_abs = os.path.abspath(rel_path)
                
                keys_to_remove = []
                cache_dict = SharedSystemClient._identifer_to_system
                
                # Coletar todas as chaves que podem corresponder ao nosso caminho
                for key in list(cache_dict.keys()):
                    # Verificar todas as variações possíveis do caminho
                    key_lower = str(key).lower()
                    if (abs_path in str(key) or 
                        rel_path in str(key) or
                        rel_path_abs in str(key) or
                        CHROMA_DB_PATH in str(key) or 
                        './chroma_db' in key_lower or
                        'chroma_db' in key_lower or
                        os.path.basename(abs_path) in str(key)):
                        keys_to_remove.append(key)
                
                # Remover e parar sistemas
                for key in keys_to_remove:
                    try:
                        system = cache_dict.pop(key, None)
                        if system:
                            try:
                                system.stop()
                            except:
                                pass
                    except Exception as e:
                        print(f"Erro ao remover sistema {key}: {str(e)}")
                        pass
                
                # Forçar garbage collection
                gc.collect()
                time.sleep(0.15)  # Delay um pouco maior após limpar cache
                
                # Se ainda houver entradas, tentar limpar todas relacionadas a caminhos persistentes
                if len(cache_dict) > 0:
                    # Limpar todas as entradas que parecem ser do nosso diretório
                    remaining_keys = list(cache_dict.keys())
                    for key in remaining_keys:
                        try:
                            # Verificar se é um caminho persistente que pode ser nosso
                            if 'persist' in str(key).lower() or 'chroma' in str(key).lower():
                                system = cache_dict.pop(key, None)
                                if system:
                                    try:
                                        system.stop()
                                    except:
                                        pass
                        except:
                            pass
                    gc.collect()
        except Exception as e:
            print(f"Aviso ao limpar cache do ChromaDB: {str(e)}")
            # Tentar limpar de forma mais básica
            try:
                gc.collect()
            except:
                pass
    
    def _extract_article_info(self, chunk: str) -> dict:
        """
        Extrai informações de artigo (número, capítulo, seção) de um chunk.
        
        Args:
            chunk: Texto do chunk
            
        Returns:
            Dicionário com informações do artigo encontrado
        """
        import re
        
        article_info = {}
        
        # Procurar por "Artigo X" ou "Art. X"
        article_match = re.search(r'Artigo\s+(\d+)', chunk, re.IGNORECASE)
        if not article_match:
            article_match = re.search(r'Art\.\s+(\d+)', chunk, re.IGNORECASE)
        
        if article_match:
            article_info['article_number'] = article_match.group(1)
            article_info['has_article'] = True
        
        # Procurar por capítulos
        chapter_match = re.search(r'CAPÍTULO\s+([IVX]+|\d+)', chunk, re.IGNORECASE)
        if chapter_match:
            article_info['chapter'] = chapter_match.group(1)
        
        # Procurar por seções
        section_match = re.search(r'SECÇÃO\s+([IVX]+|\d+)', chunk, re.IGNORECASE)
        if section_match:
            article_info['section'] = section_match.group(1)
        
        # Procurar por alíneas (a), b), c), etc.)
        if re.search(r'[a-z]\)', chunk[:200], re.IGNORECASE):
            article_info['has_subitems'] = True
        
        return article_info
    
    def extract_text_from_pdf(self, pdf_path: str, pdf_name: str) -> str:
        """
        Extrai texto de um arquivo PDF.
        
        Args:
            pdf_path: Caminho do arquivo PDF
            pdf_name: Nome do arquivo PDF
            
        Returns:
            Texto extraído do PDF
        """
        text = ""
        pdf_reader = PdfReader(pdf_path)
        
        for i, page in enumerate(pdf_reader.pages):
            try:
                page_text = page.extract_text()
                if page_text and page_text.strip():
                    text += f"--- Documento: {pdf_name} | Página {i+1} ---\n{page_text}\n\n"
            except Exception as e:
                print(f"Erro ao extrair página {i+1} do documento {pdf_name}: {str(e)}")
        
        return text
    
    def process_pdfs(self, pdf_paths: List[tuple]) -> dict:
        """
        Processa múltiplos PDFs e cria o vectorstore.
        
        Args:
            pdf_paths: Lista de tuplas (caminho, nome) dos PDFs
            
        Returns:
            Dicionário com informações do processamento
        """
        from datetime import datetime
        import os
        
        # Extrair texto e criar chunks com metadados
        all_chunks = []
        all_metadatas = []
        total_pages = 0
        successful_pages = 0
        processed_files = []
        
        for pdf_path, pdf_name in pdf_paths:
            pdf_reader = PdfReader(pdf_path)
            total_pages += len(pdf_reader.pages)
            
            # Extrair texto do PDF
            pdf_text = self.extract_text_from_pdf(pdf_path, pdf_name)
            
            # Criar chunks para este documento
            doc_chunks = self.text_splitter.split_text(pdf_text)
            
            # Criar metadados para cada chunk com informações de artigos
            file_size = os.path.getsize(pdf_path)
            upload_date = datetime.now().isoformat()
            
            for chunk in doc_chunks:
                all_chunks.append(chunk)
                
                # Detectar informações de artigo no chunk
                article_info = self._extract_article_info(chunk)
                
                metadata = {
                    'source': pdf_name,
                    'file_path': pdf_path,
                    'file_size': file_size,
                    'upload_date': upload_date,
                    'document_type': 'general'
                }
                
                # Adicionar informações de artigo aos metadados
                if article_info:
                    metadata.update(article_info)
                
                all_metadatas.append(metadata)
            
            # Contar páginas bem-sucedidas
            for page in pdf_reader.pages:
                try:
                    page_text = page.extract_text()
                    if page_text and page_text.strip():
                        successful_pages += 1
                except:
                    pass
            
            processed_files.append({
                'name': pdf_name,
                'path': pdf_path,
                'size': file_size,
                'chunks': len(doc_chunks)
            })
        
        if not all_chunks:
            raise ValueError("Não foi possível extrair texto dos PDFs")
        
        # Criar ou atualizar vectorstore no ChromaDB com metadados
        self._create_or_update_vectorstore(all_chunks, all_metadatas)
        
        return {
            'total_pages': total_pages,
            'successful_pages': successful_pages,
            'total_chunks': len(all_chunks),
            'total_characters': sum(len(chunk) for chunk in all_chunks),
            'processed_files': processed_files
        }
    
    def _create_or_update_vectorstore(self, text_chunks: List[str], metadatas: Optional[List[dict]] = None):
        """
        Cria ou atualiza o vectorstore no ChromaDB.
        Adiciona novos documentos de forma acumulativa se a collection já existir.
        
        Args:
            text_chunks: Lista de chunks de texto
            metadatas: Lista opcional de metadados para cada chunk
        """
        # Limpar cache do singleton ANTES de qualquer operação
        self._clear_chromadb_cache()
        
        # Fechar vectorstore existente se houver
        if self.vectorstore:
            try:
                if hasattr(self.vectorstore, '_client'):
                    try:
                        del self.vectorstore._client
                    except:
                        pass
                del self.vectorstore
            except:
                pass
            self.vectorstore = None
        
        # Forçar garbage collection
        gc.collect()
        time.sleep(0.1)
        
        # Garantir que o diretório existe
        os.makedirs(self.chroma_db_path, exist_ok=True)
        
        # Verificar se já existe uma collection sem criar instância conflitante
        # IMPORTANTE: Limpar cache ANTES de criar qualquer cliente
        collection_exists = False
        try:
            # Limpar cache antes de verificar
            self._clear_chromadb_cache()
            
            # Usar cliente direto do ChromaDB para verificar sem criar instância do LangChain
            temp_client = chromadb.PersistentClient(
                path=self.chroma_db_path,
                settings=Settings(anonymized_telemetry=False)
            )
            try:
                # Tentar obter a collection
                temp_client.get_collection(name=CHROMA_COLLECTION_NAME)
                # Se chegou aqui, a collection existe
                collection_exists = True
            except:
                # Collection não existe
                collection_exists = False
            finally:
                # Fechar o cliente de verificação e limpar cache
                try:
                    del temp_client
                except:
                    pass
                self._clear_chromadb_cache()
                gc.collect()
                time.sleep(0.2)
        except Exception as e:
            # Se houver qualquer erro, assumir que não existe e limpar cache
            print(f"Erro ao verificar collection: {str(e)}")
            self._clear_chromadb_cache()
            collection_exists = False
        
        # Limpar cache novamente antes de criar/adicionar
        self._clear_chromadb_cache()
        time.sleep(0.3)  # Delay maior para garantir que cache foi limpo
        
        # Abordagem simplificada: trabalhar diretamente no caminho final
        # mas com limpeza agressiva do cache antes de cada operação
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                # Limpar cache antes de cada tentativa
                self._clear_chromadb_cache()
                time.sleep(0.3)
                
                if collection_exists:
                    # Adicionar novos chunks à collection existente
                    print(f"Tentativa {retry_count + 1}: Adicionando {len(text_chunks)} novos chunks à collection existente...")
                    self.vectorstore = Chroma(
                        persist_directory=self.chroma_db_path,
                        embedding_function=self.embeddings,
                        collection_name=CHROMA_COLLECTION_NAME
                    )
                    # Adicionar novos textos com metadados
                    if metadatas:
                        self.vectorstore.add_texts(texts=text_chunks, metadatas=metadatas)
                    else:
                        self.vectorstore.add_texts(texts=text_chunks)
                    print(f"Documentos adicionados com sucesso à collection existente")
                    break  # Sucesso, sair do loop
                else:
                    # Criar nova collection
                    print(f"Tentativa {retry_count + 1}: Criando nova collection com {len(text_chunks)} chunks...")
                    if metadatas:
                        self.vectorstore = Chroma.from_texts(
                            texts=text_chunks,
                            embedding=self.embeddings,
                            collection_name=CHROMA_COLLECTION_NAME,
                            persist_directory=self.chroma_db_path,
                            metadatas=metadatas
                        )
                    else:
                        self.vectorstore = Chroma.from_texts(
                            texts=text_chunks,
                            embedding=self.embeddings,
                            collection_name=CHROMA_COLLECTION_NAME,
                            persist_directory=self.chroma_db_path
                        )
                    print(f"Collection criada com sucesso")
                    break  # Sucesso, sair do loop
                    
            except Exception as e:
                error_msg = str(e).lower()
                retry_count += 1
                
                if "already exists" in error_msg or "instance" in error_msg:
                    if retry_count < max_retries:
                        print(f"Erro de instância na tentativa {retry_count}: {str(e)}")
                        print(f"Limpando cache e tentando novamente ({retry_count + 1}/{max_retries})...")
                        # Limpar cache mais agressivamente
                        self._clear_chromadb_cache()
                        # Tentar limpar também o diretório se necessário
                        if retry_count == max_retries - 1:  # Última tentativa
                            print("Última tentativa: limpando diretório completamente...")
                            if os.path.exists(self.chroma_db_path):
                                try:
                                    # Fechar qualquer vectorstore antes de limpar
                                    if self.vectorstore:
                                        try:
                                            del self.vectorstore
                                        except:
                                            pass
                                    self.vectorstore = None
                                    gc.collect()
                                    time.sleep(0.3)
                                    shutil.rmtree(self.chroma_db_path)
                                    os.makedirs(self.chroma_db_path, exist_ok=True)
                                except Exception as e_clean:
                                    print(f"Erro ao limpar diretório: {str(e_clean)}")
                        time.sleep(0.5)
                        continue
                    else:
                        # Última tentativa falhou
                        raise Exception(f"Erro ao criar/atualizar vectorstore após {max_retries} tentativas: {str(e)}")
                else:
                    # Erro não relacionado a singleton, propagar imediatamente
                    raise
    
    def get_vectorstore(self) -> Optional[Chroma]:
        """
        Obtém o vectorstore atual sem criar instâncias conflitantes.
        
        Returns:
            Instância do ChromaDB vectorstore ou None se não existir
        """
        if self.vectorstore:
            return self.vectorstore
        
        # Tentar carregar vectorstore existente
        try:
            # Limpar cache antes de tentar carregar para evitar conflitos
            self._clear_chromadb_cache()
            
            # Verificar se a collection existe antes de tentar carregar
            client = chromadb.PersistentClient(
                path=self.chroma_db_path,
                settings=Settings(anonymized_telemetry=False)
            )
            
            try:
                # Tentar obter a collection
                client.get_collection(name=CHROMA_COLLECTION_NAME)
                # Se chegou aqui, a collection existe, então podemos carregar
                # Fechar o cliente de verificação
                del client
                gc.collect()
                time.sleep(0.1)
                
                # Limpar cache novamente antes de criar instância do LangChain
                self._clear_chromadb_cache()
                
                # Carregar vectorstore
                self.vectorstore = Chroma(
                    persist_directory=self.chroma_db_path,
                    embedding_function=self.embeddings,
                    collection_name=CHROMA_COLLECTION_NAME
                )
                return self.vectorstore
            except Exception:
                # Collection não existe
                try:
                    del client
                except:
                    pass
                return None
        except Exception as e:
            print(f"Erro ao carregar vectorstore: {str(e)}")
            return None
    
    def get_documents_list(self) -> List[dict]:
        """
        Retorna lista de documentos únicos com seus metadados.
        
        Returns:
            Lista de dicionários com informações dos documentos
        """
        vectorstore = self.get_vectorstore()
        if not vectorstore:
            return []
        
        try:
            collection = vectorstore._collection
            # Obter todos os documentos
            results = collection.get()
            
            if not results or 'metadatas' not in results or not results['metadatas']:
                return []
            
            # Agrupar por documento (source)
            documents_map = {}
            for metadata in results['metadatas']:
                if metadata and 'source' in metadata:
                    source = metadata.get('source', '')
                    file_path = metadata.get('file_path', '')
                    
                    if source not in documents_map:
                        documents_map[source] = {
                            'name': source,
                            'file_path': file_path,
                            'file_size': metadata.get('file_size', 0),
                            'upload_date': metadata.get('upload_date', ''),
                            'chunk_count': 0
                        }
                    documents_map[source]['chunk_count'] += 1
            
            return list(documents_map.values())
        except Exception as e:
            print(f"Erro ao listar documentos: {str(e)}")
            return []
    
    def update_document_name(self, old_name: str, new_name: str) -> bool:
        """
        Atualiza o nome de um documento no ChromaDB.
        
        Args:
            old_name: Nome atual do documento
            new_name: Novo nome do documento
            
        Returns:
            True se atualizado com sucesso, False caso contrário
        """
        # Limpar cache antes de qualquer operação
        self._clear_chromadb_cache()
        
        vectorstore = self.get_vectorstore()
        if not vectorstore:
            print(f"[UPDATE] Erro: Vectorstore não disponível")
            return False
        
        try:
            # PRIMEIRO: Obter lista de documentos para encontrar o nome exato
            docs_list = self.get_documents_list()
            print(f"[UPDATE] Buscando documento: {repr(old_name)}")
            print(f"[UPDATE] Documentos disponíveis no ChromaDB: {[repr(d['name']) for d in docs_list]}")
            
            # Função auxiliar para normalizar nomes
            def normalize_name(name):
                if not name:
                    return ""
                normalized = name.strip()
                normalized = normalized.replace('_', ' ').replace('-', ' ')
                normalized = ' '.join(normalized.split())
                return normalized
            
            # Tentar encontrar o documento exato na lista
            exact_doc = None
            
            # Primeiro, verificar match exato byte a byte
            for doc in docs_list:
                doc_name = doc['name']
                if doc_name == old_name:
                    exact_doc = doc
                    print(f"[UPDATE] Match exato encontrado: {repr(doc_name)}")
                    break
                else:
                    # Debug: mostrar diferenças
                    if len(doc_name) == len(old_name):
                        diff_chars = []
                        for i, (c1, c2) in enumerate(zip(doc_name, old_name)):
                            if c1 != c2:
                                diff_chars.append(f"pos {i}: '{c1}'({ord(c1)}) vs '{c2}'({ord(c2)})")
                        if diff_chars:
                            print(f"[UPDATE] Diferenças encontradas: {diff_chars[:3]}")
            
            # Se não encontrou exato, tentar match normalizado
            if not exact_doc:
                old_name_normalized = normalize_name(old_name)
                print(f"[UPDATE] Tentando match normalizado: {repr(old_name_normalized)}")
                
                for doc in docs_list:
                    doc_normalized = normalize_name(doc['name'])
                    if doc_normalized == old_name_normalized:
                        exact_doc = doc
                        print(f"[UPDATE] Match normalizado encontrado: {repr(doc['name'])}")
                        break
                
                # Se ainda não encontrou, tentar case-insensitive
                if not exact_doc:
                    for doc in docs_list:
                        if normalize_name(doc['name']).lower() == old_name_normalized.lower():
                            exact_doc = doc
                            print(f"[UPDATE] Match case-insensitive encontrado: {repr(doc['name'])}")
                            break
                
                # Última tentativa: usar o primeiro documento se houver apenas um
                if not exact_doc and len(docs_list) == 1:
                    print(f"[UPDATE] Usando único documento disponível como fallback")
                    exact_doc = docs_list[0]
            
            if not exact_doc:
                print(f"[UPDATE] Documento não encontrado na lista. Nome buscado: {repr(old_name)}")
                return False
            
            # Usar o nome exato do documento encontrado
            exact_old_name = exact_doc['name']
            print(f"[UPDATE] Usando nome exato do ChromaDB: {repr(exact_old_name)}")
            print(f"[UPDATE] Novo nome será: {repr(new_name)}")
            
            collection = vectorstore._collection
            # Obter todos os IDs que pertencem a este documento
            results = collection.get()
            
            if not results or 'ids' not in results or 'metadatas' not in results:
                print(f"[UPDATE] Erro: Não foi possível obter resultados da collection")
                return False
            
            # Filtrar IDs que pertencem ao documento e atualizar metadados usando o nome exato
            ids_to_update = []
            updated_metadatas = []
            
            for i, metadata in enumerate(results['metadatas']):
                if metadata:
                    source_name = metadata.get('source', '')
                    if source_name == exact_old_name:
                        ids_to_update.append(results['ids'][i])
                        # Criar novo metadata com o nome atualizado
                        new_metadata = metadata.copy()
                        new_metadata['source'] = new_name
                        updated_metadatas.append(new_metadata)
            
            if not ids_to_update:
                print(f"[UPDATE] Erro: Nenhum chunk encontrado para o documento {repr(exact_old_name)}")
                return False
            
            print(f"[UPDATE] Atualizando {len(ids_to_update)} chunks do documento '{exact_old_name}' para '{new_name}'")
            
            # Encontrar o arquivo físico para renomear (usar o primeiro metadata encontrado)
            file_path_to_rename = None
            new_file_path = None
            if updated_metadatas and len(updated_metadatas) > 0:
                file_path_to_rename = updated_metadatas[0].get('file_path')
                print(f"[UPDATE] Arquivo físico encontrado: {file_path_to_rename}")
            
            # Renomear arquivo físico se existir
            if file_path_to_rename and os.path.exists(file_path_to_rename):
                try:
                    # Obter diretório e extensão do arquivo original
                    file_dir = os.path.dirname(file_path_to_rename)
                    file_ext = os.path.splitext(file_path_to_rename)[1]
                    
                    # Criar novo nome de arquivo com o novo nome do documento
                    # Remover caracteres inválidos do nome
                    safe_new_name = "".join(c for c in new_name if c.isalnum() or c in (' ', '-', '_', '.')).strip()
                    safe_new_name = safe_new_name.replace(' ', '_')
                    
                    # Se o arquivo original tinha um UUID no início, manter o mesmo padrão
                    original_filename = os.path.basename(file_path_to_rename)
                    if '_' in original_filename:
                        # Extrair UUID se existir
                        parts = original_filename.split('_', 1)
                        if len(parts) == 2 and len(parts[0]) == 36:  # UUID tem 36 caracteres
                            uuid_part = parts[0]
                            new_file_path = os.path.join(file_dir, f"{uuid_part}_{safe_new_name}{file_ext}")
                        else:
                            new_file_path = os.path.join(file_dir, f"{safe_new_name}{file_ext}")
                    else:
                        new_file_path = os.path.join(file_dir, f"{safe_new_name}{file_ext}")
                    
                    # Renomear arquivo físico
                    os.rename(file_path_to_rename, new_file_path)
                    print(f"Arquivo físico renomeado: '{file_path_to_rename}' -> '{new_file_path}'")
                    
                    # Atualizar file_path nos metadados
                    for i in range(len(updated_metadatas)):
                        if updated_metadatas[i].get('file_path') == file_path_to_rename:
                            updated_metadatas[i]['file_path'] = new_file_path
                except Exception as e:
                    print(f"Erro ao renomear arquivo físico: {str(e)}")
                    # Continuar mesmo se falhar ao renomear o arquivo
            
            # Atualizar metadados no ChromaDB em lotes se necessário
            # ChromaDB pode ter limitações de tamanho, então vamos atualizar em lotes
            batch_size = 100
            for i in range(0, len(ids_to_update), batch_size):
                batch_ids = ids_to_update[i:i + batch_size]
                batch_metadatas = updated_metadatas[i:i + batch_size]
                
                collection.update(
                    ids=batch_ids,
                    metadatas=batch_metadatas
                )
            
            print(f"[UPDATE] Documento '{exact_old_name}' renomeado para '{new_name}' com sucesso no ChromaDB")
            if new_file_path:
                print(f"[UPDATE] Arquivo físico também foi renomeado para: '{new_file_path}'")
            
            # Recarregar vectorstore para refletir as mudanças
            self.vectorstore = None
            self._clear_chromadb_cache()
            gc.collect()
            
            return True
        except Exception as e:
            print(f"[UPDATE] Erro ao atualizar nome do documento: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def delete_document(self, document_name: str) -> bool:
        """
        Deleta um documento específico do ChromaDB.
        
        Args:
            document_name: Nome do documento a ser deletado
            
        Returns:
            True se deletado com sucesso, False caso contrário
        """
        # Limpar cache antes de qualquer operação
        self._clear_chromadb_cache()
        
        vectorstore = self.get_vectorstore()
        if not vectorstore:
            print(f"[DELETE] Erro: Vectorstore não disponível")
            return False
        
        try:
            # PRIMEIRO: Obter lista de documentos para encontrar o nome exato
            docs_list = self.get_documents_list()
            print(f"[DELETE] Buscando documento: {repr(document_name)}")
            print(f"[DELETE] Documentos disponíveis no ChromaDB: {[repr(d['name']) for d in docs_list]}")
            
            # Função auxiliar para normalizar nomes
            def normalize_name(name):
                if not name:
                    return ""
                normalized = name.strip()
                normalized = normalized.replace('_', ' ').replace('-', ' ')
                normalized = ' '.join(normalized.split())
                return normalized
            
            # Tentar encontrar o documento exato na lista
            exact_doc = None
            
            # Primeiro, verificar match exato byte a byte
            for doc in docs_list:
                doc_name = doc['name']
                if doc_name == document_name:
                    exact_doc = doc
                    print(f"[DELETE] Match exato encontrado: {repr(doc_name)}")
                    break
                else:
                    # Debug: mostrar diferenças
                    if len(doc_name) == len(document_name):
                        diff_chars = []
                        for i, (c1, c2) in enumerate(zip(doc_name, document_name)):
                            if c1 != c2:
                                diff_chars.append(f"pos {i}: '{c1}'({ord(c1)}) vs '{c2}'({ord(c2)})")
                        if diff_chars:
                            print(f"[DELETE] Diferenças encontradas: {diff_chars[:3]}")
            
            # Se não encontrou exato, tentar match normalizado
            if not exact_doc:
                doc_name_normalized = normalize_name(document_name)
                print(f"[DELETE] Tentando match normalizado: {repr(doc_name_normalized)}")
                
                for doc in docs_list:
                    doc_normalized = normalize_name(doc['name'])
                    if doc_normalized == doc_name_normalized:
                        exact_doc = doc
                        print(f"[DELETE] Match normalizado encontrado: {repr(doc['name'])}")
                        break
                
                # Se ainda não encontrou, tentar case-insensitive
                if not exact_doc:
                    for doc in docs_list:
                        if normalize_name(doc['name']).lower() == doc_name_normalized.lower():
                            exact_doc = doc
                            print(f"[DELETE] Match case-insensitive encontrado: {repr(doc['name'])}")
                            break
                
                # Última tentativa: usar o primeiro documento se houver apenas um
                if not exact_doc and len(docs_list) == 1:
                    print(f"[DELETE] Usando único documento disponível como fallback")
                    exact_doc = docs_list[0]
            
            if not exact_doc:
                print(f"[DELETE] Documento não encontrado na lista. Nome buscado: {repr(document_name)}")
                return False
            
            # Usar o nome exato do documento encontrado
            exact_document_name = exact_doc['name']
            print(f"[DELETE] Usando nome exato do ChromaDB: {repr(exact_document_name)}")
            
            # Obter todos os IDs que pertencem a este documento
            # Usar uma nova conexão para evitar problemas de "broken pipe"
            ids_to_delete = []
            file_path = None
            
            try:
                # Criar uma nova conexão direta ao ChromaDB para obter os IDs
                client = chromadb.PersistentClient(path=self.chroma_db_path)
                collection = client.get_collection(name=CHROMA_COLLECTION_NAME)
                results = collection.get()
                
                if not results or 'ids' not in results or 'metadatas' not in results:
                    print(f"[DELETE] Erro: Não foi possível obter resultados da collection")
                    return False
                
                # Filtrar IDs que pertencem ao documento usando o nome exato
                for i, metadata in enumerate(results['metadatas']):
                    if metadata:
                        source_name = metadata.get('source', '')
                        if source_name == exact_document_name:
                            ids_to_delete.append(results['ids'][i])
                            if not file_path and 'file_path' in metadata:
                                file_path = metadata.get('file_path')
                
                # Fechar conexão
                del collection
                del client
                gc.collect()
                time.sleep(0.1)
            except Exception as e:
                print(f"[DELETE] Erro ao obter IDs: {str(e)}")
                return False
            
            if not ids_to_delete:
                print(f"[DELETE] Erro: Nenhum chunk encontrado para o documento {repr(exact_document_name)}")
                return False
            
            print(f"[DELETE] Encontrados {len(ids_to_delete)} chunks para deletar")
            
            # Deletar chunks do ChromaDB em lotes para evitar problemas de "Broken pipe"
            # ChromaDB pode ter problemas ao deletar muitos chunks de uma vez
            # Usar lotes menores e mais tentativas para maior robustez
            batch_size = 25  # Reduzido de 50 para 25
            deleted_count = 0
            total_batches = (len(ids_to_delete) + batch_size - 1) // batch_size
            
            print(f"[DELETE] Deletando {len(ids_to_delete)} chunks em {total_batches} lotes de {batch_size}")
            
            for i in range(0, len(ids_to_delete), batch_size):
                batch_ids = ids_to_delete[i:i + batch_size]
                batch_num = i // batch_size + 1
                max_retries = 3
                retry_count = 0
                batch_deleted = False
                
                while retry_count < max_retries and not batch_deleted:
                    client = None
                    collection = None
                    try:
                        # Limpar cache antes de cada tentativa
                        self._clear_chromadb_cache()
                        time.sleep(0.2)
                        
                        # Criar uma NOVA conexão para cada operação de delete
                        # Isso evita problemas de "broken pipe" com conexões persistentes
                        client = chromadb.PersistentClient(path=self.chroma_db_path)
                        collection = client.get_collection(name=CHROMA_COLLECTION_NAME)
                        
                        # Deletar o lote
                        collection.delete(ids=batch_ids)
                        deleted_count += len(batch_ids)
                        batch_deleted = True
                        print(f"[DELETE] Lote {batch_num}/{total_batches}: {deleted_count}/{len(ids_to_delete)} chunks deletados")
                        
                        # Fechar conexão explicitamente
                        del collection
                        del client
                        gc.collect()
                        time.sleep(0.1)
                        
                    except Exception as batch_error:
                        error_msg = str(batch_error).lower()
                        retry_count += 1
                        
                        # Limpar conexão em caso de erro
                        try:
                            if collection:
                                del collection
                            if client:
                                del client
                        except:
                            pass
                        gc.collect()
                        
                        if retry_count < max_retries:
                            print(f"[DELETE] Erro ao deletar lote {batch_num} (tentativa {retry_count}/{max_retries}): {str(batch_error)}")
                            
                            # Se for "broken pipe" ou erro de conexão, esperar mais tempo
                            if "broken pipe" in error_msg or "connection" in error_msg or "errno 32" in error_msg:
                                print(f"[DELETE] Erro de conexão detectado. Aguardando antes de tentar novamente...")
                                time.sleep(0.8)  # Delay maior para conexão se restabelecer
                            else:
                                # Para outros erros, esperar um pouco e tentar novamente
                                time.sleep(0.3)
                        else:
                            # Última tentativa falhou - tentar em sub-lotes menores
                            print(f"[DELETE] Falha ao deletar lote {batch_num} após {max_retries} tentativas. Tentando em sub-lotes...")
                            if len(batch_ids) > 5:
                                sub_batch_size = 5
                                sub_deleted = 0
                                for sub_i in range(0, len(batch_ids), sub_batch_size):
                                    sub_batch = batch_ids[sub_i:sub_i + sub_batch_size]
                                    sub_client = None
                                    sub_collection = None
                                    try:
                                        self._clear_chromadb_cache()
                                        time.sleep(0.3)
                                        
                                        # Nova conexão para cada sub-lote
                                        sub_client = chromadb.PersistentClient(path=self.chroma_db_path)
                                        sub_collection = sub_client.get_collection(name=CHROMA_COLLECTION_NAME)
                                        sub_collection.delete(ids=sub_batch)
                                        sub_deleted += len(sub_batch)
                                        deleted_count += len(sub_batch)
                                        
                                        # Fechar conexão
                                        del sub_collection
                                        del sub_client
                                        gc.collect()
                                    except Exception as sub_error:
                                        print(f"[DELETE] Erro ao deletar sub-lote: {str(sub_error)}")
                                        # Limpar em caso de erro
                                        try:
                                            if sub_collection:
                                                del sub_collection
                                            if sub_client:
                                                del sub_client
                                        except:
                                            pass
                                        gc.collect()
                                
                                if sub_deleted > 0:
                                    print(f"[DELETE] {sub_deleted} de {len(batch_ids)} chunks do lote {batch_num} foram deletados")
                                    batch_deleted = True
                            
                            # Se ainda não deletou, marcar como falha mas continuar
                            if not batch_deleted:
                                print(f"[DELETE] AVISO: Lote {batch_num} não pôde ser deletado completamente")
                                # Continuar com próximo lote
            
            if deleted_count == 0:
                raise Exception(f"Não foi possível deletar nenhum chunk")
            
            if deleted_count < len(ids_to_delete):
                print(f"[DELETE] AVISO: Apenas {deleted_count} de {len(ids_to_delete)} chunks foram deletados")
            else:
                print(f"[DELETE] Todos os {deleted_count} chunks deletados com sucesso")
            
            # Deletar arquivo físico se existir
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    print(f"[DELETE] Arquivo físico deletado: {file_path}")
                except Exception as e:
                    print(f"[DELETE] Erro ao deletar arquivo físico: {str(e)}")
            
            # Recarregar vectorstore
            self.vectorstore = None
            self._clear_chromadb_cache()
            gc.collect()
            
            print(f"[DELETE] Documento '{exact_document_name}' deletado com sucesso")
            return True
        except Exception as e:
            print(f"[DELETE] Erro ao deletar documento: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def clear_vectorstore(self):
        """Limpa o vectorstore."""
        try:
            # Limpar cache primeiro
            self._clear_chromadb_cache()
            
            # Fechar vectorstore existente
            if self.vectorstore:
                try:
                    if hasattr(self.vectorstore, '_client'):
                        try:
                            del self.vectorstore._client
                        except:
                            pass
                    del self.vectorstore
                except:
                    pass
                self.vectorstore = None
            
            # Deletar collection do ChromaDB
            try:
                client = chromadb.PersistentClient(
                    path=self.chroma_db_path,
                    settings=Settings(anonymized_telemetry=False)
                )
                try:
                    client.delete_collection(name=CHROMA_COLLECTION_NAME)
                except Exception:
                    # Collection não existe, tudo bem
                    pass
                finally:
                    del client
            except Exception:
                pass
            
            # Limpar cache novamente após deletar
            self._clear_chromadb_cache()
            gc.collect()
        except Exception as e:
            print(f"Erro ao limpar vectorstore: {str(e)}")

