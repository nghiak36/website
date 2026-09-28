import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  Lock,
  ArrowLeft,
  HelpCircle,
  Image as ImageIcon,
  Upload,
  X,
  FileText,
  ZoomIn
} from 'lucide-react';
import { Exam, StudentProfile, Submission } from '../../types';

interface ExamTakingProps {
  exam: Exam;
  studentProfile: StudentProfile;
  onSubmit: (submission: Submission) => void;
  onExit: () => void;
}

export const ExamTaking: React.FC<ExamTakingProps> = ({
  exam,
  studentProfile,
  onSubmit,
  onExit
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [essayAnswers, setEssayAnswers] = useState<Record<number, string>>({});
  const [essayImages, setEssayImages] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(exam.durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTimeOutLocked, setIsTimeOutLocked] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<any>(null);

  // Tính điểm và gửi bài
  const handleFinalSubmit = useCallback(
    (isAutoTimeout = false) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      if (isAutoTimeout) {
        setIsTimeOutLocked(true);
      }

      clearInterval(timerRef.current);

      // Chấm điểm trắc nghiệm tự động
      let mcCorrect = 0;
      let mcTotal = 0;
      let essayTotal = 0;
      let autoScore = 0;

      exam.questions.forEach((q, idx) => {
        const questionPoints = Number(q.points) || Math.round((10.0 / exam.questions.length) * 10) / 10;
        if (q.type === 'multiple_choice') {
          mcTotal++;
          if (answers[idx] === q.correctAnswer) {
            mcCorrect++;
            autoScore += questionPoints;
          }
        } else {
          essayTotal++;
        }
      });

      // Giới hạn tối đa 10.0 điểm
      autoScore = Math.min(10.0, Math.round(autoScore * 10) / 10);

      const timeSpent = Math.min(
        exam.durationMinutes * 60,
        Math.floor((Date.now() - startTimeRef.current) / 1000)
      );

      const submission: Submission = {
        id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        examId: exam.id,
        examTitle: exam.title,
        grade: exam.grade,
        studentName: studentProfile.name,
        studentClass: studentProfile.studentClass,
        submittedAt: new Date().toISOString(),
        timeSpentSeconds: timeSpent,
        score: autoScore, // Điểm hiện tại từ trắc nghiệm, giáo viên sẽ cộng thêm tự luận
        autoScore: autoScore,
        essayScore: 0,
        correctCount: mcCorrect,
        totalQuestions: exam.questions.length,
        answers,
        essayAnswers,
        essayImages,
        isGraded: essayTotal === 0 // Nếu không có tự luận thì coi như đã chấm xong
      };

      setTimeout(() => {
        onSubmit(submission);
      }, isAutoTimeout ? 1200 : 300);
    },
    [answers, essayAnswers, essayImages, exam, isSubmitting, onSubmit, studentProfile]
  );

  // Đếm ngược thời gian
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [handleFinalSubmit]);

  // Phím tắt bàn phím (1, 2, 3, 4 hoặc A, B, C, D) cho câu trắc nghiệm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting || isTimeOutLocked) return;

      // Không bắt phím tắt khi đang gõ bài tự luận
      if (
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'INPUT'
      ) {
        return;
      }

      const q = exam.questions[currentQuestionIndex];
      if (q && q.type === 'multiple_choice') {
        const key = e.key.toUpperCase();
        let chosenOpt = -1;
        if (key === '1' || key === 'A') chosenOpt = 0;
        else if (key === '2' || key === 'B') chosenOpt = 1;
        else if (key === '3' || key === 'C') chosenOpt = 2;
        else if (key === '4' || key === 'D') chosenOpt = 3;

        if (chosenOpt !== -1) {
          setAnswers((prev) => ({
            ...prev,
            [currentQuestionIndex]: chosenOpt
          }));
        }
      }

      if (e.key === 'ArrowRight' && currentQuestionIndex < exam.questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
        setCurrentQuestionIndex((prev) => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIndex, exam.questions, isSubmitting, isTimeOutLocked]);

  const currentQ = exam.questions[currentQuestionIndex];
  const optionLetters = ['A', 'B', 'C', 'D'];
  const totalCount = exam.questions.length;

  // Tính số câu đã hoàn thành (cả trắc nghiệm và tự luận)
  let answeredCount = 0;
  exam.questions.forEach((q, idx) => {
    if (q.type === 'multiple_choice' && answers[idx] !== undefined) {
      answeredCount++;
    } else if (
      q.type === 'essay' &&
      ((essayAnswers[idx] && essayAnswers[idx].trim().length > 0) || essayImages[idx])
    ) {
      answeredCount++;
    }
  });

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const isWarningTime = remainingSeconds <= 60;
  const isDangerTime = remainingSeconds <= 30;

  const toggleFlag = (index: number) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Upload ảnh bài làm tự luận của học sinh
  const handleStudentUploadEssayImage = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setEssayImages((prev) => ({
        ...prev,
        [currentQuestionIndex]: base64
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative min-h-[80vh] flex flex-col space-y-6">
      {/* KHÓA MÀN HÌNH KHI HẾT GIỜ */}
      {isTimeOutLocked && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto animate-bounce">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">HẾT GIỜ LÀM BÀI!</h3>
            <p className="text-sm text-slate-600">
              Hệ thống đã khóa màn hình làm bài, đang tự động nộp bài về cho Thầy/Cô...
            </p>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full w-full animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* MODAL PHÓNG TO ẢNH */}
      {enlargedImage && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={enlargedImage}
              alt="Phóng to ảnh câu hỏi"
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

      {/* TOP HEADER: THÔNG TIN BÀI THI & ĐỒNG HỒ ĐẾM NGƯỢC */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-16 z-30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
            title="Thoát bài thi"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                {exam.grade}
              </span>
              <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                Tổng: 10.0 điểm
              </span>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-tight">
                {exam.title}
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Học sinh: <strong className="text-slate-800">{studentProfile.name}</strong> • Lớp:{' '}
              <strong className="text-indigo-600">{studentProfile.studentClass}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-black transition-all shadow-inner border ${
              isDangerTime
                ? 'bg-red-500 text-white border-red-600 animate-pulse'
                : isWarningTime
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}
          >
            <Clock className={`w-5 h-5 ${isDangerTime ? 'text-white' : 'text-indigo-600'}`} />
            <span>{formattedTime}</span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-100 transition-all flex items-center gap-2 text-sm active:scale-95 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Nộp Bài</span>
          </button>
        </div>
      </div>

      {/* CẢNH BÁO SẮP HẾT GIỜ */}
      {isWarningTime && (
        <div className="bg-amber-500 text-white px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 animate-bounce">
          <AlertTriangle className="w-4 h-4" />
          <span>Chú ý: Còn dưới 1 phút! Hệ thống sẽ tự động khóa và nộp bài khi hết giờ.</span>
        </div>
      )}

      {/* VÙNG LÀM BÀI CHÍNH */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Cột 1: Câu Hỏi Chi Tiết */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header Câu Hỏi */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-xs font-black px-3.5 py-1 rounded-xl ${
                    currentQ.type === 'essay'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  }`}
                >
                  Câu {currentQuestionIndex + 1} / {totalCount}:{' '}
                  {currentQ.type === 'essay' ? 'Tự Luận' : 'Trắc Nghiệm'}
                </span>
                <span className="text-xs font-black px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {(Number(currentQ.points) || Math.round((10.0 / totalCount) * 10) / 10).toFixed(1)} điểm
                </span>
                {currentQ.type === 'multiple_choice' && (
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    (Phím 1,2,3,4 hoặc A,B,C,D)
                  </span>
                )}
              </div>

              <button
                onClick={() => toggleFlag(currentQuestionIndex)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  flaggedQuestions[currentQuestionIndex]
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <Bookmark
                  className={`w-3.5 h-3.5 ${
                    flaggedQuestions[currentQuestionIndex] ? 'fill-amber-600 text-amber-600' : ''
                  }`}
                />
                <span>
                  {flaggedQuestions[currentQuestionIndex] ? 'Đã đánh dấu cờ' : 'Đánh dấu xem lại'}
                </span>
              </button>
            </div>

            {/* Nội dung câu hỏi */}
            <div className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed whitespace-pre-line">
                {currentQ.question}
              </h2>

              {/* HÌNH ẢNH CỦA CÂU HỎI NẾU CÓ */}
              {currentQ.imageUrl && (
                <div className="pt-2">
                  <div className="relative inline-block border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 shadow-xs group">
                    <img
                      src={currentQ.imageUrl}
                      alt="Hình ảnh câu hỏi"
                      className="max-h-72 max-w-full rounded-2xl object-contain cursor-zoom-in"
                      onClick={() => setEnlargedImage(currentQ.imageUrl || null)}
                    />
                    <button
                      type="button"
                      onClick={() => setEnlargedImage(currentQ.imageUrl || null)}
                      className="absolute bottom-2 right-2 px-2.5 py-1 bg-slate-900/70 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold backdrop-blur-xs flex items-center gap-1 transition"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Phóng to</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* TRƯỜNG HỢP A: CÂU TRẮC NGHIỆM */}
            {currentQ.type === 'multiple_choice' && currentQ.options && (
              <div className="space-y-3 pt-2">
                {currentQ.options.map((option, optIdx) => {
                  const isSelected = answers[currentQuestionIndex] === optIdx;

                  return (
                    <div
                      key={optIdx}
                      onClick={() => {
                        if (isSubmitting || isTimeOutLocked) return;
                        setAnswers((prev) => ({
                          ...prev,
                          [currentQuestionIndex]: optIdx
                        }));
                      }}
                      className={`group flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl font-extrabold text-sm flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                        }`}
                      >
                        {optionLetters[optIdx]}
                      </div>
                      <div className="flex-1 pt-1 text-sm sm:text-base font-medium text-slate-800 leading-relaxed">
                        {option}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TRƯỜNG HỢP B: CÂU TỰ LUẬN */}
            {currentQ.type === 'essay' && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Nhập câu trả lời / bài làm tự luận của em vào khung dưới đây:</span>
                    <span className="text-xs font-mono text-slate-400">
                      {essayAnswers[currentQuestionIndex]?.length || 0} ký tự
                    </span>
                  </label>
                  <textarea
                    rows={7}
                    value={essayAnswers[currentQuestionIndex] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEssayAnswers((prev) => ({
                        ...prev,
                        [currentQuestionIndex]: val
                      }));
                    }}
                    placeholder="Gõ câu trả lời của em, giải thích các bước hoặc viết code tại đây..."
                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>

                {/* Phần đính kèm ảnh bài làm viết tay */}
                <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Đính kèm ảnh bài làm viết tay (nếu có):</span>
                    </span>

                    <label className="text-xs font-bold px-3 py-1 bg-white hover:bg-purple-100 text-purple-700 rounded-xl border border-purple-200 cursor-pointer transition flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Tải ảnh lên</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleStudentUploadEssayImage(f);
                        }}
                      />
                    </label>
                  </div>

                  {essayImages[currentQuestionIndex] && (
                    <div className="relative inline-block border border-purple-200 rounded-xl overflow-hidden mt-2">
                      <img
                        src={essayImages[currentQuestionIndex]}
                        alt="Ảnh bài làm tự luận"
                        className="max-h-40 rounded-lg object-contain bg-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEssayImages((prev) => {
                            const c = { ...prev };
                            delete c[currentQuestionIndex];
                            return c;
                          })
                        }
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Điều hướng Trước / Sau */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition flex items-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu Trước</span>
              </button>

              <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
                {currentQ.type === 'multiple_choice'
                  ? answers[currentQuestionIndex] !== undefined
                    ? 'Đã chọn đáp án'
                    : 'Chưa chọn đáp án'
                  : essayAnswers[currentQuestionIndex]
                  ? 'Đã nhập câu trả lời'
                  : 'Chưa nhập câu trả lời'}
              </span>

              {currentQuestionIndex < totalCount - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition flex items-center gap-2 shadow-xs"
                >
                  <span>Câu Kế Tiếp</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition flex items-center gap-2 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>Hoàn Thành & Nộp</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cột 2: Bảng Điều Khiển Nhanh Câu Hỏi (Palette) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs sticky top-36 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Bảng Tiến Độ</h4>
                <p className="text-xs text-slate-400">Nhấp số câu để nhảy đến</p>
              </div>
              <span className="text-xs font-black px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                {answeredCount} / {totalCount}
              </span>
            </div>

            {/* Grid các số câu */}
            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((q, idx) => {
                const isAnswered =
                  q.type === 'multiple_choice'
                    ? answers[idx] !== undefined
                    : (essayAnswers[idx] && essayAnswers[idx].trim().length > 0) || essayImages[idx];
                const isCurrent = currentQuestionIndex === idx;
                const isFlagged = flaggedQuestions[idx];

                let btnClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200';
                if (isCurrent) {
                  btnClass = 'ring-2 ring-indigo-600 font-black ';
                }
                if (isAnswered) {
                  btnClass +=
                    q.type === 'essay'
                      ? ' bg-purple-600 text-white shadow-xs'
                      : ' bg-indigo-600 text-white shadow-xs';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`relative w-full aspect-square rounded-xl text-xs font-bold transition flex flex-col items-center justify-center ${btnClass}`}
                  >
                    <span>{idx + 1}</span>
                    {q.type === 'essay' && (
                      <span className="text-[9px] leading-none opacity-80">TL</span>
                    )}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Chú thích màu */}
            <div className="text-xs text-slate-500 space-y-2 pt-3 border-t border-slate-100 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-indigo-600" />
                <span>Trắc nghiệm đã làm</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-purple-600" />
                <span>Tự luận đã nhập</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-slate-100 border border-slate-300" />
                <span>Chưa trả lời</span>
              </div>
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Nộp bài ngay</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL XÁC NHẬN NỘP BÀI */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <HelpCircle className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Xác Nhận Nộp Bài Thi</h3>
              <p className="text-xs text-slate-500">
                Bài làm của bạn sẽ được gửi trực tuyến về hệ thống quản lý của Giáo viên.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs font-semibold text-slate-700">
              <div className="flex justify-between">
                <span>Số câu đã hoàn thành:</span>
                <span className="text-indigo-600 font-bold">
                  {answeredCount} / {totalCount} câu
                </span>
              </div>
              <div className="flex justify-between">
                <span>Số câu chưa làm:</span>
                <span
                  className={
                    totalCount - answeredCount > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600'
                  }
                >
                  {totalCount - answeredCount} câu
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition"
              >
                Làm tiếp
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  handleFinalSubmit(false);
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-indigo-100"
              >
                Xác nhận nộp bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN THOÁT */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <h4 className="font-bold text-slate-900 text-lg">Bạn có muốn rời khỏi bài thi?</h4>
            <p className="text-xs text-slate-500">
              Kết quả làm bài sẽ không được lưu nếu bạn thoát ra giữa chừng.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Tiếp tục làm
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs"
              >
                Thoát bài thi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
