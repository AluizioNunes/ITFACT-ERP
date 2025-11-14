"""
Sistema de Extração de Dados de Catálogos PDF - Multi-Fabricantes
Autor: Sistema automatizado
Versão: 1.0
"""

import os
import re
import json
import requests
from pathlib import Path
from datetime import datetime
import pandas as pd
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import PyPDF2
import pdfplumber
from pdf2image import convert_from_path
from PIL import Image
import pytesseract
from tqdm import tqdm
import warnings
warnings.filterwarnings('ignore')
import hashlib
from pymongo import MongoClient
import gridfs

class CatalogExtractor:
    """
    Classe principal para extração de dados de catálogos PDF
    """
    
    def __init__(self, config_file='manufacturers_config.json'):
        """
        Inicializa o extrator
        
        Args:
            config_file: Arquivo JSON com configurações das fabricantes
        """
        self.config_file = config_file
        self.config = self.load_config()
        self.output_dir = Path('extracted_data')
        # Limite opcional de produtos via variável de ambiente
        env_limit = os.getenv('PRODUCT_LIMIT')
        try:
            self.product_limit = int(env_limit) if env_limit else None
        except ValueError:
            self.product_limit = None
        # Configuração do MongoDB
        self.mongo_url = os.getenv('MONGO_URL')
        self.mongo_db_name = os.getenv('MONGO_DB', 'catalogs')
        self.mongo_enabled = False
        self.mongo_client = None
        self.mongo_db = None
        self.fs = None
        self.setup_directories()
        self.setup_mongo()
        
    def setup_directories(self):
        """Cria estrutura de diretórios"""
        dirs = [
            self.output_dir,
            self.output_dir / 'pdfs',
            self.output_dir / 'images',
            self.output_dir / 'temp',
            self.output_dir / 'spreadsheets'
        ]
        for dir_path in dirs:
            dir_path.mkdir(parents=True, exist_ok=True)

    def setup_mongo(self):
        """Inicializa conexão com MongoDB e GridFS, se configurado"""
        try:
            if not self.mongo_url:
                # Fallback para localhost se não estiver definido
                self.mongo_url = 'mongodb://localhost:27017'
            self.mongo_client = MongoClient(self.mongo_url)
            self.mongo_db = self.mongo_client[self.mongo_db_name]
            self.fs = gridfs.GridFS(self.mongo_db)
            # Testa conexão simples
            self.mongo_db.command('ping')
            self.mongo_enabled = True
            print(f"✓ Conectado ao MongoDB: db='{self.mongo_db_name}'")
        except Exception as e:
            print(f"✗ MongoDB indisponível, seguindo sem persistir no Mongo: {str(e)}")
            self.mongo_enabled = False

    def _sha256(self, filepath):
        """Calcula SHA-256 de um arquivo"""
        h = hashlib.sha256()
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                h.update(chunk)
        return h.hexdigest()

    def store_file_gridfs(self, filepath, filename, metadata):
        """Armazena arquivo no GridFS com verificação por hash; retorna file_id"""
        if not self.mongo_enabled:
            return None
        try:
            file_hash = self._sha256(filepath)
            existing = self.mongo_db.fs.files.find_one({"metadata.sha256": file_hash})
            if existing:
                return existing.get('_id')
            with open(filepath, 'rb') as f:
                file_id = self.fs.put(
                    f,
                    filename=filename,
                    metadata={**metadata, "sha256": file_hash, "stored_at": datetime.utcnow().isoformat()}
                )
                return file_id
        except Exception as e:
            print(f"    ✗ Erro ao salvar em GridFS '{filename}': {str(e)}")
            return None
    
    def load_config(self):
        """Carrega configurações das fabricantes"""
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            # Configuração padrão
            default_config = {
                "manufacturers": [
                    {
                        "name": "Furukawa Electric",
                        "code": "FURUKAWA",
                        "catalog_pages": [
                            "https://www.furukawa.co.jp/en/product/catalogue/#anchor_1_1",
                            "https://www.furukawa.co.jp/en/product/catalogue/#anchor_1_2",
                            "https://www.furukawa.co.jp/en/product/catalogue/#anchor_1_3",
                            "https://www.furukawa.co.jp/en/product/catalogue/#anchor_1_4"
                        ],
                        "pdf_patterns": [
                            r'\.pdf$',
                            r'/pdf/',
                            r'/catalog/'
                        ]
                    }
                ]
            }
            self.save_config(default_config)
            return default_config
    
    def save_config(self, config):
        """Salva configurações no arquivo JSON"""
        with open(self.config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=4, ensure_ascii=False)
        print(f"✓ Configuração salva em: {self.config_file}")
    
    def add_manufacturer(self, name, code, catalog_pages, pdf_patterns=None):
        """
        Adiciona nova fabricante ao sistema
        
        Args:
            name: Nome da fabricante
            code: Código/sigla da fabricante
            catalog_pages: Lista de URLs das páginas de catálogo
            pdf_patterns: Padrões regex para identificar PDFs (opcional)
        """
        if pdf_patterns is None:
            pdf_patterns = [r'\.pdf$']
        
        new_manufacturer = {
            "name": name,
            "code": code,
            "catalog_pages": catalog_pages,
            "pdf_patterns": pdf_patterns
        }
        
        self.config["manufacturers"].append(new_manufacturer)
        self.save_config(self.config)
        print(f"✓ Fabricante '{name}' adicionada com sucesso!")
    
    def fetch_page(self, url):
        """Busca conteúdo HTML de uma página"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            return response.text
        except Exception as e:
            print(f"✗ Erro ao buscar {url}: {str(e)}")
            return None
    
    def extract_pdf_links(self, html_content, base_url, patterns):
        """Extrai links de PDF de uma página HTML"""
        soup = BeautifulSoup(html_content, 'html.parser')
        pdf_links = []
        
        # Busca todos os links
        for link in soup.find_all('a', href=True):
            href = link.get('href')
            
            # Verifica se corresponde aos padrões de PDF
            for pattern in patterns:
                if re.search(pattern, href, re.IGNORECASE):
                    full_url = urljoin(base_url, href)
                    
                    # Extrai informações do link
                    link_text = link.get_text(strip=True)
                    pdf_info = {
                        'url': full_url,
                        'name': link_text or 'Sem nome',
                        'filename': os.path.basename(urlparse(full_url).path)
                    }
                    
                    if pdf_info not in pdf_links:
                        pdf_links.append(pdf_info)
                    break
        
        return pdf_links
    
    def download_pdf(self, pdf_url, manufacturer_code, filename):
        """Baixa um arquivo PDF"""
        try:
            safe_filename = re.sub(r'[^\w\-_\.]', '_', filename)
            filepath = self.output_dir / 'pdfs' / manufacturer_code / safe_filename
            filepath.parent.mkdir(parents=True, exist_ok=True)
            
            if filepath.exists():
                print(f"  ↓ PDF já existe: {safe_filename}")
                return str(filepath)
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(pdf_url, headers=headers, timeout=60, stream=True)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            
            with open(filepath, 'wb') as f:
                if total_size:
                    with tqdm(total=total_size, unit='B', unit_scale=True, desc=f"  ↓ {safe_filename}") as pbar:
                        for chunk in response.iter_content(chunk_size=8192):
                            f.write(chunk)
                            pbar.update(len(chunk))
                else:
                    f.write(response.content)
            
            print(f"  ✓ PDF baixado: {safe_filename}")
            return str(filepath)
            
        except Exception as e:
            print(f"  ✗ Erro ao baixar PDF {filename}: {str(e)}")
            return None
    
    def extract_text_from_pdf(self, pdf_path):
        """Extrai texto de um PDF usando múltiplos métodos"""
        text_content = []
        
        try:
            # Método 1: pdfplumber (melhor para tabelas)
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    page_text = page.extract_text()
                    if page_text:
                        text_content.append({
                            'page': page_num,
                            'text': page_text,
                            'tables': page.extract_tables()
                        })
        except Exception as e:
            print(f"    Aviso: Erro ao extrair com pdfplumber: {str(e)}")
        
        # Se não conseguiu texto, tenta PyPDF2
        if not text_content:
            try:
                with open(pdf_path, 'rb') as f:
                    pdf_reader = PyPDF2.PdfReader(f)
                    for page_num, page in enumerate(pdf_reader.pages, 1):
                        page_text = page.extract_text()
                        if page_text:
                            text_content.append({
                                'page': page_num,
                                'text': page_text,
                                'tables': []
                            })
            except Exception as e:
                print(f"    Aviso: Erro ao extrair com PyPDF2: {str(e)}")
        
        return text_content
    
    def extract_images_from_pdf(self, pdf_path, manufacturer_code, product_code=None):
        """Extrai imagens de um PDF"""
        images = []
        
        try:
            # Converte páginas do PDF em imagens
            pdf_images = convert_from_path(
                pdf_path,
                dpi=200,
                first_page=1,
                last_page=None
            )
            
            base_filename = Path(pdf_path).stem
            
            for page_num, img in enumerate(pdf_images, 1):
                # Nome da imagem
                if product_code:
                    img_filename = f"{manufacturer_code}_{product_code}_page{page_num}.png"
                else:
                    img_filename = f"{manufacturer_code}_{base_filename}_page{page_num}.png"
                
                img_path = self.output_dir / 'images' / manufacturer_code / img_filename
                img_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Salva imagem
                img.save(img_path, 'PNG', optimize=True)
                
                images.append({
                    'page': page_num,
                    'filename': img_filename,
                    'path': str(img_path),
                    'size': img.size
                })
            
            print(f"    ✓ Extraídas {len(images)} imagens")
            
        except Exception as e:
            print(f"    ✗ Erro ao extrair imagens: {str(e)}")
        
        return images
    
    def parse_product_data(self, text_content, tables, manufacturer_code):
        """
        Analisa texto e tabelas para extrair dados de produtos
        """
        products = []
        
        # Padrões comuns para identificar produtos
        patterns = {
            'product_code': r'(?:Model|Code|Part\s*No|P/N|Item)[:\s]+([A-Z0-9\-]+)',
            'description': r'(?:Description|Product)[:\s]+(.+)',
            'specifications': r'(?:Spec|Specifications)[:\s]+(.+)',
        }
        
        # Processa cada página
        for page_data in text_content:
            page_num = page_data['page']
            text = page_data['text']
            page_tables = page_data.get('tables', [])
            
            # Busca padrões no texto
            for line in text.split('\n'):
                product = {'manufacturer': manufacturer_code, 'page': page_num}
                
                for field, pattern in patterns.items():
                    match = re.search(pattern, line, re.IGNORECASE)
                    if match:
                        product[field] = match.group(1).strip()
                
                if len(product) > 2:  # Se encontrou algum dado além de manufacturer e page
                    product['raw_text'] = line
                    products.append(product)
            
            # Processa tabelas
            for table_idx, table in enumerate(page_tables):
                if table and len(table) > 1:
                    headers = table[0] if table[0] else []
                    
                    for row_idx, row in enumerate(table[1:], 1):
                        if row:
                            product = {
                                'manufacturer': manufacturer_code,
                                'page': page_num,
                                'table_index': table_idx,
                                'row_index': row_idx
                            }
                            
                            for col_idx, cell in enumerate(row):
                                if col_idx < len(headers) and headers[col_idx]:
                                    header = str(headers[col_idx]).strip()
                                    product[header] = str(cell).strip() if cell else ''
                            
                            if len(product) > 4:
                                products.append(product)
        
        return products
    
    def process_manufacturer(self, manufacturer):
        """Processa todos os catálogos de uma fabricante"""
        print(f"\n{'='*60}")
        print(f"Processando: {manufacturer['name']} ({manufacturer['code']})")
        print(f"{'='*60}")
        if self.product_limit:
            print(f"→ Modo rápido ativo: limitando a {self.product_limit} produtos e pulando extração de imagens.")
        
        all_products = []
        all_pdfs = []
        
        # Busca PDFs em todas as páginas de catálogo
        for catalog_url in manufacturer['catalog_pages']:
            print(f"\n→ Buscando catálogos em: {catalog_url}")
            
            html_content = self.fetch_page(catalog_url)
            if not html_content:
                continue
            
            pdf_links = self.extract_pdf_links(
                html_content,
                catalog_url,
                manufacturer['pdf_patterns']
            )
            
            print(f"  ✓ Encontrados {len(pdf_links)} PDFs")
            all_pdfs.extend(pdf_links)
        
        # Processa cada PDF
        for idx, pdf_info in enumerate(all_pdfs, 1):
            # Se já atingiu o limite, interrompe
            if self.product_limit and len(all_products) >= self.product_limit:
                break
            print(f"\n[{idx}/{len(all_pdfs)}] Processando: {pdf_info['name']}")
            
            # Baixa PDF
            pdf_path = self.download_pdf(
                pdf_info['url'],
                manufacturer['code'],
                pdf_info['filename']
            )
            
            if not pdf_path:
                continue

            # Salva PDF no MongoDB (GridFS)
            pdf_file_id = self.store_file_gridfs(
                pdf_path,
                pdf_info['filename'],
                {
                    "type": "pdf",
                    "manufacturer": manufacturer['code'],
                    "name": pdf_info.get('name'),
                    "url": pdf_info.get('url')
                }
            )
            
            # Extrai texto e dados
            print(f"  → Extraindo texto...")
            text_content = self.extract_text_from_pdf(pdf_path)
            
            if text_content:
                print(f"    ✓ Texto extraído de {len(text_content)} páginas")
                
                # Analisa dados de produtos
                products = self.parse_product_data(
                    text_content,
                    [p.get('tables', []) for p in text_content],
                    manufacturer['code']
                )
                
                if products:
                    print(f"    ✓ Encontrados {len(products)} produtos")
                    
                    # Adiciona informações do PDF
                    for product in products:
                        product['pdf_source'] = pdf_info['filename']
                        product['pdf_name'] = pdf_info['name']
                        product['pdf_url'] = pdf_info['url']
                        if pdf_file_id:
                            product['pdf_file_id'] = str(pdf_file_id)
                    
                    # Aplica limite de produtos se necessário
                    if self.product_limit:
                        remaining = self.product_limit - len(all_products)
                        if remaining > 0:
                            all_products.extend(products[:remaining])
                        else:
                            pass
                    else:
                        all_products.extend(products)
            
            # Extrai imagens apenas se não estiver em modo rápido
            if not self.product_limit:
                print(f"  → Extraindo imagens...")
                images = self.extract_images_from_pdf(
                    pdf_path,
                    manufacturer['code']
                )
                # Armazena imagens no MongoDB
                for img in images:
                    try:
                        img_path = img['path']
                        img_file_id = self.store_file_gridfs(
                            img_path,
                            img['filename'],
                            {
                                "type": "image",
                                "manufacturer": manufacturer['code'],
                                "pdf_source": pdf_info['filename'],
                                "page": img.get('page'),
                                "size": img.get('size')
                            }
                        )
                        if img_file_id:
                            img['file_id'] = str(img_file_id)
                    except Exception as e:
                        print(f"    ✗ Erro ao salvar imagem no Mongo: {str(e)}")
            else:
                print("  → Pulando extração de imagens (modo rápido)")
        
        # Persiste documentos de produtos no Mongo
        if self.mongo_enabled and all_products:
            try:
                for p in all_products:
                    p['stored_at'] = datetime.utcnow().isoformat()
                self.mongo_db.products.insert_many(all_products, ordered=False)
                print(f"\n✓ {len(all_products)} documentos de produtos salvos em MongoDB")
            except Exception as e:
                print(f"✗ Erro ao salvar produtos no MongoDB: {str(e)}")
        
        return all_products
    
    def create_spreadsheet(self, products, manufacturer_code):
        """Cria planilha Excel com os dados extraídos"""
        if not products:
            print("  ⚠ Nenhum produto encontrado para criar planilha")
            return None
        
        df = pd.DataFrame(products)
        
        # Organiza colunas
        priority_cols = [
            'manufacturer', 'product_code', 'description', 
            'specifications', 'page', 'pdf_name', 'pdf_source'
        ]
        
        other_cols = [col for col in df.columns if col not in priority_cols]
        ordered_cols = [col for col in priority_cols if col in df.columns] + other_cols
        df = df[ordered_cols]
        
        # Salva planilha
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{manufacturer_code}_produtos_{timestamp}.xlsx"
        filepath = self.output_dir / 'spreadsheets' / filename
        
        with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Produtos', index=False)
            
            # Ajusta largura das colunas
            worksheet = writer.sheets['Produtos']
            for idx, col in enumerate(df.columns, 1):
                max_length = max(
                    df[col].astype(str).apply(len).max(),
                    len(col)
                ) + 2
                worksheet.column_dimensions[chr(64 + idx)].width = min(max_length, 50)
        
        print(f"\n✓ Planilha criada: {filepath}")
        return str(filepath)
    
    def run(self):
        """Executa extração para todas as fabricantes configuradas"""
        print("\n" + "="*60)
        print("SISTEMA DE EXTRAÇÃO DE CATÁLOGOS PDF")
        print("="*60)
        
        total_products = []
        
        for manufacturer in self.config['manufacturers']:
            products = self.process_manufacturer(manufacturer)
            
            if products:
                total_products.extend(products)
                
                # Cria planilha individual
                self.create_spreadsheet(products, manufacturer['code'])
        
        # Cria planilha consolidada
        if total_products:
            print(f"\n{'='*60}")
            print(f"Criando planilha consolidada...")
            self.create_spreadsheet(total_products, 'TODAS_FABRICANTES')
            print(f"\n✓ Total de produtos extraídos: {len(total_products)}")
        
        print(f"\n{'='*60}")
        print("EXTRAÇÃO CONCLUÍDA!")
        print(f"{'='*60}")
        print(f"Dados salvos em: {self.output_dir}")


def main():
    """Função principal"""
    
    # Cria extrator
    extractor = CatalogExtractor()
    
    # Exemplo de como adicionar novas fabricantes
    # extractor.add_manufacturer(
    #     name="Nome da Fabricante",
    #     code="CODIGO",
    #     catalog_pages=["https://exemplo.com/catalogo"],
    #     pdf_patterns=[r'\.pdf$']
    # )
    
    # Executa extração
    extractor.run()


if __name__ == "__main__":
    main()
