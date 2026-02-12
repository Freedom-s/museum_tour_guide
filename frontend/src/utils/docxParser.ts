import mammoth from 'mammoth';

/**
 * 从 .docx 文件中提取纯文本
 */
export const extractDocxText = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Failed to extract text from docx:', error);
    throw new Error('无法解析文档，请确保文件格式正确');
  }
};

/**
 * 从 .docx 文件中提取 HTML 格式文本
 */
export const extractDocxHtml = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Failed to extract HTML from docx:', error);
    throw new Error('无法解析文档，请确保文件格式正确');
  }
};

/**
 * 从 .docx 文件中提取原始文本和消息
 */
export const extractDocxRaw = async (file: File): Promise<{ text: string; messages: unknown[] }> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return {
      text: result.value,
      messages: result.messages,
    };
  } catch (error) {
    console.error('Failed to extract raw text from docx:', error);
    throw new Error('无法解析文档，请确保文件格式正确');
  }
};
