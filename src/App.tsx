import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StudentView } from './components/student/StudentView';
import { ExamTaking } from './components/student/ExamTaking';
import { ExamResult } from './components/student/ExamResult';
import { ProfileModal } from './components/student/ProfileModal';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { TeacherLoginModal } from './components/teacher/TeacherLoginModal';
import { CloudSetupGuide } from './components/teacher/CloudSetupGuide';
import {
  loadExamsFromCloud,
  loadSubmissionsFromCloud,
  saveExamToCloud,
  submitExamToCloud,
  listenSubmissionsFromCloud,
  deleteSubmission,
  deleteMultipleSubmissions,
  deleteSubmissionLocal,
  deleteAllSubmissionsFromStorage,
  deleteExamFromStorage,
  deleteMultipleExamsFromStorage,
  deleteAllExamsFromStorage,
  getIsCloudConnected
} from './services/storage';
import { isTeacherLoggedIn, logoutTeacher } from './services/teacherAuth';
import { Exam, Submission, StudentProfile } from './types';
import { GraduationCap, Download, ShieldCheck } from 'lucide-react';
import { generateStandaloneHtml } from './services/standaloneGenerator';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'student' | 'teacher' | 'guide'>('student');
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
  const [isTakingExam, setIsTakingExam] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTeacherLoginOpen, setIsTeacherLoginOpen] = useState(false);

  // Thông tin học sinh từ LocalStorage
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => {
    return {
      name: localStorage.getItem('edtech_student_name') || '',
      studentClass: localStorage.getItem('edtech_student_class') || ''
    };
  });

  const isCloudConnected = getIsCloudConnected();

  // Tải dữ liệu ban đầu và lắng nghe real-time
  const refreshAllData = async () => {
    const loadedExams = await loadExamsFromCloud();
    setExams(loadedExams);
    const loadedSubs = await loadSubmissionsFromCloud();
    setSubmissions(loadedSubs);
  };

  useEffect(() => {
    refreshAllData();

    // Lắng nghe bài nộp theo thời gian thực
    const unsubscribe = listenSubmissionsFromCloud((updatedSubs) => {
      setSubmissions(updatedSubs);
    });

    // Nếu học sinh chưa có tên, mở modal nhập họ tên
    if (!studentProfile.name || !studentProfile.studentClass) {
      const timer = setTimeout(() => {
        setIsProfileModalOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Xử lý chuyển tab có xác thực giáo viên
  const handleSelectTab = (tab: 'student' | 'teacher' | 'guide') => {
    if (tab === 'teacher') {
      // BẮT BUỘC: Kiểm tra ID & Password giáo viên
      if (!isTeacherLoggedIn()) {
        setIsTeacherLoginOpen(true);
        return;
      }
    }
    setIsTakingExam(false);
    setActiveSubmission(null);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Đăng nhập giáo viên thành công
  const handleTeacherLoginSuccess = () => {
    setIsTeacherLoginOpen(false);
    setIsTakingExam(false);
    setActiveSubmission(null);
    setCurrentTab('teacher');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Giáo viên đăng xuất
  const handleTeacherLogout = () => {
    logoutTeacher();
    setCurrentTab('student');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Lưu thông tin học sinh
  const handleSaveProfile = (profile: StudentProfile) => {
    setStudentProfile(profile);
    localStorage.setItem('edtech_student_name', profile.name);
    localStorage.setItem('edtech_student_class', profile.studentClass);
  };

  // Bắt đầu làm bài
  const handleStartExam = (exam: Exam) => {
    if (!studentProfile.name || !studentProfile.studentClass) {
      setIsProfileModalOpen(true);
      return;
    }
    setActiveExam(exam);
    setActiveSubmission(null);
    setIsTakingExam(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Nộp bài thi
  const handleSubmitExam = async (submission: Submission) => {
    await submitExamToCloud(submission);
    setActiveSubmission(submission);
    setIsTakingExam(false);
    refreshAllData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Xem lại bài thi đã nộp
  const handleReviewExam = (exam: Exam, submission: Submission) => {
    setActiveExam(exam);
    setActiveSubmission(submission);
    setIsTakingExam(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Giáo viên đăng đề mới
  const handlePublishExam = async (newExam: Exam) => {
    const res = await saveExamToCloud(newExam);
    await refreshAllData();
    return res;
  };

  // Giáo viên cập nhật điểm tự luận & nhận xét bài nộp
  const handleUpdateSubmission = async (updatedSub: Submission) => {
    await submitExamToCloud(updatedSub);
    await refreshAllData();
  };

  // Giáo viên xóa 1 bài nộp
  const handleDeleteSubmission = async (id: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    await deleteSubmission(id);
    await refreshAllData();
  };

  // Giáo viên xóa nhiều bài nộp cùng lúc
  const handleDeleteMultipleSubmissions = async (ids: string[]) => {
    setSubmissions((prev) => prev.filter((s) => !ids.includes(s.id)));
    await deleteMultipleSubmissions(ids);
    await refreshAllData();
  };

  // Giáo viên xóa 1 đề kiểm tra
  const handleDeleteExam = async (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    await deleteExamFromStorage(id);
    await refreshAllData();
  };

  // Giáo viên xóa nhiều đề kiểm tra cùng lúc
  const handleDeleteMultipleExams = async (ids: string[]) => {
    setExams((prev) => prev.filter((e) => !ids.includes(e.id)));
    await deleteMultipleExamsFromStorage(ids);
    await refreshAllData();
  };

  // Giáo viên xóa toàn bộ đề kiểm tra
  const handleDeleteAllExams = async () => {
    setExams([]);
    await deleteAllExamsFromStorage();
    await refreshAllData();
  };

  // Giáo viên xóa toàn bộ bài nộp
  const handleDeleteAllSubmissions = async () => {
    setSubmissions([]);
    await deleteAllSubmissionsFromStorage();
    await refreshAllData();
  };

  // 1-Click Tải file index.html từ footer
  const handleQuickDownloadHtml = () => {
    const htmlContent = generateStandaloneHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'index.html');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* THANH ĐIỀU HƯỚNG CHÍNH */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        studentProfile={studentProfile}
        onEditProfile={() => setIsProfileModalOpen(true)}
        isCloudConnected={isCloudConnected}
        onOpenCloudSettings={() => setCurrentTab('guide')}
      />

      {/* NỘI DUNG CHÍNH */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* 1. MÀN HÌNH ĐANG LÀM BÀI */}
        {isTakingExam && activeExam && (
          <ExamTaking
            exam={activeExam}
            studentProfile={studentProfile}
            onSubmit={handleSubmitExam}
            onExit={() => setIsTakingExam(false)}
          />
        )}

        {/* 2. MÀN HÌNH KẾT QUẢ / XEM LẠI BÀI */}
        {!isTakingExam && activeSubmission && activeExam && (
          <ExamResult
            exam={activeExam}
            submission={activeSubmission}
            onRetake={() => handleStartExam(activeExam)}
            onBackToList={() => {
              setActiveSubmission(null);
              setActiveExam(null);
            }}
          />
        )}

        {/* 3. MÀN HÌNH DANH SÁCH BÀI HỌC SINH */}
        {!isTakingExam && !activeSubmission && currentTab === 'student' && (
          <StudentView
            exams={exams}
            submissions={submissions}
            studentProfile={studentProfile}
            onStartExam={handleStartExam}
            onReviewExam={handleReviewExam}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
            onRefresh={refreshAllData}
          />
        )}

        {/* 4. MÀN HÌNH GIÁO VIÊN */}
        {!isTakingExam && !activeSubmission && currentTab === 'teacher' && (
          <TeacherDashboard
            exams={exams}
            submissions={submissions}
            onPublishExam={handlePublishExam}
            onDeleteSubmission={handleDeleteSubmission}
            onDeleteMultipleSubmissions={handleDeleteMultipleSubmissions}
            onUpdateSubmission={handleUpdateSubmission}
            onDeleteExam={handleDeleteExam}
            onDeleteMultipleExams={handleDeleteMultipleExams}
            onDeleteAllExams={handleDeleteAllExams}
            onDeleteAllSubmissions={handleDeleteAllSubmissions}
            onRefreshData={refreshAllData}
            onLogout={handleTeacherLogout}
          />
        )}

        {/* 5. MÀN HÌNH HƯỚNG DẪN & TẢI FILE */}
        {!isTakingExam && !activeSubmission && currentTab === 'guide' && (
          <CloudSetupGuide onConfigUpdated={refreshAllData} />
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-medium">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <span className="font-extrabold text-slate-800">EdTech ExamHub THCS</span>
            <span>- Dành cho Giáo viên & Học sinh Tin học Khối 6, 7, 8, 9</span>
          </div>

          <div className="flex items-center gap-4 font-semibold">
            <button
              onClick={() => setCurrentTab('guide')}
              className="text-indigo-600 hover:text-indigo-700 transition"
            >
              Cài đặt Firebase
            </button>
            <span>•</span>
            <button
              onClick={handleQuickDownloadHtml}
              className="text-emerald-600 hover:text-emerald-700 font-bold transition flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file index.html</span>
            </button>
            <span>•</span>
            <button
              onClick={() => handleSelectTab('teacher')}
              className="text-slate-600 hover:text-slate-900 transition flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Khu vực Giáo Viên (Cần ID/Mật khẩu)</span>
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL NHẬP HỌ TÊN & LỚP CỦA HỌC SINH */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        initialProfile={studentProfile}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
      />

      {/* MODAL XÁC THỰC GIÁO VIÊN BẢO MẬT (ID & PASSWORD) */}
      <TeacherLoginModal
        isOpen={isTeacherLoginOpen}
        onSuccess={handleTeacherLoginSuccess}
        onCancel={() => setIsTeacherLoginOpen(false)}
      />
    </div>
  );
}
