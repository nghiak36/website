import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Award,
  ChevronDown,
  GraduationCap,
  Save,
  MessageSquare,
  ZoomIn,
  Image as ImageIcon,
  CheckSquare,
  Square,
  AlertTriangle,
  Check
} from 'lucide-react';
import { Submission, Exam, GradeLevel } from '../../types';

interface SubmissionsListProps {
  submissions: Submission[];
  exams: Exam[];
  onDeleteSubmission: (id: string) => void;
  onDeleteMultipleSubmissions?: (ids: string[]) => void;
  onUpdateSubmission?: (submission: Submission) => void;
  onExportCsv: () => void;
  onDeleteAllSubmissions?: () => void;
}

export const SubmissionsList: React.FC<SubmissionsListProps> = ({
  submissions,
  exams,
  onDeleteSubmission,
  onDeleteMultipleSubmissions,
  onUpdateSubmission,
  onExportCsv,
  onDeleteAllSubmissions
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<'all' | GradeLevel>('all');
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'score_desc' | 'score_asc'>('date_desc');
  const [inspectSubmission, setInspectSubmission] = useState<Submission | null>(null);

  // Khung check chọn xóa nhiều bài nộp cùng lúc
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);

  // Modal xác nhận xóa an toàn không dùng window.confirm (tránh bị trình duyệt / iframe chặn)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'multiple' | 'all';
    subId?: string;
    studentName?: string;
    count?: number;
  }>({ isOpen: false, type: 'single' });

  // Trạng thái chấm điểm tự luận trong modal
  const [tempEssayScores, setTempEssayScores] = useState<Record<number, number>>({});
  const [tempFeedback, setTempFeedback] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  // Danh sách các lớp
  const availableClasses = Array.from(
    new Set(submissions.map((s) => s.studentClass).filter(Boolean))
  ).sort();

  // Lọc và sắp xếp
  const filteredSubmissions = submissions
    .filter((s) => {
      const matchSearch =
        s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentClass.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGrade = selectedGrade === 'all' || s.grade === selectedGrade;
      const matchExam = selectedExamId === 'all' || s.examId === selectedExamId;
      const matchClass = selectedClass === 'all' || s.studentClass === selectedClass;
      return matchSearch && matchGrade && matchExam && matchClass;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      }
      if (sortBy === 'score_desc') {
        return b.score - a.score;
      }
      if (sortBy === 'score_asc') {
        return a.score - b.score;
      }
      return 0;
    });

  const getScoreBadge = (score: number) => {
    if (score >= 8.5) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (score >= 6.5) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 5.0) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const selectedInspectExam = inspectSubmission
    ? exams.find((e) => e.id === inspectSubmission.examId)
    : null;

  // Khi mở bài làm của học sinh, tải điểm tự luận sẵn có
  const handleOpenInspect = (sub: Submission) => {
    setInspectSubmission(sub);
    setTempFeedback(sub.teacherFeedback || '');
    setSaveSuccessMsg(false);

    const initialEssayScores: Record<number, number> = {};
    const ex = exams.find((e) => e.id === sub.examId);
    if (ex) {
      ex.questions.forEach((q, idx) => {
        if (q.type === 'essay') {
          initialEssayScores[idx] = sub.essayScore ?? 0;
        }
      });
    }
    setTempEssayScores(initialEssayScores);
  };

  // Lưu điểm chấm tự luận & nhận xét của giáo viên
  const handleSaveGrading = () => {
    if (!inspectSubmission) return;

    let totalEssayGiven = 0;
    Object.values(tempEssayScores).forEach((pts) => {
      totalEssayGiven += Number(pts) || 0;
    });

    const newFinalScore = Math.min(10.0, Math.round(((inspectSubmission.autoScore || 0) + totalEssayGiven) * 10) / 10);

    const updated: Submission = {
      ...inspectSubmission,
      score: newFinalScore,
      essayScore: totalEssayGiven,
      teacherFeedback: tempFeedback,
      isGraded: true
    };

    setInspectSubmission(updated);
    if (onUpdateSubmission) {
      onUpdateSubmission(updated);
    }
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  // =================== XỬ LÝ KHUNG CHECK & CHỌN XÓA NHIỀU ĐỐI TƯỢNG ===================
  const filteredSubIds = filteredSubmissions.map((s) => s.id);
  const isAllFilteredSelected =
    filteredSubIds.length > 0 && filteredSubIds.every((id) => selectedSubIds.includes(id));
  const selectedCount = selectedSubIds.length;

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Bỏ chọn tất cả những bài đang lọc
      setSelectedSubIds((prev) => prev.filter((id) => !filteredSubIds.includes(id)));
    } else {
      // Chọn tất cả những bài đang lọc
      setSelectedSubIds((prev) => Array.from(new Set([...prev, ...filteredSubIds])));
    }
  };

  const handleToggleSelectOne = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedSubIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedSubIds([]);
  };

  // Thực hiện xóa an toàn từ Modal (Không bao giờ dùng window.confirm vì bị sandbox chặn)
  const handleExecuteDelete = () => {
    if (deleteModal.type === 'single' && deleteModal.subId) {
      onDeleteSubmission(deleteModal.subId);
      setSelectedSubIds((prev) => prev.filter((id) => id !== deleteModal.subId));
      if (inspectSubmission?.id === deleteModal.subId) {
        setInspectSubmission(null);
      }
    } else if (deleteModal.type === 'multiple') {
      if (onDeleteMultipleSubmissions) {
        onDeleteMultipleSubmissions(selectedSubIds);
      } else {
        selectedSubIds.forEach((id) => onDeleteSubmission(id));
      }
      if (inspectSubmission && selectedSubIds.includes(inspectSubmission.id)) {
        setInspectSubmission(null);
      }
      setSelectedSubIds([]);
    } else if (deleteModal.type === 'all') {
      if (onDeleteAllSubmissions) {
        onDeleteAllSubmissions();
      }
      setSelectedSubIds([]);
      setInspectSubmission(null);
    }
    setDeleteModal({ isOpen: false, type: 'single' });
  };

  return (
    <div className="space-y-6">
      {/* Phóng to ảnh */}
      {enlargedImage && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={enlargedImage}
              alt="Phóng to ảnh"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-slate-900 font-bold flex items-center justify-center shadow-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Bộ Lọc, Tìm Kiếm & Nút Xuất Excel */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        {/* Thanh Chọn 4 Khối Lớp */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Khối THCS:</span>
          {(['all', 'Khối 6', 'Khối 7', 'Khối 8', 'Khối 9'] as ('all' | GradeLevel)[]).map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGrade(g)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap border ${
                selectedGrade === g
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{g === 'all' ? 'Tất cả 4 khối' : g}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên học sinh hoặc lớp..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[200px] truncate"
            >
              <option value="all">Tất cả đề thi</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  [{ex.grade}] {ex.title}
                </option>
              ))}
            </select>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả các lớp</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  Lớp {cls}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="date_desc">Mới nộp nhất</option>
              <option value="score_desc">Điểm cao đến thấp</option>
              <option value="score_asc">Điểm thấp đến cao</option>
            </select>

            {submissions.length > 0 && onDeleteAllSubmissions && (
              <button
                onClick={() =>
                  setDeleteModal({
                    isOpen: true,
                    type: 'all',
                    count: submissions.length
                  })
                }
                className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-2xl text-xs transition flex items-center gap-1.5 border border-red-200"
                title="Xóa toàn bộ bài làm của học sinh"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa Hết Bài Nộp</span>
              </button>
            )}

            <button
              onClick={onExportCsv}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-emerald-100 transition flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
          <span>
            Đang hiển thị <strong>{filteredSubmissions.length}</strong> bài nộp
          </span>
          <span className="text-slate-400">Tự động cập nhật bài nộp thời gian thực</span>
        </div>
      </div>

      {/* Thanh Thao Tác Chọn Nhiều Bài Nộp (Khung Check) */}
      {selectedCount > 0 && (
        <div className="bg-indigo-900 text-white rounded-2xl p-3.5 sm:p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-black">
              <CheckSquare className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <span className="text-sm font-black">Đã chọn {selectedCount} bài làm</span>
              <span className="text-xs text-indigo-200 ml-2 hidden sm:inline">
                (trên tổng số {filteredSubmissions.length} bài đang hiển thị)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleClearSelection}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition"
            >
              Bỏ chọn tất cả
            </button>
            <button
              onClick={() =>
                setDeleteModal({
                  isOpen: true,
                  type: 'multiple',
                  count: selectedCount
                })
              }
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa {selectedCount} Bài Đã Chọn</span>
            </button>
          </div>
        </div>
      )}

      {/* Bảng Danh Sách Bài Nộp */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-extrabold text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={handleToggleSelectAll}
                    title={isAllFilteredSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả bài đang hiển thị'}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-3 w-12 text-center">STT</th>
                <th className="py-3.5 px-4">Họ và Tên</th>
                <th className="py-3.5 px-4">Khối / Lớp</th>
                <th className="py-3.5 px-4">Đề Kiểm Tra</th>
                <th className="py-3.5 px-4 text-center">Điểm Tổng</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4">Thời Gian Nộp</th>
                <th className="py-3.5 px-4 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Không tìm thấy bài nộp nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub, idx) => {
                  const date = new Date(sub.submittedAt);
                  const formattedDate = !isNaN(date.getTime())
                    ? `${date.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} • ${date.toLocaleDateString('vi-VN')}`
                    : 'Mới nộp';

                  const isChecked = selectedSubIds.includes(sub.id);

                  return (
                    <tr
                      key={sub.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-indigo-50/50 font-medium' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectOne(sub.id)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-3 text-center text-xs font-semibold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {sub.studentName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs">
                          {sub.grade || ''} - {sub.studentClass}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 max-w-xs truncate" title={sub.examTitle}>
                        {sub.examTitle}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-black border ${getScoreBadge(
                            sub.score
                          )}`}
                        >
                          {sub.score.toFixed(1)} / 10
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs">
                        {sub.isGraded ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Đã chấm xong
                          </span>
                        ) : (
                          <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                            Cần chấm tự luận
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenInspect(sub)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition flex items-center gap-1"
                            title="Xem chi tiết & Chấm bài"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Chấm & Xem</span>
                          </button>
                          <button
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                type: 'single',
                                subId: sub.id,
                                studentName: sub.studentName
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                            title="Xóa bài nộp"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CHI TIẾT BÀI LÀM & CHẤM ĐIỂM TỰ LUẬN */}
      {inspectSubmission && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {inspectSubmission.grade} • Lớp {inspectSubmission.studentClass}
                  </span>
                  <span className="text-xs text-slate-500">
                    Nộp lúc:{' '}
                    {new Date(inspectSubmission.submittedAt).toLocaleTimeString('vi-VN')}{' '}
                    {new Date(inspectSubmission.submittedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Bài Làm: {inspectSubmission.studentName}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {inspectSubmission.examTitle} • Điểm hiện tại:{' '}
                  <strong className="text-indigo-600 font-black text-sm">
                    {inspectSubmission.score.toFixed(1)} / 10đ
                  </strong>{' '}
                  (Trắc nghiệm: {inspectSubmission.autoScore.toFixed(1)}đ • Tự luận: {inspectSubmission.essayScore || 0}đ)
                </p>
              </div>

              <button
                onClick={() => setInspectSubmission(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Thông báo lưu thành công */}
            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 mt-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Đã lưu điểm tự luận và nhận xét của giáo viên thành công!</span>
              </div>
            )}

            {/* Body: Danh sách câu hỏi */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
              {selectedInspectExam ? (
                selectedInspectExam.questions.map((q, idx) => {
                  const optionLetters = ['A', 'B', 'C', 'D'];

                  // 1. Nếu là câu trắc nghiệm
                  if (q.type === 'multiple_choice') {
                    const studentAns = inspectSubmission.answers[idx];
                    const isCorrect = studentAns === q.correctAnswer;

                    return (
                      <div
                        key={q.id || idx}
                        className={`p-5 rounded-2xl border-2 space-y-3 ${
                          isCorrect
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : 'border-red-200 bg-red-50/20'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-800">Câu {idx + 1} (Trắc nghiệm):</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-md ${
                              isCorrect
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isCorrect ? '✔ Đúng' : '✖ Sai'}
                          </span>
                        </div>

                        <p className="text-sm font-bold text-slate-900 leading-relaxed">
                          {q.question}
                        </p>

                        {q.imageUrl && (
                          <img
                            src={q.imageUrl}
                            alt="Hình ảnh câu hỏi"
                            className="max-h-36 rounded-lg object-contain bg-white cursor-pointer"
                            onClick={() => setEnlargedImage(q.imageUrl || null)}
                          />
                        )}

                        <div className="space-y-1.5 pt-1">
                          {(q.options || []).map((opt, oIdx) => {
                            const isKey = oIdx === q.correctAnswer;
                            const isStudent = oIdx === studentAns;

                            let badge = null;
                            let boxStyle = 'border-slate-200 bg-white text-slate-700';

                            if (isKey) {
                              boxStyle =
                                'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                              badge = (
                                <span className="text-xs px-2 py-0.5 bg-emerald-600 text-white rounded font-bold">
                                  Đáp án đúng
                                </span>
                              );
                            }
                            if (isStudent && !isCorrect) {
                              boxStyle = 'border-red-500 bg-red-50 text-red-900 font-bold';
                              badge = (
                                <span className="text-xs px-2 py-0.5 bg-red-600 text-white rounded font-bold">
                                  Học sinh chọn sai
                                </span>
                              );
                            }

                            return (
                              <div
                                key={oIdx}
                                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${boxStyle}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded flex items-center justify-center font-bold bg-slate-100">
                                    {optionLetters[oIdx]}
                                  </span>
                                  <span>{opt}</span>
                                </div>
                                {badge}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // 2. Nếu là câu Tự Luận
                  const studentEssayText = inspectSubmission.essayAnswers?.[idx];
                  const studentEssayImg = inspectSubmission.essayImages?.[idx];

                  return (
                    <div
                      key={q.id || idx}
                      className="p-5 rounded-2xl border-2 border-purple-200 bg-purple-50/20 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-md">
                          Câu {idx + 1} (Tự luận - Tối đa {q.maxPoints ?? 3.0} điểm)
                        </span>

                        {/* Ô Giáo viên chấm điểm câu này */}
                        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-purple-200 shadow-xs">
                          <span className="text-xs font-bold text-slate-700">Điểm chấm:</span>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            max={q.maxPoints ?? 3.0}
                            value={tempEssayScores[idx] ?? 0}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setTempEssayScores((prev) => ({
                                ...prev,
                                [idx]: val
                              }));
                            }}
                            className="w-16 px-2 py-1 bg-purple-50 border border-purple-300 rounded-lg text-xs font-black text-purple-800 text-center"
                          />
                          <span className="text-xs text-slate-400">/ {q.maxPoints ?? 3.0}đ</span>
                        </div>
                      </div>

                      <p className="text-sm font-bold text-slate-900 whitespace-pre-line">
                        {q.question}
                      </p>

                      {/* Bài làm của học sinh */}
                      <div className="space-y-1.5 bg-white p-4 rounded-xl border border-purple-100 shadow-inner">
                        <p className="text-xs font-bold text-purple-900">
                          ✍ Bài làm của học sinh:
                        </p>
                        <p className="text-xs font-medium text-slate-800 whitespace-pre-line leading-relaxed">
                          {studentEssayText || '(Học sinh không nhập nội dung tự luận)'}
                        </p>

                        {/* Ảnh bài làm tự luận của học sinh nếu có */}
                        {studentEssayImg && (
                          <div className="pt-2">
                            <p className="text-xs font-bold text-purple-800 mb-1">
                              📷 Ảnh đính kèm của học sinh:
                            </p>
                            <img
                              src={studentEssayImg}
                              alt="Ảnh bài làm"
                              className="max-h-48 rounded-xl object-contain border border-slate-200 cursor-pointer"
                              onClick={() => setEnlargedImage(studentEssayImg)}
                            />
                          </div>
                        )}
                      </div>

                      {/* Đáp án mẫu & Biểu điểm */}
                      {q.sampleAnswer && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                          <p className="font-bold">💡 Hướng dẫn chấm / Đáp án chuẩn của GV:</p>
                          <p className="whitespace-pre-line">{q.sampleAnswer}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-400 text-sm">
                  Không tìm thấy đề kiểm tra gốc.
                </div>
              )}

              {/* Nhận xét của Giáo viên */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Lời nhận xét & Góp ý của Giáo Viên dành cho học sinh:</span>
                </label>
                <textarea
                  rows={2}
                  value={tempFeedback}
                  onChange={(e) => setTempFeedback(e.target.value)}
                  placeholder="Ví dụ: Em đã nắm chắc kiến thức trắc nghiệm, phần tự luận cần giải thích chi tiết hơn..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            {/* Footer Modal: Nút Lưu Điểm */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectSubmission(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Đóng
                </button>
                <button
                  onClick={() =>
                    setDeleteModal({
                      isOpen: true,
                      type: 'single',
                      subId: inspectSubmission.id,
                      studentName: inspectSubmission.studentName
                    })
                  }
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-red-200"
                  title="Xóa vĩnh viễn bài làm này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa Bài Này</span>
                </button>
              </div>

              <button
                onClick={handleSaveGrading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md shadow-indigo-100 transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Điểm Chấm & Nhận Xét</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA BÀI NỘP AN TOÀN TRÊN GIAO DIỆN (KHÔNG DÙNG WINDOW.CONFIRM) */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {deleteModal.type === 'single'
                    ? 'Xác nhận xóa bài làm'
                    : deleteModal.type === 'multiple'
                    ? 'Xóa nhiều bài làm đã chọn'
                    : 'Xóa toàn bộ bài làm'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Hành động này không thể hoàn tác sau khi thực hiện
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-red-50/70 border border-red-200/80 rounded-2xl text-xs text-red-800 space-y-1">
              {deleteModal.type === 'single' && (
                <p>
                  Thầy/Cô có chắc chắn muốn xóa vĩnh viễn bài làm của học sinh{' '}
                  <strong className="font-extrabold text-red-900">
                    "{deleteModal.studentName}"
                  </strong>{' '}
                  khỏi hệ thống?
                </p>
              )}
              {deleteModal.type === 'multiple' && (
                <p>
                  Thầy/Cô có chắc chắn muốn xóa vĩnh viễn{' '}
                  <strong className="font-extrabold text-red-900">
                    {deleteModal.count || selectedCount} bài làm đã chọn
                  </strong>{' '}
                  khỏi hệ thống?
                </p>
              )}
              {deleteModal.type === 'all' && (
                <p>
                  <strong className="font-extrabold text-red-900">CẢNH BÁO NGUY HIỂM:</strong> Toàn bộ{' '}
                  <strong className="font-extrabold text-red-900">
                    {submissions.length} bài làm của tất cả học sinh
                  </strong>{' '}
                  sẽ bị xóa sạch hoàn toàn khỏi bộ nhớ máy và Cloud!
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, type: 'single' })}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs shadow-md shadow-red-200 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác Nhận Xóa Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
