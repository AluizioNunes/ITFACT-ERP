FROM python:3.12-slim

# Diretório de trabalho do extrator
WORKDIR /app/extractor

# Dependências do sistema necessárias para pdf2image (poppler) e pytesseract
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Copia requisitos Python do backend e instala
COPY requirements_txt.txt /app/extractor/requirements.txt
RUN pip install --no-cache-dir -r /app/extractor/requirements.txt

# Copia o script do extrator
COPY pdf_catalog_extractor.py /app/extractor/pdf_catalog_extractor.py

# Mantém logs do Python sem buffer
ENV PYTHONUNBUFFERED=1

# Comando padrão: executa o extrator
CMD ["python", "/app/extractor/pdf_catalog_extractor.py"]