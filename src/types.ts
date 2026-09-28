export type QuestionType = 'multiple_choice' | 'essay';

export const ALLOWED_CLASSES = [
  '6H1', '6H2', '6H3',
  '7H1', '7H2', '7H3',
  '8H1', '8H2', '8H3',
  '9H1', '9H2', '9H3'
] as const;

export type StudentClassType = typeof ALLOWED_CLASSES[number];

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  points?: number; // Số điểm cụ thể cho từng câu hỏi (Tổng toàn bộ câu hỏi trong đề là 10.0đ)
  imageUrl?: string; // Hình ảnh đính kèm câu hỏi (Base64 hoặc URL)
  // Thuộc tính cho câu trắc nghiệm
  options?: [string, string, string, string]; // A, B, C, D
  correctAnswer?: number; // 0: A, 1: B, 2: C, 3: D
  explanation?: string;
  // Thuộc tính cho câu tự luận
  sampleAnswer?: string; // Gợi ý đáp án / Tiêu chí chấm điểm
  maxPoints?: number; // Điểm tối đa (bằng points)
}

export type GradeLevel = 'Khối 6' | 'Khối 7' | 'Khối 8' | 'Khối 9';

export interface Exam {
  id: string;
  title: string;
  subject: string; // Tin Học
  grade: GradeLevel; // Khối 6, Khối 7, Khối 8, Khối 9
  examType: 'multiple_choice' | 'essay' | 'mixed';
  durationMinutes: number;
  totalPoints: number; // Thường là 10.0 điểm
  description?: string;
  createdAt: string;
  author: string;
  questions: Question[];
  status: 'active' | 'archived';
}

export interface Submission {
  id: string;
  examId: string;
  examTitle: string;
  grade?: GradeLevel;
  studentName: string;
  studentClass: string;
  submittedAt: string;
  timeSpentSeconds: number;
  score: number; // Điểm tổng kết thang 10
  autoScore: number; // Điểm trắc nghiệm tự động
  essayScore?: number; // Điểm tự luận do GV chấm
  correctCount: number;
  totalQuestions: number;
  answers: Record<number, number>; // index câu hỏi -> index đáp án trắc nghiệm
  essayAnswers?: Record<number, string>; // index câu hỏi -> bài tự luận học sinh gõ
  essayImages?: Record<number, string>; // index câu hỏi -> ảnh bài làm tự luận
  teacherFeedback?: string; // Nhận xét của giáo viên
  isGraded?: boolean; // Trạng thái đã chấm tự luận
}

export interface StudentProfile {
  name: string;
  studentClass: string;
}

export interface TeacherAccount {
  username: string; // ID đăng nhập, mặc định: admin
  passwordHash: string; // Mật khẩu, mặc định: admin
  hasChangedInitialPassword: boolean; // Bắt buộc đổi mật khẩu khi đăng nhập lần đầu
  recoveryPhone: string; // Số điện thoại khôi phục: 0702788047
  name: string; // Họ tên giáo viên
  schoolName?: string; // Tên trường THCS
}

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}
