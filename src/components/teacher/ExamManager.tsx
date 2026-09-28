import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Copy,
  Clock,
  HelpCircle,
  Calendar,
  Search,
  Filter,
  GraduationCap,
  Sparkles,
  Layers,
  FileText,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';
import { Exam, GradeLevel } from '../../types';

interface ExamManagerProps {
  exams: Exam[];
  onCreateNew: () => void;
  onEditExam: (exam: Exam) => void;
  onDeleteExam: (id: string) => void;
  onDeleteMultipleExams?: (ids: string[]) => void;
  onDuplicateExam: (exam: Exam) => void;
  onDeleteAllExams?: () => void;
}

export const ExamManager: React.FC<ExamManagerProps> = ({
  exams,
  onCreateNew,
  onEditExam,
  onDeleteExam,
  onDeleteMultipleExams,
  onDuplicateExam,
  onDeleteAllExams
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<'all' | GradeLevel>('all');

  // Khung check chọn nhiều đề thi
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);

  // Modal xác nhận xóa an toàn không dùng window.confirm
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'multiple' | 'all';
    examId?: string;
    examTitle?: string;
    count?: number;
  }>({ isOpen: false, type: 'single' });

  const filteredExams = exams.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchGrade = selectedGrade === 'all' || e.grade === selectedGrade;
    return matchSearch && matchGrade;
  });

  const filteredExamIds = filteredExams.map((e) => e.id);
  const isAllFilteredSelected =
    filteredExamIds.length > 0 && filteredExamIds.every((id) => selectedExamIds.includes(id));
  const selectedCount = selectedExamIds.length;

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedExamIds((prev) => prev.filter((id) => !filteredExamIds.includes(id)));
    } else {
      setSelectedExamIds((prev) => Array.from(new Set([...prev, ...filteredExamIds])));
    }
  };

  const handleToggleSelectOne = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedExamIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedExamIds([]);
  };

  const handleExecuteDelete = () => {
    if (deleteModal.type === 'single' && deleteModal.examId) {
      onDeleteExam(deleteModal.examId);
      setSelectedExamIds((prev) => prev.filter((id) => id !== deleteModal.examId));
    } else if (deleteModal.type === 'multiple') {
      if (onDeleteMultipleExams) {
        onDeleteMultipleExams(selectedExamIds);
      } else {
        selectedExamIds.forEach((id) => onDeleteExam(id));
      }
      setSelectedExamIds([]);
    } else if (deleteModal.type === 'all') {
      if (onDeleteAllExams) {
        onDeleteAllExams();
      }
      setSelectedExamIds([]);
    }
    setDeleteModal({ isOpen: false, type: 'single' });
  };

  return (
    <div className="space-y-6">
      {/* Header và Nút Tạo Đề Mới */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span>Quản Lý Đề Kiểm Tra Đã Tạo ({exams.length} đề)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Thầy/Cô có thể chọn khung check để xóa nhiều đề cùng lúc, thêm mới, chỉnh sửa nội dung hoặc xóa các đề kiểm tra.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {exams.length > 0 && onDeleteAllExams && (
            <button
              onClick={() =>
                setDeleteModal({
                  isOpen: true,
                  type: 'all',
                  count: exams.length
                })
              }
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-2xl text-xs transition flex items-center gap-1.5 border border-red-200"
              title="Xóa sạch toàn bộ đề thi đã tạo"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa Hết Đề Thi</span>
            </button>
          )}

          <button
            onClick={onCreateNew}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-sm transition flex items-center gap-2 shadow-md shadow-indigo-100 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Soạn Đề Kiểm Tra Mới</span>
          </button>
        </div>
      </div>

      {/* Thanh Thao Tác Chọn Nhiều Đề Thi (Khung Check) */}
      {selectedCount > 0 && (
        <div className="bg-indigo-900 text-white rounded-2xl p-3.5 sm:p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-black">
              <CheckSquare className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <span className="text-sm font-black">Đã chọn {selectedCount} đề kiểm tra</span>
              <span className="text-xs text-indigo-200 ml-2 hidden sm:inline">
                (trên tổng số {filteredExams.length} đề đang hiển thị)
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
              <span>Xóa {selectedCount} Đề Đã Chọn</span>
            </button>
          </div>
        </div>
      )}

      {/* Bộ Lọc & Tìm Kiếm */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên đề kiểm tra..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['all', 'Khối 6', 'Khối 7', 'Khối 8', 'Khối 9'] as ('all' | GradeLevel)[]).map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGrade(g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                selectedGrade === g
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {g === 'all' ? 'Tất cả' : g}
            </button>
          ))}
        </div>
      </div>

      {/* Bảng Danh Sách Đề Thi */}
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
                    title={isAllFilteredSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả đề đang hiển thị'}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-3 w-12 text-center">STT</th>
                <th className="py-3.5 px-4">Tên Đề Kiểm Tra</th>
                <th className="py-3.5 px-4">Khối Lớp</th>
                <th className="py-3.5 px-4 text-center">Thời Gian</th>
                <th className="py-3.5 px-4 text-center">Số Câu</th>
                <th className="py-3.5 px-4 text-center">Tổng Điểm</th>
                <th className="py-3.5 px-4">Ngày Tạo</th>
                <th className="py-3.5 px-4 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Chưa có đề kiểm tra nào trong danh mục này. Hãy bấm vào nút <strong>"+ Soạn Đề Kiểm Tra Mới"</strong> ở trên để tạo đề thi đầu tiên!
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam, idx) => {
                  const mcCount = exam.questions.filter((q) => q.type === 'multiple_choice').length;
                  const essayCount = exam.questions.filter((q) => q.type === 'essay').length;
                  const totalPts = exam.questions.reduce((acc, q) => acc + (q.points || 0), 0);
                  const isChecked = selectedExamIds.includes(exam.id);

                  return (
                    <tr
                      key={exam.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-indigo-50/50 font-medium' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectOne(exam.id)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-3 text-center text-xs font-semibold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 leading-snug">{exam.title}</div>
                        {exam.description && (
                          <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{exam.description}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-xs border border-indigo-100">
                          {exam.grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs font-bold text-slate-700">
                        {exam.durationMinutes} phút
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs">
                        <span className="font-bold text-slate-800">{exam.questions.length} câu</span>
                        <div className="text-[10px] text-slate-400">
                          ({mcCount} TN • {essayCount} TL)
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {(totalPts || 10.0).toFixed(1)}đ
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {exam.createdAt ? new Date(exam.createdAt).toLocaleDateString('vi-VN') : 'Mới tạo'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Sửa đề */}
                          <button
                            onClick={() => onEditExam(exam)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition flex items-center gap-1"
                            title="Chỉnh sửa nội dung đề thi"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Sửa</span>
                          </button>

                          {/* Nhân bản đề */}
                          <button
                            onClick={() => onDuplicateExam(exam)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                            title="Nhân bản đề này"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Xóa đề */}
                          <button
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                type: 'single',
                                examId: exam.id,
                                examTitle: exam.title
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                            title="Xóa đề thi"
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

      {/* MODAL XÁC NHẬN XÓA ĐỀ THI AN TOÀN TRÊN GIAO DIỆN (KHÔNG DÙNG WINDOW.CONFIRM) */}
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
                    ? 'Xác nhận xóa đề kiểm tra'
                    : deleteModal.type === 'multiple'
                    ? 'Xóa nhiều đề kiểm tra đã chọn'
                    : 'Xóa tất cả đề kiểm tra'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Hành động này không thể hoàn tác sau khi thực hiện
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-red-50/70 border border-red-200/80 rounded-2xl text-xs text-red-800 space-y-1">
              {deleteModal.type === 'single' && (
                <p>
                  Thầy/Cô có chắc chắn muốn xóa vĩnh viễn đề kiểm tra{' '}
                  <strong className="font-extrabold text-red-900">
                    "{deleteModal.examTitle}"
                  </strong>{' '}
                  khỏi hệ thống?
                </p>
              )}
              {deleteModal.type === 'multiple' && (
                <p>
                  Thầy/Cô có chắc chắn muốn xóa vĩnh viễn{' '}
                  <strong className="font-extrabold text-red-900">
                    {deleteModal.count || selectedCount} đề kiểm tra đã chọn
                  </strong>{' '}
                  khỏi hệ thống?
                </p>
              )}
              {deleteModal.type === 'all' && (
                <p>
                  <strong className="font-extrabold text-red-900">CẢNH BÁO NGUY HIỂM:</strong> Toàn bộ{' '}
                  <strong className="font-extrabold text-red-900">
                    {exams.length} đề kiểm tra đã tạo
                  </strong>{' '}
                  sẽ bị xóa sạch hoàn toàn khỏi hệ thống!
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
