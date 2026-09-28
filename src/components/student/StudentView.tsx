import React, { useState } from 'react';
import {
  BookOpen,
  Clock,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  CheckCircle2,
  User,
  GraduationCap,
  Layers,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { Exam, Submission, StudentProfile, GradeLevel } from '../../types';

interface StudentViewProps {
  exams: Exam[];
  submissions: Submission[];
  studentProfile: StudentProfile;
  onStartExam: (exam: Exam) => void;
  onReviewExam: (exam: Exam, submission: Submission) => void;
  onOpenProfileModal: () => void;
  onRefresh: () => void;
}

export const StudentView: React.FC<StudentViewProps> = ({
  exams,
  submissions,
  studentProfile,
  onStartExam,
  onReviewExam,
  onOpenProfileModal,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<'all' | GradeLevel>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'uncompleted' | 'completed'>('all');

  const gradeList: ('all' | GradeLevel)[] = ['all', 'Khối 6', 'Khối 7', 'Khối 8', 'Khối 9'];

  // Lọc bài tập
  const filteredExams = exams.filter((exam) => {
    const matchSearch =
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exam.description && exam.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchGrade = selectedGrade === 'all' || exam.grade === selectedGrade;

    const userSub = submissions.find(
      (s) =>
        s.examId === exam.id &&
        s.studentName.toLowerCase() === studentProfile.name.toLowerCase() &&
        s.studentClass.toLowerCase() === studentProfile.studentClass.toLowerCase()
    );

    if (selectedStatus === 'uncompleted') {
      return matchSearch && matchGrade && !userSub;
    }
    if (selectedStatus === 'completed') {
      return matchSearch && matchGrade && !!userSub;
    }
    return matchSearch && matchGrade;
  });

  return (
    <div className="space-y-6">
      {/* Banner Chào Mừng */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-indigo-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Cổng Thi Trực Tuyến Môn Tin Học THCS (Khối 6, 7, 8, 9)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Xin chào, {studentProfile.name || 'Em học sinh'}! 👋
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed">
              Lớp:{' '}
              <span className="font-bold text-white bg-white/20 px-2.5 py-0.5 rounded-lg">
                {studentProfile.studentClass || 'Chưa chọn'}
              </span>
              {' • '}
              Hệ thống tự động lưu bài làm và chấm điểm trắc nghiệm thang 10. Phần tự luận sẽ được Thầy/Cô chấm và gửi nhận xét.
            </p>
          </div>

          <button
            onClick={onOpenProfileModal}
            className="px-4 py-2.5 bg-white text-indigo-700 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-all shadow-md flex items-center gap-2 shrink-0"
          >
            <User className="w-4 h-4" />
            <span>{studentProfile.name ? 'Đổi Họ Tên & Lớp' : 'Nhập Họ Tên & Lớp'}</span>
          </button>
        </div>

        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
      </div>

      {/* THANH TAB 4 KHỐI LỚP 6, 7, 8, 9 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {gradeList.map((g) => {
          const isSelected = selectedGrade === g;
          return (
            <button
              key={g}
              onClick={() => setSelectedGrade(g)}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 whitespace-nowrap border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>{g === 'all' ? 'Tất Cả Các Khối' : g}</span>
            </button>
          );
        })}
      </div>

      {/* Thanh Tìm Kiếm & Bộ Lọc Trạng Thái */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm bài kiểm tra theo tên đề thi, nội dung..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="uncompleted">Chưa làm</option>
            <option value="completed">Đã nộp bài</option>
          </select>

          <button
            onClick={onRefresh}
            title="Tải lại danh sách"
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Danh Sách Đề Thi Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>
              Đề Kiểm Tra Tin Học {selectedGrade !== 'all' ? selectedGrade : ''} ({filteredExams.length})
            </span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Chọn đề để bắt đầu làm bài
          </span>
        </div>

        {filteredExams.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-800 text-lg">Không tìm thấy bài kiểm tra nào</h4>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Thử chọn khối lớp khác (Khối 6, 7, 8, 9) hoặc thay đổi từ khóa tìm kiếm.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredExams.map((exam) => {
              const userSub = submissions.find(
                (s) =>
                  s.examId === exam.id &&
                  s.studentName.toLowerCase() === studentProfile.name.toLowerCase() &&
                  s.studentClass.toLowerCase() === studentProfile.studentClass.toLowerCase()
              );

              const hasImages = exam.questions.some((q) => !!q.imageUrl);
              const hasEssay = exam.questions.some((q) => q.type === 'essay');

              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Header Card */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {exam.grade}
                        </span>
                        {hasEssay && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                            Có tự luận
                          </span>
                        )}
                        {hasImages && (
                          <span
                            className="text-slate-400"
                            title="Đề thi có kèm hình ảnh minh họa"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                          </span>
                        )}
                      </div>

                      {userSub ? (
                        <span className="text-xs px-2.5 py-1 rounded-full font-extrabold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{userSub.score.toFixed(1)} / 10đ</span>
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Chưa làm
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors">
                        {exam.title}
                      </h4>
                      {exam.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {exam.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata & Actions */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exam.durationMinutes} phút</span>
                      </span>
                      <span className="flex items-center gap-1.5 font-bold text-slate-700">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exam.questions.length} câu (10.0đ)</span>
                      </span>
                      <span className="text-slate-400 truncate max-w-[100px]" title={exam.author}>
                        {exam.author}
                      </span>
                    </div>

                    {userSub ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onReviewExam(exam, userSub)}
                          className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                        >
                          <span>Xem lại bài</span>
                        </button>
                        <button
                          onClick={() => onStartExam(exam)}
                          className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Làm lại</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onStartExam(exam)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-100 hover:shadow-indigo-200"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Bắt Đầu Làm Bài</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
