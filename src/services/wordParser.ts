import mammoth from 'mammoth';
import { Question } from '../types';

export interface ParseResult {
  success: boolean;
  questions: Question[];
  rawText: string;
  message: string;
}

/**
 * Trích xuất text từ file Word (.docx) hoặc file Text (.txt)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } else if (fileName.endsWith('.txt')) {
    return await file.text();
  } else {
    throw new Error('Định dạng file không được hỗ trợ. Vui lòng chọn file Word (.docx) hoặc file Text (.txt)!');
  }
}

/**
 * Phân tích cú pháp văn bản đề thi tiếng Việt thành danh sách câu hỏi trắc nghiệm & tự luận
 */
export function parseExamQuestionsFromText(text: string): Question[] {
  const questions: Question[] = [];
  if (!text || !text.trim()) return questions;

  // Chuẩn hóa dòng
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Tách theo các khối câu hỏi: bắt đầu bằng "Câu 1", "Câu 2", "Bài 1", ...
  const questionBlocks: string[] = [];
  let currentBlock: string[] = [];

  const questionStartRegex = /^(Câu|Bài|Question)\s*(\d+)[:\.\-\)]/i;

  for (const line of lines) {
    if (questionStartRegex.test(line)) {
      if (currentBlock.length > 0) {
        questionBlocks.push(currentBlock.join('\n'));
      }
      currentBlock = [line];
    } else {
      if (currentBlock.length > 0) {
        currentBlock.push(line);
      } else {
        // Có thể là tiêu đề bài thi hoặc phần mở đầu
        currentBlock = [line];
      }
    }
  }

  if (currentBlock.length > 0) {
    questionBlocks.push(currentBlock.join('\n'));
  }

  // Phân tích từng khối
  for (let i = 0; i < questionBlocks.length; i++) {
    const block = questionBlocks[i];
    const parsed = parseSingleBlock(block, i + 1);
    if (parsed) {
      questions.push(parsed);
    }
  }

  return questions;
}

function parseSingleBlock(blockText: string, fallbackIndex: number): Question | null {
  const isEssay =
    /tự luận|bài tập tự luận|viết chương trình|mô tả thuật toán|giải thích|nêu ý nghĩa/i.test(
      blockText
    );

  const lines = blockText.split('\n');
  const firstLine = lines[0] || '';

  // Tìm nội dung câu hỏi
  let questionTitle = firstLine.replace(/^(Câu|Bài|Question)\s*\d+[:\.\-\)]\s*/i, '').trim();
  if (!questionTitle && lines.length > 1) {
    questionTitle = lines[1];
  }

  // TÌM ĐÁP ÁN ĐÚNG
  let correctAnswer = 0;
  const answerMatch = blockText.match(/(Đáp án|Key|Answer)[:\s]*([A-D])/i);
  if (answerMatch && answerMatch[2]) {
    const char = answerMatch[2].toUpperCase();
    if (char === 'A') correctAnswer = 0;
    else if (char === 'B') correctAnswer = 1;
    else if (char === 'C') correctAnswer = 2;
    else if (char === 'D') correctAnswer = 3;
  }

  // TÌM LỜI GIẢI / GIẢI THÍCH
  let explanation = '';
  const expMatch = blockText.match(/(Lời giải|Giải thích|Hướng dẫn|Gợi ý)[:\s]*([\s\S]+)$/i);
  if (expMatch && expMatch[2]) {
    explanation = expMatch[2].trim();
  }

  if (isEssay) {
    // Câu tự luận
    return {
      id: 'parsed-q-' + fallbackIndex + '-' + Date.now(),
      type: 'essay',
      question: blockText.replace(/(Đáp án|Lời giải|Gợi ý)[:\s]*[\s\S]+$/i, '').trim() || `Câu hỏi tự luận số ${fallbackIndex}`,
      points: 3.0,
      sampleAnswer: explanation || 'Học sinh trình bày đầy đủ các bước thực hiện hoặc viết code rõ ràng.',
      maxPoints: 3.0
    };
  }

  // Câu trắc nghiệm: tìm 4 phương án A, B, C, D
  let optA = '';
  let optB = '';
  let optC = '';
  let optD = '';

  const optAMatch = blockText.match(/[A][\.\)]\s*([^\n\r]+?)(?=\s*[B][\.\)]|$)/i);
  const optBMatch = blockText.match(/[B][\.\)]\s*([^\n\r]+?)(?=\s*[C][\.\)]|$)/i);
  const optCMatch = blockText.match(/[C][\.\)]\s*([^\n\r]+?)(?=\s*[D][\.\)]|$)/i);
  const optDMatch = blockText.match(/[D][\.\)]\s*([^\n\r]+?)(?=\s*(Đáp án|Key|Lời giải|$))/i);

  if (optAMatch) optA = optAMatch[1].trim();
  if (optBMatch) optB = optBMatch[1].trim();
  if (optCMatch) optC = optCMatch[1].trim();
  if (optDMatch) optD = optDMatch[1].trim();

  // Nếu không tìm thấy bằng regex ngang, tìm theo dòng
  if (!optA || !optB) {
    for (const l of lines) {
      if (/^A[\.\)]/i.test(l)) optA = l.replace(/^A[\.\)]\s*/i, '').trim();
      else if (/^B[\.\)]/i.test(l)) optB = l.replace(/^B[\.\)]\s*/i, '').trim();
      else if (/^C[\.\)]/i.test(l)) optC = l.replace(/^C[\.\)]\s*/i, '').trim();
      else if (/^D[\.\)]/i.test(l)) optD = l.replace(/^D[\.\)]\s*/i, '').trim();
    }
  }

  // Nếu vẫn không đủ 4 phương án, chuyển thành câu tự luận để không làm mất nội dung của thầy cô
  if (!optA || !optB) {
    return {
      id: 'parsed-q-' + fallbackIndex + '-' + Date.now(),
      type: 'essay',
      question: blockText.trim(),
      points: 3.0,
      sampleAnswer: explanation || 'Xem gợi ý chấm điểm của giáo viên.',
      maxPoints: 3.0
    };
  }

  return {
    id: 'parsed-q-' + fallbackIndex + '-' + Date.now(),
    type: 'multiple_choice',
    question: questionTitle || `Câu hỏi số ${fallbackIndex}`,
    points: 1.0,
    options: [optA || 'Đáp án A', optB || 'Đáp án B', optC || 'Đáp án C', optD || 'Đáp án D'],
    correctAnswer,
    explanation
  };
}
