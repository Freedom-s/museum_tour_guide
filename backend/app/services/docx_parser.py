# ==================== 文档解析服务 ====================
from typing import Optional
from docx import Document
from loguru import logger
import PyPDF2


class DocxParser:
    """文档解析器，支持 docx 和 pdf 格式"""

    @staticmethod
    def parse_docx(content: bytes) -> Optional[str]:
        """
        解析 docx 文件内容

        Args:
            content: docx 文件的字节内容

        Returns:
            解析后的文本内容，失败返回 None
        """
        try:
            from io import BytesIO
            doc = Document(BytesIO(content))

            # 提取所有段落文本
            paragraphs = []
            for para in doc.paragraphs:
                text = para.text.strip()
                if text:
                    paragraphs.append(text)

            # 提取表格内容
            tables = []
            for table in doc.tables:
                for row in table.rows:
                    cells = []
                    for cell in row.cells:
                        text = cell.text.strip()
                        if text:
                            cells.append(text)
                    if cells:
                        tables.append(" | ".join(cells))

            result = "\n".join(paragraphs)
            if tables:
                result += "\n\n表格内容:\n" + "\n".join(tables)

            logger.info(f"Successfully parsed docx, got {len(result)} characters")
            return result if result.strip() else None

        except Exception as e:
            logger.error(f"Failed to parse docx: {e}")
            return None

    @staticmethod
    def parse_pdf(content: bytes) -> Optional[str]:
        """
        解析 PDF 文件内容

        Args:
            content: PDF 文件的字节内容

        Returns:
            解析后的文本内容，失败返回 None
        """
        try:
            from io import BytesIO
            pdf_file = BytesIO(content)
            reader = PyPDF2.PdfReader(pdf_file)

            # 提取所有页面文本
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

            logger.info(f"Successfully parsed PDF, got {len(text)} characters")
            return text.strip() if text.strip() else None

        except Exception as e:
            logger.error(f"Failed to parse PDF: {e}")
            return None

    @staticmethod
    def parse(content: bytes, content_type: str) -> Optional[str]:
        """
        根据内容类型自动解析文档

        Args:
            content: 文件的字节内容
            content_type: MIME 类型

        Returns:
            解析后的文本内容，失败返回 None
        """
        content_type = content_type.lower()

        if "wordprocessingml.document" in content_type or content_type == "application/docx":
            return DocxParser.parse_docx(content)
        elif "msword" in content_type:
            # 旧版 .doc 格式，python-docx 不支持，需要其他库
            logger.warning("Legacy .doc format not supported, please use .docx")
            return None
        elif "pdf" in content_type:
            return DocxParser.parse_pdf(content)
        else:
            logger.warning(f"Unsupported content type: {content_type}")
            return None


# 全局文档解析器实例
docx_parser = DocxParser()
