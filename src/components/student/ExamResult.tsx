import React, { useEffect, useState } from 'react';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ArrowLeft,
  Eye,
  Award,
  BookOpen,
  Share2,
  Check,
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Exam, Submission } from '../../types';

interface ExamResultProps {
  exam: Exam;
  submission: Submission;
  onRetake: () => void;
  onBackToList: () => void;
}

export const ExamResult: React.FC<ExamResultProps> = ({
  exam,
  submission,
  onRetake,
  onBackToList
}) => {
  const [showReview, setShowReview] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (submission.score >= 7.5) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }
    }
  }, [submission.score]);

  const optionLetters = ['A', 'B', 'C', 'D'];
  const wrongCount = submission.totalQuestions - submission.correctCount;
  const timeMins = Math.floor(submission.timeSpentSeconds / 60);
  const timeSecs = submission.timeSpentSeconds % 60;
  const timeFormatted = `${timeMins < 10 ? '0' : ''}${timeMins}:${timeSecs < 10 ? '0' : ''}${timeSecs}`;

  let scoreTitle = 'Đã Nộp Bài!';
  let scoreColorClass = 'text-indigo-600';
  let badgeColor = 'bg-indigo-100 text-indigo-800';

  if (submission.score >= 9) {
    scoreTitle = 'Xuất Sắc! Điểm Rất Cao 🎉';
    scoreColorClass = 'text-emerald-600';
    badgeColor = 'bg-emerald-100 text-emerald-800';
  } else if (submission.score >= 7.5) {
    scoreTitle = 'Khá Giỏi! Bạn Nắm Rất Chắc Kiến Thức 👏';
    scoreColorClass = 'text-indigo-600';
    badgeColor = 'bg-indigo-100 text-indigo-800';
  } else if (submission.score >= 5) {
    scoreTitle = 'Đạt Yêu Cầu! Tiếp Tục Cố Gắng Nhé 💪';
    scoreColorClass = 'text-amber-600';
    badgeColor = 'bg-amber-100 text-amber-800';
  } else {
    scoreTitle = 'Cần Ôn Tập Thêm Kiến Thức 📖';
    scoreColorClass = 'text-red-600';
    badgeColor = 'bg-red-100 text-red-800';
  }

  const handleShare = () => {
    navigator.clipboard.writeText(
      `Mình vừa đạt ${submission.score.toFixed(1)}/10 điểm bài kiểm tra: ${exam.title} (${exam.grade}) trên EdTech ExamHub!`
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* CARD KẾT QUẢ TRUNG TÂM */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-lg text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-amber-400 to-amber-200 text-amber-900 flex items-center justify-center mx-auto shadow-md shadow-amber-100">
          <Trophy className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${badgeColor}`}>
            {scoreTitle}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {exam.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Học sinh: <strong className="text-slate-800">{submission.studentName}</strong> • {exam.grade} - Lớp:{' '}
            <strong className="text-indigo-600">{submission.studentClass}</strong>
          </p>
        </div>

        {/* ĐIỂM SỐ LỚN */}
        <div className="py-6 px-4 bg-slate-50 rounded-3xl border border-slate-100 max-w-sm mx-auto shadow-inner">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            Điểm Số (Thang 10)
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span className={`text-6xl sm:text-7xl font-black tracking-tight ${scoreColorClass}`}>
              {submission.score.toFixed(1)}
            </span>
            <span className="text-2xl font-bold text-slate-400">/ 10</span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-2">
            Đúng {submission.correctCount} câu trắc nghiệm • {submission.totalQuestions} câu hỏi trong đề
          </p>
        </div>

        {/* LỜI NHẬN XÉT CỦA GIÁO VIÊN NẾU CÓ */}
        {submission.teacherFeedback && (
          <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200 text-xs sm:text-sm text-indigo-950 text-left max-w-lg mx-auto space-y-1">
            <div className="font-extrabold flex items-center gap-1.5 text-indigo-700">
              <MessageSquare className="w-4 h-4" />
              <span>Lời nhận xét của Thầy/Cô:</span>
            </div>
            <p className="font-medium pl-5 whitespace-pre-line">{submission.teacherFeedback}</p>
          </div>
        )}

        {/* THỐNG KÊ CHI TIẾT */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto">
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-bold">Số câu đúng</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-800">
              {submission.correctCount}
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
            <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
              <Award className="w-4 h-4" />
              <span className="text-xs font-bold">Trắc nghiệm</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-purple-800">
              {submission.autoScore.toFixed(1)}đ
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold">Thời gian</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-blue-800">{timeFormatted}</p>
          </div>
        </div>

        {/* CÁC NÚT HÀNH ĐỘNG */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={() => setShowReview(!showReview)}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-sm transition flex items-center gap-2"
          >
            <Eye className="w-4 h-4 text-indigo-600" />
            <span>{showReview ? 'Ẩn Chi Tiết' : 'Xem Lại Đáp Án & Lời Giải'}</span>
          </button>

          <button
            onClick={onRetake}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-sm transition flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Làm Lại Bài</span>
          </button>

          <button
            onClick={handleShare}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition flex items-center gap-2"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? 'Đã sao chép!' : 'Chia sẻ'}</span>
          </button>

          <button
            onClick={onBackToList}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-100 transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Danh Sách Đề Thi</span>
          </button>
        </div>
      </div>

      {/* VÙNG XEM LẠI CHI TIẾT TỪNG CÂU HỎI */}
      {showReview && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              <span>Xem Lại Đáp Án & Lời Giải Chi Tiết</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Kiểm tra kỹ các câu chưa chính xác để rút kinh nghiệm
            </span>
          </div>

          <div className="space-y-5">
            {exam.questions.map((question, qIdx) => {
              if (question.type === 'multiple_choice') {
                const studentChoice = submission.answers[qIdx];
                const isCorrect = studentChoice === question.correctAnswer;
                const hasAnswered = studentChoice !== undefined;

                return (
                  <div
                    key={question.id || qIdx}
                    className={`bg-white rounded-3xl border-2 p-6 space-y-4 shadow-xs transition-all ${
                      isCorrect
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-red-200 bg-red-50/20'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                      <span
                        className={`text-xs font-black px-3 py-1 rounded-xl flex items-center gap-1.5 ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Câu {qIdx + 1} (Trắc nghiệm): Chính xác ✔</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Câu {qIdx + 1} (Trắc nghiệm): {hasAnswered ? 'Chưa đúng ✖' : 'Bỏ trống ✖'}</span>
                          </>
                        )}
                      </span>

                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-xl border ${
                          isCorrect
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {isCorrect
                          ? `+${(Number(question.points) || Math.round((10.0 / exam.questions.length) * 10) / 10).toFixed(1)}đ`
                          : `0.0 / ${(Number(question.points) || Math.round((10.0 / exam.questions.length) * 10) / 10).toFixed(1)}đ`}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base leading-relaxed">
                      {question.question}
                    </h4>

                    {question.imageUrl && (
                      <img
                        src={question.imageUrl}
                        alt="Hình ảnh câu hỏi"
                        className="max-h-48 rounded-xl object-contain border border-slate-200"
                      />
                    )}

                    <div className="space-y-2.5">
                      {(question.options || []).map((opt, optIdx) => {
                        const isOptionCorrect = optIdx === question.correctAnswer;
                        const isOptionStudentChoice = optIdx === studentChoice;

                        let rowClass = 'border-slate-200 bg-slate-50 text-slate-700';
                        let statusBadge = null;

                        if (isOptionCorrect) {
                          rowClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                          statusBadge = (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Đáp án đúng</span>
                            </span>
                          );
                        }

                        if (isOptionStudentChoice && !isCorrect) {
                          rowClass = 'border-red-500 bg-red-50 text-red-900 font-bold';
                          statusBadge = (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-600 text-white font-bold flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              <span>Bạn đã chọn</span>
                            </span>
                          );
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center justify-between p-3.5 rounded-2xl border ${rowClass} text-sm transition`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border ${
                                  isOptionCorrect
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : isOptionStudentChoice
                                    ? 'bg-red-600 text-white border-red-600'
                                    : 'bg-white text-slate-600 border-slate-200'
                                }`}
                              >
                                {optionLetters[optIdx]}
                              </span>
                              <span className="font-medium">{opt}</span>
                            </div>
                            {statusBadge}
                          </div>
                        );
                      })}
                    </div>

                    {question.explanation && (
                      <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed font-medium">
                        💡 <strong>Giải thích chi tiết:</strong> {question.explanation}
                      </div>
                    )}
                  </div>
                );
              }

              // Câu Tự Luận
              const essayText = submission.essayAnswers?.[qIdx];
              const essayImg = submission.essayImages?.[qIdx];

              return (
                <div
                  key={question.id || qIdx}
                  className="bg-white rounded-3xl border-2 border-purple-200 p-6 space-y-4 shadow-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-black px-3 py-1 rounded-xl bg-purple-100 text-purple-800">
                      Câu {qIdx + 1} (Tự Luận - Thang điểm {question.maxPoints ?? 3.0}đ)
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base leading-relaxed whitespace-pre-line">
                    {question.question}
                  </h4>

                  {question.imageUrl && (
                    <img
                      src={question.imageUrl}
                      alt="Hình ảnh câu hỏi"
                      className="max-h-48 rounded-xl object-contain border border-slate-200"
                    />
                  )}

                  <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100 space-y-2 text-xs">
                    <p className="font-bold text-purple-900">✍ Bài làm của bạn:</p>
                    <p className="text-slate-800 whitespace-pre-line font-medium leading-relaxed">
                      {essayText || '(Chưa nhập nội dung tự luận)'}
                    </p>
                    {essayImg && (
                      <div className="pt-1">
                        <img
                          src={essayImg}
                          alt="Ảnh bài làm"
                          className="max-h-40 rounded-lg border border-purple-200"
                        />
                      </div>
                    )}
                  </div>

                  {question.sampleAnswer && (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium">
                      💡 <strong>Đáp án chuẩn của Thầy/Cô:</strong>
                      <p className="whitespace-pre-line mt-1">{question.sampleAnswer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
