"""
API Flask para o sistema de chatbot.
"""

import os
import uuid
from typing import Optional
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from document_processor import DocumentProcessor
from llm_providers import get_llm_provider
from config import API_HOST, API_PORT, API_DEBUG, CORS_ORIGINS, LLM_PROVIDER

app = Flask(__name__)
CORS(app, origins=CORS_ORIGINS)

# Configuração de upload
UPLOAD_FOLDER = './uploads'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Instâncias globais
document_processor = DocumentProcessor()
llm_provider = None
qa_chain = None


def find_document_by_name(doc_name: str) -> Optional[str]:
    """
    Encontra o nome exato de um documento no banco de dados fazendo lookup
    com normalização de nomes.
    
    Args:
        doc_name: Nome do documento como gerado pelo LLM (ex: "Regulamento Pedagógico 2020")
        
    Returns:
        Nome exato do arquivo se encontrado, None caso contrário
    """
    if not doc_name:
        return None
    
    # Obter lista de documentos
    documents_list = document_processor.get_documents_list()
    if not documents_list:
        return None
    
    # Função auxiliar para normalizar nomes
    def normalize_name(name: str) -> str:
        """Normaliza nome removendo espaços extras, convertendo para minúsculas, removendo .pdf"""
        if not name:
            return ""
        normalized = name.strip().lower()
        # Remover .pdf se presente
        if normalized.endswith('.pdf'):
            normalized = normalized[:-4]
        # Substituir underscores e hífens por espaços
        normalized = normalized.replace('_', ' ').replace('-', ' ')
        # Remover espaços extras
        normalized = ' '.join(normalized.split())
        return normalized
    
    # Normalizar nome fornecido
    doc_name_normalized = normalize_name(doc_name)
    
    # Tentar match exato primeiro (case-insensitive, sem .pdf)
    for doc in documents_list:
        doc_file_name = doc.get('name', '')
        if normalize_name(doc_file_name) == doc_name_normalized:
            return doc_file_name
    
    # Tentar match parcial (contém o nome normalizado)
    for doc in documents_list:
        doc_file_name = doc.get('name', '')
        doc_normalized = normalize_name(doc_file_name)
        # Verificar se o nome normalizado do documento contém o nome fornecido ou vice-versa
        if doc_name_normalized in doc_normalized or doc_normalized in doc_name_normalized:
            return doc_file_name
    
    # Se não encontrou, retornar None
    return None


def allowed_file(filename):
    """Verifica se o arquivo tem extensão permitida."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def initialize_qa_chain():
    """Inicializa a cadeia de Q&A."""
    global qa_chain, llm_provider
    
    vectorstore = document_processor.get_vectorstore()
    if not vectorstore:
        return None
    
    try:
        if not llm_provider:
            llm_provider = get_llm_provider()
        qa_chain = llm_provider.get_qa_chain(vectorstore)
        return qa_chain
    except Exception as e:
        print(f"Erro ao inicializar QA chain: {str(e)}")
        return None


@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint de health check."""
    return jsonify({
        'status': 'healthy',
        'llm_provider': LLM_PROVIDER
    })


@app.route('/api/upload', methods=['POST'])
def upload_files():
    """Endpoint para upload de arquivos PDF."""
    if 'files' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    
    files = request.files.getlist('files')
    if not files or files[0].filename == '':
        return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
    
    # Verificar documentos existentes para evitar duplicatas
    existing_documents = document_processor.get_documents_list()
    existing_names = {doc['name'] for doc in existing_documents} if existing_documents else set()
    
    uploaded_files = []
    pdf_paths = []
    duplicate_files = []
    
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            
            # Verificar se o documento já existe
            if filename in existing_names:
                duplicate_files.append(filename)
                continue
            
            file_id = str(uuid.uuid4())
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}_{filename}")
            file.save(filepath)
            
            uploaded_files.append({
                'id': file_id,
                'name': filename,
                'path': filepath
            })
            pdf_paths.append((filepath, filename))
    
    # Se houver arquivos duplicados, retornar erro
    if duplicate_files:
        if len(duplicate_files) == 1:
            error_msg = f'O documento "{duplicate_files[0]}" já foi enviado anteriormente.'
        else:
            error_msg = f'Os seguintes documentos já foram enviados: {", ".join(duplicate_files)}'
        return jsonify({'error': error_msg}), 400
    
    if not pdf_paths:
        return jsonify({'error': 'Nenhum arquivo PDF válido para processar'}), 400
    
    try:
        # Processar PDFs
        result = document_processor.process_pdfs(pdf_paths)
        
        # Inicializar QA chain
        initialize_qa_chain()
        
        return jsonify({
            'success': True,
            'message': 'PDFs processados com sucesso',
            'files': [{'id': f['id'], 'name': f['name']} for f in uploaded_files],
            'processing_info': result
        }), 200
    
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Erro ao processar PDFs: {str(e)}")
        print(f"Traceback completo:\n{error_trace}")
        return jsonify({
            'error': f'Erro ao processar PDFs: {str(e)}',
            'details': error_trace if API_DEBUG else None
        }), 500


def convert_markdown_to_html(text: str, base_url: str = None) -> str:
    """
    Converte Markdown básico para HTML.
    Remove ## e * e converte para tags HTML apropriadas.
    Também converte citações de documentos em links clicáveis.
    """
    import re
    import html
    from urllib.parse import quote
    
    if not text:
        return text
    
    # Se base_url não foi fornecida, usar padrão
    if not base_url:
        base_url = request.host_url.rstrip('/') if hasattr(request, 'host_url') else 'http://localhost:5000'
    
    # Função para criar link de documento
    def create_document_link(match):
        full_match = match.group(0)  # Texto completo da citação
        article_part = match.group(1) if match.group(1) else ""  # Parte do artigo (Artigo X, etc.)
        doc_name = match.group(2)  # Nome do documento
        
        # Criar URL do documento
        encoded_name = quote(doc_name, safe='')
        doc_url = f"{base_url}/api/documents/{encoded_name}/view"
        
        # Criar link HTML
        link_text = f"{article_part} do {doc_name}" if article_part else doc_name
        link_html = f'<a href="{doc_url}" target="_blank" rel="noopener noreferrer" class="document-link" style="color: #059669; text-decoration: underline; font-weight: 500;">{html.escape(link_text)}</a>'
        
        # Retornar a citação com o link
        if article_part:
            return f"({article_part} do {link_html})"
        else:
            return f"({link_html})"
    
    # Padrão para detectar citações: (Artigo X do [Nome do documento]) ou (do [Nome do documento])
    # Também captura variações como (Artigo X, número Y do [Nome]) ou (Artigo X, alínea Z do [Nome])
    citation_pattern = r'\(([^)]*?)\s+do\s+\[([^\]]+)\]\)'
    
    # Função para criar link na seção de FONTES
    def create_fontes_link(match):
        full_line = match.group(0)  # Linha completa
        doc_name_llm = match.group(1)  # Nome do documento como gerado pelo LLM (primeiro grupo)
        article_info = match.group(2) if len(match.groups()) > 1 else ""  # Informação do artigo (segundo grupo)
        
        if not doc_name_llm:
            return full_line  # Se não encontrou nome, retornar original
        
        # Fazer lookup do nome exato do documento no banco
        doc_name_exact = find_document_by_name(doc_name_llm.strip())
        
        # Se não encontrou, usar o nome do LLM (pode funcionar se for exato)
        if not doc_name_exact:
            doc_name_exact = doc_name_llm.strip()
        
        # Criar URL do documento usando o nome exato
        encoded_name = quote(doc_name_exact, safe='')
        doc_url = f"{base_url}/api/documents/{encoded_name}/view"
        
        # Criar link HTML (mostrar nome do LLM, mas usar nome exato na URL)
        link_html = f'<a href="{doc_url}" target="_blank" rel="noopener noreferrer" class="document-link" style="color: #059669; text-decoration: underline; font-weight: 500;">{html.escape(doc_name_llm.strip())}</a>'
        
        # Retornar a linha com o link
        # Verificar se a linha original tinha hífen no início
        has_hyphen = full_line.strip().startswith('-')
        if article_info:
            if has_hyphen:
                return f"- {link_html}, {article_info.strip()}"
            else:
                return f"{link_html}, {article_info.strip()}"
        else:
            if has_hyphen:
                return f"- {link_html}"
            else:
                return link_html
    
    # Padrão para detectar na seção FONTES: - [Nome do documento], Artigo X
    # Também captura variações como: - [Nome], Artigo X ou - Nome do documento, Artigo X
    # E também: Nome do documento, Artigo X (sem hífen e sem colchetes)
    fontes_pattern_with_brackets = r'-\s+\[([^\]]+)\],\s*(.+)$'
    fontes_pattern_without_brackets = r'-\s+([^,]+?),\s*(.+)$'
    fontes_pattern_no_hyphen = r'^\s*([^,]+?),\s*(.+)$'  # Sem hífen no início, permite espaços
    # Padrão específico para o formato do prompt: "Nome_do_documento.pdf, Artigo X"
    # Este padrão deve capturar EXATAMENTE o formato que o Claude está gerando
    fontes_pattern_prompt_format = r'^([A-Za-z0-9_\-\.\s]+?\.pdf|[A-Za-z0-9_\-\.\s]+?),\s*(.+)$'  # Captura nome com .pdf ou sem
    # Padrão mais flexível para capturar qualquer formato: Nome, Artigo ou Nome.pdf, Artigo
    fontes_pattern_flexible = r'([A-Za-z0-9_\-\.\s]+?\.pdf|[A-Za-z0-9_\-\.\s]+?),\s*(.+)$'  # Captura nome com ou sem .pdf
    # Padrão SIMPLES e DIRETO: qualquer coisa antes de vírgula seguida de espaço e "Artigo"
    fontes_pattern_simple = r'^([^,]+?),\s*(.+)$'  # Qualquer coisa antes da vírgula, depois vírgula + espaço + resto
    
    # Substituir citações por links ANTES de processar o resto do HTML
    text = re.sub(citation_pattern, create_document_link, text)
    
    # PROCESSAR SEÇÃO FONTES ANTES de converter para HTML (para evitar escape)
    # Dividir em linhas para processar a seção FONTES separadamente
    lines = text.split('\n')
    processed_lines_fontes_pre = []
    in_fontes_section_pre = False
    
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        
        # Detectar início da seção FONTES (pode ter --- antes ou não)
        if re.match(r'^FONTES?:?\s*$', line_stripped, re.IGNORECASE):
            in_fontes_section_pre = True
            processed_lines_fontes_pre.append(line)
            continue
        
        # Se a linha anterior era --- e esta é FONTES
        if i > 0 and re.match(r'^-{3,}\s*$', lines[i-1].strip()) and re.match(r'^FONTES?:?\s*$', line_stripped, re.IGNORECASE):
            in_fontes_section_pre = True
            processed_lines_fontes_pre.append(line)
            continue
        
        # Se a linha contém "FONTES:" ou "REFERÊNCIAS:" (pode estar em qualquer lugar da linha)
        if re.search(r'FONTES?:?\s*$', line_stripped, re.IGNORECASE) or re.search(r'REFERÊNCIAS?:?\s*$', line_stripped, re.IGNORECASE):
            in_fontes_section_pre = True
            processed_lines_fontes_pre.append(line)
            continue
        
        # Se estamos na seção FONTES, processar links ANTES de converter para HTML
        if in_fontes_section_pre:
            if not line_stripped:  # Linha vazia
                processed_lines_fontes_pre.append(line)
                continue
            elif line_stripped.startswith('---'):  # Separador
                processed_lines_fontes_pre.append(line)
                continue
            else:
                # Remover hífen inicial se existir
                line_to_process = line_stripped.lstrip('-').strip()
                has_hyphen = line_stripped.startswith('-')
                
                # Processar linha da seção FONTES - tentar múltiplos padrões
                line_processed = None
                
                # Tentar padrões regex primeiro
                # Primeiro tentar o padrão SIMPLES (mais permissivo): qualquer coisa antes de vírgula
                line_processed = re.sub(fontes_pattern_simple, create_fontes_link, line_to_process)
                if line_processed == line_to_process:
                    # Depois tentar o formato específico do prompt: "Nome_do_documento.pdf, Artigo X"
                    line_processed = re.sub(fontes_pattern_prompt_format, create_fontes_link, line_to_process)
                if line_processed == line_to_process:
                    line_processed = re.sub(fontes_pattern_with_brackets, create_fontes_link, line_to_process)
                if line_processed == line_to_process:
                    line_processed = re.sub(fontes_pattern_without_brackets, create_fontes_link, line_to_process)
                if line_processed == line_to_process:
                    line_processed = re.sub(fontes_pattern_no_hyphen, create_fontes_link, line_to_process)
                if line_processed == line_to_process:
                    line_processed = re.sub(fontes_pattern_flexible, create_fontes_link, line_to_process)
                
                # Se regex funcionou, garantir que está em <p>
                if line_processed != line_to_process and '<a href=' in line_processed and not line_processed.startswith('<p>'):
                    line_processed = f'<p>{line_processed}</p>'
                
                # Se nenhum padrão regex funcionou, usar fallback: dividir por vírgula
                # Este é o formato esperado: "Nome_do_documento.pdf, Artigo X"
                if line_processed == line_to_process and ',' in line_to_process:
                    parts = line_to_process.split(',', 1)
                    if len(parts) == 2:
                        doc_name_llm = parts[0].strip()
                        article_info = parts[1].strip()
                        if doc_name_llm:
                            # Remover colchetes se existirem
                            doc_name_llm = doc_name_llm.strip('[]')
                            # Remover espaços extras
                            doc_name_llm = ' '.join(doc_name_llm.split())
                            doc_name_exact = find_document_by_name(doc_name_llm)
                            if not doc_name_exact:
                                doc_name_exact = doc_name_llm
                            encoded_name = quote(doc_name_exact, safe='')
                            doc_url = f"{base_url}/api/documents/{encoded_name}/view"
                            link_html = f'<a href="{doc_url}" target="_blank" rel="noopener noreferrer" class="document-link" style="color: #059669; text-decoration: underline; font-weight: 500;">{html.escape(doc_name_llm)}</a>'
                            line_processed = f"{link_html}, {article_info}"
                            # Envolver em <p> para preservar o HTML
                            line_processed = f'<p>{line_processed}</p>'
                
                # Se ainda não processou, tentar padrão muito permissivo: qualquer texto antes de "Artigo" ou "Art."
                if line_processed == line_to_process:
                    # Procurar por "Artigo" ou "Art." na linha
                    artigo_match = re.search(r'(Artigo|Art\.)\s+', line_to_process, re.IGNORECASE)
                    if artigo_match:
                        # Tudo antes de "Artigo" é o nome do documento
                        doc_name_llm = line_to_process[:artigo_match.start()].strip().rstrip(',').strip()
                        article_info = line_to_process[artigo_match.start():].strip()
                        if doc_name_llm:
                            doc_name_llm = doc_name_llm.strip('[]')
                            doc_name_exact = find_document_by_name(doc_name_llm)
                            if not doc_name_exact:
                                doc_name_exact = doc_name_llm
                            encoded_name = quote(doc_name_exact, safe='')
                            doc_url = f"{base_url}/api/documents/{encoded_name}/view"
                            link_html = f'<a href="{doc_url}" target="_blank" rel="noopener noreferrer" class="document-link" style="color: #059669; text-decoration: underline; font-weight: 500;">{html.escape(doc_name_llm)}</a>'
                            line_processed = f"{link_html}, {article_info}"
                            # Envolver em <p> para preservar o HTML
                            line_processed = f'<p>{line_processed}</p>'
                
                # Adicionar hífen de volta se existia (mas não se já está em <p>)
                if has_hyphen and line_processed != line_to_process and not line_processed.startswith('<p>'):
                    line_processed = f"- {line_processed}"
                elif has_hyphen and not line_processed.startswith('<p>'):
                    line_processed = line_stripped
                
                # Se foi processado, usar o resultado; senão, tentar fallback direto
                if line_processed != line_stripped and line_processed != line_to_process:
                    # Se o resultado contém HTML (link), envolver em <p> para preservar
                    if '<a href=' in line_processed and not line_processed.startswith('<p>'):
                        processed_lines_fontes_pre.append(f'<p>{line_processed}</p>')
                    else:
                        processed_lines_fontes_pre.append(line_processed)
                else:
                    # FALLBACK GARANTIDO: Se não processou com regex, dividir por vírgula
                    # Este é o formato exato: "Nome_do_documento.pdf, Artigo X"
                    if ',' in line_to_process:
                        parts = line_to_process.split(',', 1)
                        if len(parts) == 2:
                            doc_name_llm = parts[0].strip().strip('[]')
                            article_info = parts[1].strip()
                            if doc_name_llm:
                                doc_name_llm = ' '.join(doc_name_llm.split())
                                doc_name_exact = find_document_by_name(doc_name_llm)
                                if not doc_name_exact:
                                    doc_name_exact = doc_name_llm
                                encoded_name = quote(doc_name_exact, safe='')
                                doc_url = f"{base_url}/api/documents/{encoded_name}/view"
                                link_html = f'<a href="{doc_url}" target="_blank" rel="noopener noreferrer" class="document-link" style="color: #059669; text-decoration: underline; font-weight: 500;">{html.escape(doc_name_llm)}</a>'
                                line_processed = f"{link_html}, {article_info}"
                                # SEMPRE envolver em <p> para preservar o HTML (ignorar hífen se existir)
                                processed_lines_fontes_pre.append(f'<p>{line_processed}</p>')
                            else:
                                processed_lines_fontes_pre.append(line)
                        else:
                            processed_lines_fontes_pre.append(line)
                    else:
                        processed_lines_fontes_pre.append(line)
        else:
            processed_lines_fontes_pre.append(line)
    
    text = '\n'.join(processed_lines_fontes_pre)
    
    # Primeiro, processar títulos e listas (que começam no início da linha)
    # Converter ## Título para <h2>Título</h2>
    def replace_h2(match):
        title = html.escape(match.group(1))
        return f'<h2>{title}</h2>'
    text = re.sub(r'^##\s+(.+)$', replace_h2, text, flags=re.MULTILINE)
    
    # Converter ### Subtítulo para <h3>Subtítulo</h3>
    def replace_h3(match):
        subtitle = html.escape(match.group(1))
        return f'<h3>{subtitle}</h3>'
    text = re.sub(r'^###\s+(.+)$', replace_h3, text, flags=re.MULTILINE)
    
    # Converter linhas que começam com * (mas não **) para lista
    def replace_star_list_item(match):
        content = match.group(1)
        # Processar **texto** antes de escapar
        content = re.sub(r'\*\*([^*]+?)\*\*', r'<STRONG>\1</STRONG>', content)
        # Escapar o conteúdo
        content = html.escape(content)
        # Restaurar tags <strong>
        content = content.replace('&lt;STRONG&gt;', '<strong>')
        content = content.replace('&lt;/STRONG&gt;', '</strong>')
        return f'<li>{content}</li>'
    text = re.sub(r'^\*\s+(.+)$', replace_star_list_item, text, flags=re.MULTILINE)
    
    # Converter linhas que começam com - para lista (mas não --- que é separador)
    # MAS NÃO processar linhas que já têm links (seção FONTES já processada)
    def replace_list_item(match):
        content = match.group(1)
        # Se já contém tag <a>, não processar (já foi processado na seção FONTES)
        # Apenas envolver em <li> sem escapar
        if '<a href=' in content:
            return f'<li>{content}</li>'
        # Processar **texto** antes de escapar
        content = re.sub(r'\*\*([^*]+?)\*\*', r'<STRONG>\1</STRONG>', content)
        # Escapar o conteúdo, mas preservar tags HTML existentes (como links)
        # Dividir por tags HTML e escapar apenas o texto
        parts = re.split(r'(<a[^>]*>.*?</a>)', content)
        processed_parts = []
        for part in parts:
            if part.startswith('<a'):
                # É um link, manter como está
                processed_parts.append(part)
            else:
                # Escapar HTML e restaurar <strong>
                escaped = html.escape(part)
                escaped = escaped.replace('&lt;STRONG&gt;', '<strong>')
                escaped = escaped.replace('&lt;/STRONG&gt;', '</strong>')
                processed_parts.append(escaped)
        return f'<li>{"".join(processed_parts)}</li>'
    text = re.sub(r'^-\s+(.+)$', replace_list_item, text, flags=re.MULTILINE)
    
    # Envolver grupos consecutivos de <li> com <ul>
    # Primeiro, vamos processar grupos de <li> que estão na mesma "área"
    # Mas preservar linhas que já têm links (seção FONTES)
    lines = text.split('\n')
    processed_lines = []
    current_list_items = []
    in_fontes_list = False
    
    for line in lines:
        line_stripped = line.strip()
        
        # Se é um título FONTES, marcar que estamos em lista de fontes
        if '<h3>FONTES:</h3>' in line_stripped:
            in_fontes_list = True
            # Se havia itens de lista acumulados, envolver com <ul>
            if current_list_items:
                processed_lines.append('<ul>')
                processed_lines.extend(current_list_items)
                processed_lines.append('</ul>')
                current_list_items = []
            processed_lines.append(line)
            continue
        
        # Se é um <li> e estamos na seção FONTES, adicionar à lista
        if in_fontes_list and line_stripped.startswith('<li>'):
            current_list_items.append(line_stripped)
        elif in_fontes_list and not line_stripped.startswith('<li>') and line_stripped:
            # Sair da seção FONTES
            in_fontes_list = False
            # Envolver itens de FONTES com <ul>
            if current_list_items:
                processed_lines.append('<ul>')
                processed_lines.extend(current_list_items)
                processed_lines.append('</ul>')
                current_list_items = []
            processed_lines.append(line)
        elif line_stripped.startswith('<li>'):
            current_list_items.append(line_stripped)
        else:
            # Se havia itens de lista acumulados, envolver com <ul>
            if current_list_items:
                processed_lines.append('<ul>')
                processed_lines.extend(current_list_items)
                processed_lines.append('</ul>')
                current_list_items = []
            processed_lines.append(line)
    
    # Se ainda há itens de lista no final
    if current_list_items:
        processed_lines.append('<ul>')
        processed_lines.extend(current_list_items)
        processed_lines.append('</ul>')
    
    text = '\n'.join(processed_lines)
    
    # Converter título FONTES para <h3> se ainda não foi convertido
    text = re.sub(r'^FONTES?:?\s*$', '<h3>FONTES:</h3>', text, flags=re.MULTILINE | re.IGNORECASE)
    
    # Converter **texto** para <strong>texto</strong> (fazer antes de escapar)
    text = re.sub(r'\*\*([^*]+?)\*\*', r'<STRONG>\1</STRONG>', text)
    
    # Converter *texto* (não negrito, não lista) para <strong>texto</strong>
    # Apenas se não for no início da linha (já processamos listas)
    text = re.sub(r'(?<!^)\*([^*\n\s]+?)\*(?!\s|$)', r'<STRONG>\1</STRONG>', text, flags=re.MULTILINE)
    
    # PROCESSAR SEÇÃO FONTES NOVAMENTE (caso tenha sido convertida para <p>)
    # Verificar se há linhas na seção FONTES que ainda não foram processadas
    # Esta é uma passada FINAL e AGRESSIVA para garantir que TODAS as linhas sejam processadas
    lines = text.split('\n')
    processed_lines_fontes_final = []
    in_fontes_section_final = False
    
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        original_line = line
        
        # Detectar início da seção FONTES (múltiplas formas)
        if '<h3>FONTES:</h3>' in line_stripped or '<h3>FONTES:</h3>' in line:
            in_fontes_section_final = True
            processed_lines_fontes_final.append(line)
            continue
        if re.match(r'^FONTES?:?\s*$', line_stripped, re.IGNORECASE):
            in_fontes_section_final = True
            processed_lines_fontes_final.append('<h3>FONTES:</h3>')
            continue
        if re.search(r'FONTES?:?\s*$', line_stripped, re.IGNORECASE) or re.search(r'REFERÊNCIAS?:?\s*$', line_stripped, re.IGNORECASE):
            in_fontes_section_final = True
            if '<h3>' not in line_stripped:
                processed_lines_fontes_final.append('<h3>FONTES:</h3>')
            else:
                processed_lines_fontes_final.append(line)
            continue
        
        # Se estamos na seção FONTES, processar TODAS as linhas que ainda não têm links
        if in_fontes_section_final:
            # Se já tem link, manter como está
            if '<a href=' in line_stripped:
                processed_lines_fontes_final.append(line)
                continue
            
            # Processar linhas dentro de <p>
            if line_stripped.startswith('<p>') and '</p>' in line_stripped:
                # Extrair conteúdo do <p>
                content_match = re.match(r'<p>(.*?)</p>', line_stripped, re.DOTALL)
                if content_match:
                    content = content_match.group(1)
                    # Desescapar HTML se necessário (pode ter sido escapado antes)
                    try:
                        content_unescaped = html.unescape(content)
                    except:
                        content_unescaped = content
                    
                    # Tentar processar com múltiplos padrões
                    line_processed = None
                    for content_to_try in [content, content_unescaped]:
                        # Tentar padrões regex - primeiro o formato específico do prompt
                        line_processed = re.sub(fontes_pattern_prompt_format, create_fontes_link, content_to_try)
                        if line_processed != content_to_try:
                            break
                        line_processed = re.sub(fontes_pattern_no_hyphen, create_fontes_link, content_to_try)
                        if line_processed != content_to_try:
                            break
                        line_processed = re.sub(fontes_pattern_flexible, create_fontes_link, content_to_try)
                        if line_processed != content_to_try:
                            break
                        
                        # Fallback: dividir por vírgula (formato esperado: "Nome_do_documento.pdf, Artigo X")
                        if ',' in content_to_try:
                            parts = content_to_try.split(',', 1)
                            if len(parts) == 2:
                                doc_name_llm = parts[0].strip()
                                article_info = parts[1].strip()
                                if doc_name_llm:
                                    # Remover colchetes se existirem
                                    doc_name_llm = doc_name_llm.strip('[]')
                                    # Remover espaços extras
                                    doc_name_llm = ' '.join(doc_name_llm.split())
                                    doc_name_exact = find_document_by_name(doc_name_llm)
                                    if not doc_name_exact:
                                        doc_name_exact = doc_name_llm
                                    encoded_name = quote(doc_name_exact, safe='')
                                    doc_url = f"{base_url}/api/documents/{encoded_name}/view"
                                    link_html = f'<a href="{doc_url}" target="_blank" rel="noopener noreferrer" class="document-link" style="color: #059669; text-decoration: underline; font-weight: 500;">{html.escape(doc_name_llm)}</a>'
                                    line_processed = f"{link_html}, {article_info}"
                                    break
                        
                        # Fallback alternativo: procurar por "Artigo"
                        artigo_match = re.search(r'(Artigo|Art\.)\s+', content_to_try, re.IGNORECASE)
                        if artigo_match:
                            doc_name_llm = content_to_try[:artigo_match.start()].strip().rstrip(',').strip()
                            article_info = content_to_try[artigo_match.start():].strip()
                            if doc_name_llm:
                                doc_name_llm = doc_name_llm.strip('[]')
                                doc_name_exact = find_document_by_name(doc_name_llm)
                                if not doc_name_exact:
                                    doc_name_exact = doc_name_llm
                                encoded_name = quote(doc_name_exact, safe='')
                                doc_url = f"{base_url}/api/documents/{encoded_name}/view"
                                link_html = f'<a href="{doc_url}" target="_blank" rel="noopener noreferrer" class="document-link" style="color: #059669; text-decoration: underline; font-weight: 500;">{html.escape(doc_name_llm)}</a>'
                                line_processed = f"{link_html}, {article_info}"
                                break
                    
                    if line_processed and line_processed != content and line_processed != content_unescaped:
                        processed_lines_fontes_final.append(f'<p>{line_processed}</p>')
                    else:
                        processed_lines_fontes_final.append(line)
                else:
                    processed_lines_fontes_final.append(line)
            elif not line_stripped or line_stripped == '</ul>' or line_stripped.startswith('<ul'):
                processed_lines_fontes_final.append(line)
            elif '<a href=' in line_stripped:
                # Já tem link, manter como está
                processed_lines_fontes_final.append(line)
            # Processar linhas de texto simples que ainda não foram convertidas para <p>
            elif line_stripped and not line_stripped.startswith('<p>') and not line_stripped.startswith('<') and not line_stripped.startswith('</'):
                # Linha de texto simples na seção FONTES - FORÇAR processamento
                line_to_process = line_stripped.lstrip('-').strip()
                has_hyphen = line_stripped.startswith('-')
                
                # SEMPRE tentar processar se tem vírgula ou "Artigo"
                should_process = ',' in line_to_process or re.search(r'(Artigo|Art\.)', line_to_process, re.IGNORECASE)
                
                if should_process:
                    line_processed = None
                    
                    # Tentar padrões regex primeiro
                    line_processed = re.sub(fontes_pattern_prompt_format, create_fontes_link, line_to_process)
                    if line_processed == line_to_process:
                        line_processed = re.sub(fontes_pattern_no_hyphen, create_fontes_link, line_to_process)
                    if line_processed == line_to_process:
                        line_processed = re.sub(fontes_pattern_flexible, create_fontes_link, line_to_process)
                    
                    # FALLBACK GARANTIDO: dividir por vírgula
                    if line_processed == line_to_process and ',' in line_to_process:
                        parts = line_to_process.split(',', 1)
                        if len(parts) == 2:
                            doc_name_llm = parts[0].strip().strip('[]')
                            article_info = parts[1].strip()
                            if doc_name_llm:
                                doc_name_llm = ' '.join(doc_name_llm.split())  # Remover espaços extras
                                doc_name_exact = find_document_by_name(doc_name_llm)
                                if not doc_name_exact:
                                    doc_name_exact = doc_name_llm
                                encoded_name = quote(doc_name_exact, safe='')
                                doc_url = f"{base_url}/api/documents/{encoded_name}/view"
                                link_html = f'<a href="{doc_url}" target="_blank" rel="noopener noreferrer" class="document-link" style="color: #059669; text-decoration: underline; font-weight: 500;">{html.escape(doc_name_llm)}</a>'
                                line_processed = f"{link_html}, {article_info}"
                    
                    # Se ainda não processou, procurar por "Artigo"
                    if line_processed == line_to_process:
                        artigo_match = re.search(r'(Artigo|Art\.)\s+', line_to_process, re.IGNORECASE)
                        if artigo_match:
                            doc_name_llm = line_to_process[:artigo_match.start()].strip().rstrip(',').strip()
                            article_info = line_to_process[artigo_match.start():].strip()
                            if doc_name_llm:
                                doc_name_llm = doc_name_llm.strip('[]')
                                doc_name_llm = ' '.join(doc_name_llm.split())
                                doc_name_exact = find_document_by_name(doc_name_llm)
                                if not doc_name_exact:
                                    doc_name_exact = doc_name_llm
                                encoded_name = quote(doc_name_exact, safe='')
                                doc_url = f"{base_url}/api/documents/{encoded_name}/view"
                                link_html = f'<a href="{doc_url}" target="_blank" rel="noopener noreferrer" class="document-link" style="color: #059669; text-decoration: underline; font-weight: 500;">{html.escape(doc_name_llm)}</a>'
                                line_processed = f"{link_html}, {article_info}"
                    
                    # Se processou, adicionar como <p> com link
                    if line_processed and line_processed != line_to_process:
                        if has_hyphen:
                            line_processed = f"- {line_processed}"
                        processed_lines_fontes_final.append(f'<p>{line_processed}</p>')
                    else:
                        # Se não processou mas tem vírgula, forçar criação de link
                        if ',' in line_to_process:
                            parts = line_to_process.split(',', 1)
                            if len(parts) == 2:
                                doc_name_llm = parts[0].strip()
                                article_info = parts[1].strip()
                                if doc_name_llm:
                                    doc_name_llm = ' '.join(doc_name_llm.split())
                                    doc_name_exact = find_document_by_name(doc_name_llm)
                                    if not doc_name_exact:
                                        doc_name_exact = doc_name_llm
                                    encoded_name = quote(doc_name_exact, safe='')
                                    doc_url = f"{base_url}/api/documents/{encoded_name}/view"
                                    link_html = f'<a href="{doc_url}" target="_blank" rel="noopener noreferrer" class="document-link" style="color: #059669; text-decoration: underline; font-weight: 500;">{html.escape(doc_name_llm)}</a>'
                                    line_processed = f"{link_html}, {article_info}"
                                    if has_hyphen:
                                        line_processed = f"- {line_processed}"
                                    processed_lines_fontes_final.append(f'<p>{line_processed}</p>')
                                else:
                                    processed_lines_fontes_final.append(f'<p>{line_stripped}</p>')
                            else:
                                processed_lines_fontes_final.append(f'<p>{line_stripped}</p>')
                        else:
                            # Envolver em <p> mesmo sem processar
                            processed_lines_fontes_final.append(f'<p>{line_stripped}</p>')
                else:
                    # Linha sem vírgula nem "Artigo" - pode ser separador ou título
                    if not line_stripped or line_stripped.startswith('---'):
                        processed_lines_fontes_final.append(line)
                    else:
                        # Envolver em <p> mesmo sem processar
                        processed_lines_fontes_final.append(f'<p>{line_stripped}</p>')
            else:
                # Se não é <p> nem vazio, pode ser que saiu da seção FONTES
                if line_stripped and not line_stripped.startswith('<') and not line_stripped.startswith('</'):
                    # Verificar se ainda está na seção FONTES (pode ser uma linha de texto sem formatação)
                    if ',' in line_stripped or re.search(r'(Artigo|Art\.)', line_stripped, re.IGNORECASE):
                        # Ainda parece ser uma linha de FONTES, processar
                        line_to_process = line_stripped.lstrip('-').strip()
                        has_hyphen = line_stripped.startswith('-')
                        if ',' in line_to_process:
                            parts = line_to_process.split(',', 1)
                            if len(parts) == 2:
                                doc_name_llm = parts[0].strip().strip('[]')
                                article_info = parts[1].strip()
                                if doc_name_llm:
                                    doc_name_exact = find_document_by_name(doc_name_llm)
                                    if not doc_name_exact:
                                        doc_name_exact = doc_name_llm
                                    encoded_name = quote(doc_name_exact, safe='')
                                    doc_url = f"{base_url}/api/documents/{encoded_name}/view"
                                    link_html = f'<a href="{doc_url}" target="_blank" rel="noopener noreferrer" class="document-link" style="color: #059669; text-decoration: underline; font-weight: 500;">{html.escape(doc_name_llm)}</a>'
                                    line_processed = f"{link_html}, {article_info}"
                                    if has_hyphen:
                                        line_processed = f"- {line_processed}"
                                    processed_lines_fontes_final.append(f'<p>{line_processed}</p>')
                                else:
                                    processed_lines_fontes_final.append(line)
                            else:
                                processed_lines_fontes_final.append(line)
                        else:
                            processed_lines_fontes_final.append(line)
                    else:
                        # Sair da seção FONTES
                        in_fontes_section_final = False
                        processed_lines_fontes_final.append(line)
                else:
                    processed_lines_fontes_final.append(line)
        else:
            processed_lines_fontes_final.append(line)
    
    text = '\n'.join(processed_lines_fontes_final)
    
    # Dividir em linhas para processar parágrafos
    lines = text.split('\n')
    result_lines = []
    
    for line in lines:
        original_line = line
        line_stripped = line.strip()
        
        # Se já é uma tag HTML (h2, h3, ul, li, hr), adicionar diretamente
        if (line_stripped.startswith('<h') or line_stripped.startswith('<ul') or line_stripped.startswith('<li') or 
            line_stripped.startswith('</ul') or line_stripped.startswith('<hr') or line_stripped.startswith('</hr')):
            result_lines.append(line_stripped)
            continue
        
        # Se linha vazia, pular
        if not line_stripped:
            continue
        
        # Se a linha é apenas --- ou --- com espaços, converter para <hr>
        if re.match(r'^-{3,}\s*$', line_stripped):
            result_lines.append('<hr>')
            continue
        
        # CRÍTICO: Se a linha já é um parágrafo completo com link (vem da seção FONTES), 
        # adicionar diretamente SEM PROCESSAR - NÃO ESCAPAR
        if line_stripped.startswith('<p>') and '</p>' in line_stripped and '<a href=' in line_stripped:
            result_lines.append(line_stripped)
            continue
        
        # Se a linha já contém tags <a> (links de documentos), não escapar o HTML
        if '<a href=' in line_stripped or line_stripped.startswith('<a'):
            # Apenas escapar partes que não são links
            # Dividir por tags <a> e processar separadamente
            parts = re.split(r'(<a[^>]*>.*?</a>)', line_stripped)
            processed_parts = []
            for part in parts:
                if part.startswith('<a'):
                    # É um link, manter como está
                    processed_parts.append(part)
                else:
                    # Escapar HTML e restaurar <strong>
                    escaped = html.escape(part)
                    escaped = escaped.replace('&lt;STRONG&gt;', '<strong>')
                    escaped = escaped.replace('&lt;/STRONG&gt;', '</strong>')
                    processed_parts.append(escaped)
            result_lines.append(f'<p>{"".join(processed_parts)}</p>')
        else:
            # Escapar HTML no conteúdo
            line_escaped = html.escape(line_stripped)
            
            # Restaurar tags <strong> que foram escapadas
            line_escaped = line_escaped.replace('&lt;STRONG&gt;', '<strong>')
            line_escaped = line_escaped.replace('&lt;/STRONG&gt;', '</strong>')
            
            # Adicionar como parágrafo
            result_lines.append(f'<p>{line_escaped}</p>')
    
    # Juntar todas as linhas
    result = '\n'.join(result_lines)
    
    # PROCESSAMENTO FINAL AGRESSIVO DA SEÇÃO FONTES
    # Processar TODAS as linhas <p> na seção FONTES que ainda não têm links
    lines_final = result.split('\n')
    processed_lines_final_fontes = []
    in_fontes_final = False
    
    for line in lines_final:
        line_stripped = line.strip()
        
        # Detectar seção FONTES - múltiplas formas
        if '<h3>FONTES:</h3>' in line_stripped or '<h3>FONTES:</h3>' in line:
            in_fontes_final = True
            processed_lines_final_fontes.append(line)
            continue
        
        # Detectar seção FONTES por texto "FONTES:" ou "FONTES" (pode estar em <strong> ou <p>)
        if re.search(r'FONTES?:?\s*', line_stripped, re.IGNORECASE):
            in_fontes_final = True
            processed_lines_final_fontes.append(line)
            continue
        
        if in_fontes_final:
            # Se já tem link em <p>, manter SEM PROCESSAR
            if '<a href=' in line_stripped and line_stripped.startswith('<p>') and '</p>' in line_stripped:
                processed_lines_final_fontes.append(line)
                continue
            
            # Processar linhas <p> que não têm links
            if line_stripped.startswith('<p>') and '</p>' in line_stripped and '<a href=' not in line_stripped:
                print(f"DEBUG: Processando linha FONTES: {line_stripped[:100]}")
                content_match = re.match(r'<p>(.*?)</p>', line_stripped, re.DOTALL)
                if content_match:
                    content = content_match.group(1)
                    # Desescapar HTML
                    try:
                        content_unescaped = html.unescape(content)
                    except:
                        content_unescaped = content
                    
                    # Remover tags HTML que possam estar no conteúdo (como <strong>)
                    content_clean = re.sub(r'<[^>]+>', '', content_unescaped)
                    content_clean = content_clean.strip()
                    
                    # Se a linha contém apenas o nome do arquivo sem vírgula e artigo, pular (formato incorreto)
                    # O formato correto deve ter vírgula: "Nome_arquivo.pdf, Artigo X"
                    if not ',' in content_clean:
                        print(f"DEBUG: Linha FONTES sem vírgula (formato incorreto): {content_clean}")
                        # Não processar - deixar como está ou remover
                        processed_lines_final_fontes.append(line)
                        continue
                    
                    # FORÇAR processamento: dividir por vírgula se tiver
                    # Este é o formato esperado: "Nome_do_documento.pdf, Artigo X"
                    if ',' in content_clean and not '<a href=' in content_clean:
                        parts = content_clean.split(',', 1)
                        if len(parts) == 2:
                            doc_name_llm = parts[0].strip().strip('[]')
                            article_info = parts[1].strip()
                            if doc_name_llm:
                                # Remover espaços extras
                                doc_name_llm = ' '.join(doc_name_llm.split())
                                doc_name_exact = find_document_by_name(doc_name_llm)
                                if not doc_name_exact:
                                    doc_name_exact = doc_name_llm
                                encoded_name = quote(doc_name_exact, safe='')
                                doc_url = f"{base_url}/api/documents/{encoded_name}/view"
                                link_html = f'<a href="{doc_url}" target="_blank" rel="noopener noreferrer" class="document-link" style="color: #059669; text-decoration: underline; font-weight: 500;">{html.escape(doc_name_llm)}</a>'
                                processed_lines_final_fontes.append(f'<p>{link_html}, {article_info}</p>')
                                print(f"DEBUG: Link criado para '{doc_name_llm}' -> '{doc_name_exact}'")
                            else:
                                processed_lines_final_fontes.append(line)
                        else:
                            processed_lines_final_fontes.append(line)
                    elif '<a href=' in content_clean:
                        # Já tem link, manter
                        processed_lines_final_fontes.append(line)
                    else:
                        # Tentar processar mesmo sem vírgula (pode ser formato diferente)
                        processed_lines_final_fontes.append(line)
                else:
                    processed_lines_final_fontes.append(line)
            else:
                # Se não é <p>, verificar se é uma linha de texto simples na seção FONTES
                if line_stripped and not line_stripped.startswith('<') and ',' in line_stripped:
                    # Tentar processar linha de texto simples
                    parts = line_stripped.split(',', 1)
                    if len(parts) == 2:
                        doc_name_llm = parts[0].strip().strip('[]')
                        article_info = parts[1].strip()
                        if doc_name_llm:
                            doc_name_llm = ' '.join(doc_name_llm.split())
                            doc_name_exact = find_document_by_name(doc_name_llm)
                            if not doc_name_exact:
                                doc_name_exact = doc_name_llm
                            encoded_name = quote(doc_name_exact, safe='')
                            doc_url = f"{base_url}/api/documents/{encoded_name}/view"
                            link_html = f'<a href="{doc_url}" target="_blank" rel="noopener noreferrer" class="document-link" style="color: #059669; text-decoration: underline; font-weight: 500;">{html.escape(doc_name_llm)}</a>'
                            processed_lines_final_fontes.append(f'<p>{link_html}, {article_info}</p>')
                            print(f"DEBUG: Link criado (linha simples) para '{doc_name_llm}' -> '{doc_name_exact}'")
                        else:
                            processed_lines_final_fontes.append(line)
                    else:
                        processed_lines_final_fontes.append(line)
                else:
                    processed_lines_final_fontes.append(line)
        else:
            processed_lines_final_fontes.append(line)
    
    result = '\n'.join(processed_lines_final_fontes)
    
    # Limpar parágrafos vazios e espaços extras
    result = re.sub(r'<p>\s*</p>', '', result)
    result = re.sub(r'\n\s*\n', '\n', result)
    
    return result


@app.route('/api/chat', methods=['POST'])
def chat():
    """Endpoint para fazer perguntas ao chatbot."""
    data = request.get_json()
    
    if not data or 'question' not in data:
        return jsonify({'error': 'Pergunta não fornecida'}), 400
    
    question = data['question'].strip()
    if not question:
        return jsonify({'error': 'Pergunta vazia'}), 400
    
    # Inicializar QA chain se necessário
    if not qa_chain:
        chain = initialize_qa_chain()
        if not chain:
            return jsonify({
                'error': 'Olá! 😊 No momento não consigo responder suas perguntas. Por favor, tente novamente em alguns instantes.'
            }), 400
    
    try:
        response = qa_chain({'query': question})
        
        # Obter base URL para links
        base_url = request.host_url.rstrip('/') if request.host_url else 'http://localhost:5000'
        
        # Converter Markdown para HTML
        answer_html = convert_markdown_to_html(response['result'], base_url=base_url)
        
        # DEBUG TEMPORÁRIO: Verificar se links estão sendo gerados
        if 'FONTES' in answer_html:
            fontes_start = answer_html.find('FONTES')
            fontes_section = answer_html[fontes_start:fontes_start+1000]
            print("=" * 80)
            print("DEBUG: Seção FONTES no HTML gerado:")
            print(fontes_section)
            print(f"DEBUG: Contém '<a href=': {'<a href=' in fontes_section}")
            print(f"DEBUG: Total de '<a href=' no HTML completo: {answer_html.count('<a href=')}")
            print("=" * 80)
        
        # Extrair documentos fonte
        source_documents = []
        if 'source_documents' in response and response['source_documents']:
            for doc in response['source_documents']:
                source_documents.append({
                    'content': doc.page_content[:500] + "..." if len(doc.page_content) > 500 else doc.page_content,
                    'metadata': doc.metadata if hasattr(doc, 'metadata') else {}
                })
        
        return jsonify({
            'answer': answer_html,
            'sources': source_documents
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Erro ao processar pergunta: {str(e)}'}), 500


@app.route('/api/documents', methods=['GET'])
def get_documents():
    """Endpoint para obter informações sobre documentos processados."""
    vectorstore = document_processor.get_vectorstore()
    
    if not vectorstore:
        return jsonify({
            'has_documents': False,
            'message': 'Nenhum documento processado',
            'document_count': 0,
            'total_chunks': 0,
            'documents': []
        }), 200
    
    try:
        # Obter informações da collection
        collection = vectorstore._collection
        count = collection.count()
        
        # Obter lista de documentos com metadados
        documents_list = document_processor.get_documents_list()
        
        return jsonify({
            'has_documents': True,
            'document_count': len(documents_list),
            'total_chunks': count,
            'collection_name': collection.name,
            'documents': documents_list
        }), 200
    except Exception as e:
        return jsonify({
            'has_documents': False,
            'message': f'Erro ao obter informações dos documentos: {str(e)}',
            'document_count': 0,
            'total_chunks': 0,
            'documents': []
        }), 200


@app.route('/api/documents', methods=['DELETE'])
def clear_documents():
    """Endpoint para limpar todos os documentos."""
    try:
        document_processor.clear_vectorstore()
        global qa_chain
        qa_chain = None
        
        # Limpar arquivos de upload
        for filename in os.listdir(UPLOAD_FOLDER):
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
        
        return jsonify({
            'success': True,
            'message': 'Documentos limpos com sucesso'
        }), 200
    except Exception as e:
        return jsonify({'error': f'Erro ao limpar documentos: {str(e)}'}), 500


@app.route('/api/documents/<document_name>', methods=['DELETE'])
def delete_document(document_name):
    """Endpoint para deletar um documento específico."""
    from urllib.parse import unquote
    
    try:
        # Decodificar nome do documento
        doc_name = unquote(document_name)
        print(f"[DELETE] Nome recebido na URL (raw): {repr(document_name)}")
        print(f"[DELETE] Nome decodificado: {repr(doc_name)}")
        print(f"[DELETE] Tipo: {type(doc_name)}, Len: {len(doc_name)}")
        
        # Listar documentos disponíveis para debug
        docs_list = document_processor.get_documents_list()
        print(f"[DELETE] Documentos disponíveis: {[repr(d['name']) for d in docs_list]}")
        
        # Verificar se há match exato
        exact_match = any(d['name'] == doc_name for d in docs_list)
        print(f"[DELETE] Match exato encontrado: {exact_match}")
        
        # Se não há match exato, tentar encontrar usando match parcial/normalizado
        if not exact_match and docs_list:
            def normalize_name(name):
                if not name:
                    return ""
                normalized = name.strip()
                normalized = normalized.replace('_', ' ').replace('-', ' ')
                normalized = ' '.join(normalized.split())
                return normalized
            
            doc_name_normalized = normalize_name(doc_name)
            print(f"[DELETE] Tentando encontrar documento usando match normalizado: {repr(doc_name_normalized)}")
            
            found = False
            for doc in docs_list:
                doc_normalized = normalize_name(doc['name'])
                if doc_normalized == doc_name_normalized or doc_normalized.lower() == doc_name_normalized.lower():
                    print(f"[DELETE] Match encontrado! Usando: {repr(doc['name'])}")
                    doc_name = doc['name']  # Usar o nome exato do ChromaDB
                    found = True
                    break
            
            # Última tentativa: se houver apenas um documento, usar ele
            if not found and len(docs_list) == 1:
                print(f"[DELETE] Usando único documento disponível como fallback")
                doc_name = docs_list[0]['name']
                found = True
        
        # Deletar do ChromaDB e arquivo físico
        success = document_processor.delete_document(doc_name)
        
        if success:
            # Reinicializar QA chain
            global qa_chain
            qa_chain = None
            initialize_qa_chain()
            
            return jsonify({
                'success': True,
                'message': f'Documento deletado com sucesso'
            }), 200
        else:
            # Retornar erro mais descritivo
            available_names = [d['name'] for d in docs_list] if docs_list else []
            error_msg = f'Documento "{doc_name}" não encontrado'
            if available_names:
                error_msg += f'. Documentos disponíveis: {", ".join(available_names[:3])}'
            return jsonify({
                'error': error_msg
            }), 404
    except Exception as e:
        import traceback
        print(f"[DELETE] Erro: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Erro ao deletar documento: {str(e)}'}), 500


@app.route('/api/documents/<document_name>/view', methods=['GET'])
def view_document(document_name):
    """Endpoint para visualizar/baixar um documento PDF."""
    from urllib.parse import unquote
    from flask import send_file
    
    try:
        # Decodificar nome do documento
        doc_name = unquote(document_name)
        
        # Obter lista de documentos para encontrar o caminho
        documents_list = document_processor.get_documents_list()
        document = next((d for d in documents_list if d['name'] == doc_name), None)
        
        if not document or not document.get('file_path'):
            return jsonify({'error': 'Documento não encontrado'}), 404
        
        file_path = document['file_path']
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Arquivo físico não encontrado'}), 404
        
        return send_file(
            file_path,
            mimetype='application/pdf',
            as_attachment=False,
            download_name=doc_name
        )
    except Exception as e:
        return jsonify({'error': f'Erro ao visualizar documento: {str(e)}'}), 500


# Endpoint de edição de documento removido conforme solicitado


@app.route('/api/model', methods=['GET'])
def get_model_info():
    """Endpoint para obter informações sobre o modelo LLM atual."""
    try:
        from config import LLM_CONFIG
        provider_name = LLM_PROVIDER
        config = LLM_CONFIG.get(provider_name, {})
        
        return jsonify({
            'provider': provider_name,
            'model': config.get('model', 'N/A'),
            'temperature': config.get('temperature', 'N/A')
        }), 200
    except Exception as e:
        return jsonify({'error': f'Erro ao obter informações do modelo: {str(e)}'}), 500


def print_startup_info():
    """Imprime informações sobre a configuração do sistema ao iniciar."""
    print("\n" + "="*60)
    print("🚗 SISTEMA DE ASSISTENTE VIRTUAL - CÓDIGO DE ESTRADA")
    print("="*60)
    
    # Informações do LLM
    from config import LLM_CONFIG
    provider_name = LLM_PROVIDER.upper()
    config = LLM_CONFIG.get(LLM_PROVIDER, {})
    
    print(f"\n📊 CONFIGURAÇÃO DO MODELO LLM:")
    print(f"   Provedor: {provider_name}")
    print(f"   Modelo: {config.get('model', 'N/A')}")
    print(f"   Temperatura: {config.get('temperature', 'N/A')}")
    print(f"   Max Tokens: {config.get('max_tokens', 'N/A')}")
    
    # Verificar se API key está configurada
    api_key = config.get('api_key')
    if api_key:
        masked_key = api_key[:8] + "..." + api_key[-4:] if len(api_key) > 12 else "***"
        print(f"   API Key: {masked_key} ✅")
    else:
        print(f"   API Key: ❌ NÃO CONFIGURADA")
    
    # Informações do ChromaDB
    from config import CHROMA_DB_PATH, CHROMA_COLLECTION_NAME
    print(f"\n💾 CONFIGURAÇÃO DO BANCO DE DADOS:")
    print(f"   ChromaDB Path: {CHROMA_DB_PATH}")
    print(f"   Collection: {CHROMA_COLLECTION_NAME}")
    
    # Verificar se há documentos
    try:
        docs = document_processor.get_documents_list()
        if docs:
            print(f"   Documentos carregados: {len(docs)} ✅")
        else:
            print(f"   Documentos carregados: 0 ⚠️  (Faça upload de documentos)")
    except:
        print(f"   Documentos: Não inicializado")
    
    # Informações da API
    print(f"\n🌐 CONFIGURAÇÃO DA API:")
    print(f"   Host: {API_HOST}")
    print(f"   Port: {API_PORT}")
    print(f"   Debug: {API_DEBUG}")
    print(f"   CORS Origins: {', '.join(CORS_ORIGINS)}")
    
    print("\n" + "="*60)
    print("✅ Servidor iniciando...")
    print("="*60 + "\n")


if __name__ == '__main__':
    # Imprimir informações de inicialização
    print_startup_info()
    
    # Tentar inicializar QA chain se já houver documentos
    initialize_qa_chain()
    
    app.run(
        host=API_HOST,
        port=API_PORT,
        debug=API_DEBUG
    )

