import React, { useState } from 'react';
import {
  FileText,
  CheckCheck,
  Star,
  Award,
  PlusCircle,
  FileSpreadsheet,
  Settings,
  Users,
  Layers,
  ChevronRight,
  LogOut,
  GraduationCap,
  BookOpen,
  KeyRound,
  ShieldCheck,
  Check,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { Exam, Submission } from '../../types';
import { ExamManager } from './ExamManager';
import { SubmissionsList } from './SubmissionsList';
import { ExamCreator } from './ExamCreator';
import { ExportSection } from './ExportSection';
import { CloudSetupGuide } from './CloudSetupGuide';
import { getTeacherAccount, updateTeacherCredentials } from '../../services/teacherAuth';

interface TeacherDashboardProps {
  exams: Exam[];
  submissions: Submission[];
  onPublishExam: (exam: Exam) => Promise<{ success: boolean; cloudSynced: boolean; message: string }>;
  onDeleteSubmission: (id: string) => void;
  onDeleteMultipleSubmissions?: (ids: string[]) => void;
  onUpdateSubmission?: (submission: Submission) => void;
  onDeleteExam?: (id: string) => void;
  onDeleteMultipleExams?: (ids: string[]) => void;
  onDeleteAllExams?: () => void;
  onDeleteAllSubmissions?: () => void;
  onRefreshData: () => void;
  onLogout: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  exams,
  submissions,
  onPublishExam,
  onDeleteSubmission,
  onDeleteMultipleSubmissions,
  onUpdateSubmission,
  onDeleteExam,
  onDeleteMultipleExams,
  onDeleteAllExams,
  onDeleteAllSubmissions,
  onRefreshData,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'exams' | 'submissions' | 'create' | 'export' | 'cloud'>(
    exams.length === 0 ? 'exams' : 'submissions'
  );
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const teacherAcc = getTeacherAccount();

  // Modal đổi ID / Mật khẩu Giáo Viên
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newAdminUsername, setNewAdminUsername] = useState(teacherAcc.username);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateAdminAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newAdminPassword && newAdminPassword.length < 4) {
      setPasswordMsg({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 4 ký tự!' });
      return;
    }

    if (newAdminPassword && newAdminPassword !== confirmAdminPassword) {
      setPasswordMsg({ type: 'error', text: 'Mật khẩu xác nhận không trùng khớp!' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await updateTeacherCredentials(
        newAdminUsername,
        newAdminPassword || undefined
      );
      if (res.success) {
        setPasswordMsg({ type: 'success', text: res.message });
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordMsg(null);
          setNewAdminPassword('');
          setConfirmAdminPassword('');
        }, 1800);
      } else {
        setPasswordMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: 'Lỗi: ' + (err?.message || 'Không thể cập nhật') });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Tính các chỉ số thống kê
  const totalExams = exams.length;
  const totalSubmissions = submissions.length;

  const averageScore =
    totalSubmissions > 0
      ? (submissions.reduce((acc, s) => acc + s.score, 0) / totalSubmissions).toFixed(1)
      : '0.0';

  const passCount = submissions.filter((s) => s.score >= 5.0).length;
  const passRate = totalSubmissions > 0 ? Math.round((passCount / totalSubmissions) * 100) : 0;

  // Xử lý tạo mới
  const handleStartCreate = () => {
    setEditingExam(null);
    setActiveTab('create');
  };

  // Xử lý chỉnh sửa đề
  const handleStartEdit = (exam: Exam) => {
    setEditingExam(exam);
    setActiveTab('create');
  };

  // Xử lý nhân bản đề
  const handleDuplicateExam = async (exam: Exam) => {
    const newId = 'exam-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const duplicated: Exam = {
      ...exam,
      id: newId,
      title: `${exam.title} (Bản sao)`,
      createdAt: new Date().toISOString()
    };
    await onPublishExam(duplicated);
  };

  return (
    <div className="space-y-6">
      {/* Thanh Header Giáo Viên & Nút Đăng Xuất */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-100">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Bàn Làm Việc Giáo Viên Tin Học THCS
              </h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Đã bảo vệ ID/Mật khẩu
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Tài khoản: <strong className="text-slate-800">{teacherAcc.username}</strong> • Quản lý đề thi & bài tập Khối 6, 7, 8, 9
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => {
              setNewAdminUsername(teacherAcc.username);
              setNewAdminPassword('');
              setConfirmAdminPassword('');
              setPasswordMsg(null);
              setIsPasswordModalOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-2xl text-xs transition flex items-center gap-1.5 border border-indigo-200 cursor-pointer"
            title="Đổi ID hoặc mật khẩu quản trị của Giáo viên"
          >
            <KeyRound className="w-4 h-4" />
            <span>Đổi Mật Khẩu</span>
          </button>
          <button
            onClick={onLogout}
            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-2xl text-xs transition flex items-center gap-1.5 border border-red-200"
            title="Đăng xuất để khóa tab Giáo viên, tránh học sinh vào xem"
          >
            <LogOut className="w-4 h-4" />
            <span>Khóa / Đăng Xuất</span>
          </button>
        </div>
      </div>

      {/* 4 Thẻ Thống Kê Tổng Quan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('exams')}
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md hover:border-indigo-200 transition cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Đề Đã Tạo</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalExams}</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('submissions')}
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md hover:border-emerald-200 transition cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Bài Đã Nộp</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalSubmissions}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Điểm Trung Bình</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{averageScore}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Tỉ Lệ Đạt (≥ 5đ)</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{passRate}%</p>
          </div>
        </div>
      </div>

      {/* Thanh Menu Con */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => {
            setEditingExam(null);
            setActiveTab('exams');
          }}
          className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-2xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'exams'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Quản Lý Đề Kiểm Tra ({totalExams})</span>
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-2xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'submissions'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Danh Sách & Chấm Điểm ({totalSubmissions})</span>
        </button>

        <button
          onClick={handleStartCreate}
          className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-2xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'create'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>{editingExam ? 'Đang Sửa Đề Thi ✏️' : 'Soạn Đề Mới (Word / Ảnh / TL)'}</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-2xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'export'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Xuất Bảng Điểm (Excel)</span>
        </button>

        <button
          onClick={() => setActiveTab('cloud')}
          className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-2xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'cloud'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Cấu Hình Firebase & Hướng Dẫn</span>
        </button>
      </div>

      {/* Hiển thị Tab Tương Ứng */}
      {activeTab === 'exams' && (
        <ExamManager
          exams={exams}
          onCreateNew={handleStartCreate}
          onEditExam={handleStartEdit}
          onDeleteExam={(id) => onDeleteExam && onDeleteExam(id)}
          onDeleteMultipleExams={onDeleteMultipleExams}
          onDuplicateExam={handleDuplicateExam}
          onDeleteAllExams={onDeleteAllExams}
        />
      )}

      {activeTab === 'submissions' && (
        <SubmissionsList
          submissions={submissions}
          exams={exams}
          onDeleteSubmission={onDeleteSubmission}
          onDeleteMultipleSubmissions={onDeleteMultipleSubmissions}
          onUpdateSubmission={onUpdateSubmission}
          onExportCsv={() => setActiveTab('export')}
          onDeleteAllSubmissions={onDeleteAllSubmissions}
        />
      )}

      {activeTab === 'create' && (
        <ExamCreator
          editingExam={editingExam}
          onPublishExam={async (exam) => {
            const res = await onPublishExam(exam);
            if (res.success) {
              setEditingExam(null);
              setActiveTab('exams');
            }
            return res;
          }}
          onCancel={() => {
            setEditingExam(null);
            setActiveTab('exams');
          }}
        />
      )}

      {activeTab === 'export' && (
        <ExportSection submissions={submissions} exams={exams} />
      )}

      {activeTab === 'cloud' && (
        <CloudSetupGuide onConfigUpdated={onRefreshData} />
      )}

      {/* MODAL ĐỔI ID & MẬT KHẨU GIÁO VIÊN (ĐỒNG BỘ CLOUD) */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 border border-slate-100 relative">
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Đổi ID & Mật Khẩu Giáo Viên</h3>
                <p className="text-xs text-slate-500">Đồng bộ tự động lên Firebase Cloud</p>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-indigo-950 leading-relaxed">
              💡 <strong>Lưu ý:</strong> Khi Thầy/Cô đổi mật khẩu tại đây, hệ thống sẽ lưu vào máy và <strong>đồng bộ ngay lên Firebase Firestore</strong>. Khi mở bất kỳ máy tính, laptop hoặc điện thoại nào khác, Thầy/Cô chỉ cần nhập mật khẩu mới này là vào được ngay!
            </div>

            {passwordMsg && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateAdminAccount} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Tên đăng nhập (ID) *</label>
                <input
                  type="text"
                  required
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mật khẩu mới (Tối thiểu 4 ký tự) *</label>
                <div className="relative">
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    required
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Xác nhận lại mật khẩu mới *</label>
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  required
                  value={confirmAdminPassword}
                  onChange={(e) => setConfirmAdminPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs shadow-md shadow-indigo-100 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
                >
                  {isUpdatingPassword ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang lưu & Đồng bộ...</span>
                    </>
                  ) : (
                    <span>Lưu & Đồng Bộ Lên Cloud</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
