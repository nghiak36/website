import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Sparkles,
  CloudUpload,
  BookOpen,
  FileText,
  Clock,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  UploadCloud,
  Image as ImageIcon,
  X,
  FileCode,
  GraduationCap,
  FileUp,
  Check,
  Calculator
} from 'lucide-react';
import { Exam, Question, GradeLevel, QuestionType } from '../../types';
import { extractTextFromFile, parseExamQuestionsFromText } from '../../services/wordParser';

interface ExamCreatorProps {
  editingExam?: Exam | null;
  onPublishExam: (exam: Exam) => Promise<{ success: boolean; cloudSynced: boolean; message: string }>;
  onCancel: () => void;
}

export const ExamCreator: React.FC<ExamCreatorProps> = ({
  editingExam,
  onPublishExam,
  onCancel
}) => {
  const [title, setTitle] = useState(editingExam ? editingExam.title : '');
  const [subject, setSubject] = useState(editingExam ? editingExam.subject : 'Tin Học THCS');
  const [grade, setGrade] = useState<GradeLevel>(editingExam ? editingExam.grade : 'Khối 6');
  const [durationMinutes, setDurationMinutes] = useState(editingExam ? editingExam.durationMinutes : 15);
  const [author, setAuthor] = useState(editingExam ? editingExam.author : 'Giáo Viên Tin Học THCS');
  const [description, setDescription] = useState(editingExam ? (editingExam.description || '') : '');

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Trích xuất file Word
  const [isParsingWord, setIsParsingWord] = useState(false);
  const [wordFileSuccessMsg, setWordFileSuccessMsg] = useState('');
  const [showWordPasteModal, setShowWordPasteModal] = useState(false);
  const [wordPasteText, setWordPasteText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Danh sách câu hỏi
  const [questions, setQuestions] = useState<Question[]>(() => {
    if (editingExam && editingExam.questions && editingExam.questions.length > 0) {
      return editingExam.questions.map((q) => ({
        ...q,
        points: q.points || (q.maxPoints ?? 1.0)
      }));
    }
    return [
      {
        id: 'q-init-1',
        type: 'multiple_choice',
        question: '',
        points: 2.0,
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: ''
      }
    ];
  });

  // Tự động phân bổ lại điểm nếu đang soạn đề mới
  const autoDistributePoints = (qList: Question[]) => {
    const count = qList.length;
    if (count === 0) return qList;
    const each = Math.round((10.0 / count) * 10) / 10;
    return qList.map((q, idx) => ({
      ...q,
      points: idx === count - 1 ? Math.round((10.0 - each * (count - 1)) * 10) / 10 : each,
      maxPoints: idx === count - 1 ? Math.round((10.0 - each * (count - 1)) * 10) / 10 : each
    }));
  };

  // Tính tổng điểm hiện tại
  const currentTotalPoints = Math.round(
    questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0) * 10
  ) / 10;

  // Thêm câu hỏi trắc nghiệm
  const handleAddMultipleChoice = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: 'q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        type: 'multiple_choice',
        question: '',
        points: 1.0,
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: ''
      }
    ]);
  };

  // Thêm câu hỏi tự luận
  const handleAddEssay = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: 'q-essay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        type: 'essay',
        question: '',
        points: 3.0,
        sampleAnswer: '',
        maxPoints: 3.0
      }
    ]);
  };

  // Nút tự động chia đều 10.0 điểm cho tất cả các câu
  const handleApplyEvenSplit = () => {
    setQuestions(autoDistributePoints(questions));
  };

  // Nhân bản câu hỏi
  const handleDuplicateQuestion = (idx: number) => {
    const target = questions[idx];
    const duplicated: Question = {
      ...target,
      id: 'q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      options: target.options ? ([...target.options] as [string, string, string, string]) : undefined
    };
    const newQuestions = [...questions];
    newQuestions.splice(idx + 1, 0, duplicated);
    setQuestions(newQuestions);
  };

  // Xóa câu hỏi
  const handleDeleteQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert('Đề kiểm tra phải có ít nhất 1 câu hỏi!');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Cập nhật trường trong câu hỏi
  const updateQuestionField = (idx: number, field: keyof Question, value: any) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      if (field === 'points') {
        copy[idx].maxPoints = value;
      }
      return copy;
    });
  };

  // Cập nhật phương án trắc nghiệm
  const updateOptionText = (qIdx: number, optIdx: number, val: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const opts = copy[qIdx].options
        ? [...copy[qIdx].options!]
        : ['', '', '', ''];
      opts[optIdx] = val;
      copy[qIdx] = { ...copy[qIdx], options: opts as [string, string, string, string] };
      return copy;
    });
  };

  // Upload hình ảnh câu hỏi
  const handleImageUploadForQuestion = (idx: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một file ảnh (PNG, JPG, WebP)!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      updateQuestionField(idx, 'imageUrl', base64);
    };
    reader.readAsDataURL(file);
  };

  // Upload file Word
  const handleWordFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingWord(true);
    setWordFileSuccessMsg('');
    try {
      const text = await extractTextFromFile(file);
      const parsed = parseExamQuestionsFromText(text);

      if (parsed.length === 0) {
        alert('Không tìm thấy câu hỏi chuẩn trong file Word. Thầy/Cô có thể bấm "Dán Text Từ Word" để dán nội dung trực tiếp.');
      } else {
        const cleanFileName = file.name.replace(/\.(docx|txt)$/i, '').replace(/[_-]/g, ' ');
        if (!title) {
          setTitle(`Đề Kiểm Tra Tin Học: ${cleanFileName}`);
        }
        setQuestions(autoDistributePoints(parsed));
        setWordFileSuccessMsg(`Đã trích xuất thành công ${parsed.length} câu hỏi từ file "${file.name}" và chia đều tổng điểm 10.0đ!`);
      }
    } catch (err: any) {
      alert('Lỗi đọc file: ' + (err.message || 'Không thể đọc file Word'));
    } finally {
      setIsParsingWord(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Dán text Word
  const handleApplyWordPaste = () => {
    if (!wordPasteText.trim()) return;
    const parsed = parseExamQuestionsFromText(wordPasteText);
    if (parsed.length === 0) {
      alert('Không nhận diện được câu hỏi. Hãy bắt đầu mỗi câu bằng "Câu 1:", "A.", "B.", "C.", "D." và "Đáp án: A"');
      return;
    }
    setQuestions(autoDistributePoints(parsed));
    setWordFileSuccessMsg(`Đã nhập ${parsed.length} câu hỏi và tự động chia đều tổng điểm 10.0đ!`);
    setShowWordPasteModal(false);
    setWordPasteText('');
  };

  // Lưu đề thi
  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tên đề kiểm tra!');
      return;
    }

    if (questions.length === 0) {
      alert('Vui lòng thêm ít nhất 1 câu hỏi!');
      return;
    }

    // Kiểm tra câu hỏi rỗng
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        alert(`Câu ${i + 1} đang bị bỏ trống nội dung câu hỏi!`);
        return;
      }
      if (q.type === 'multiple_choice') {
        if (!q.options || q.options.length < 4) {
          alert(`Câu ${i + 1} chưa đủ 4 phương án trắc nghiệm!`);
          return;
        }
        for (let j = 0; j < 4; j++) {
          if (!q.options[j].trim()) {
            alert(`Câu ${i + 1} chưa điền phương án ${['A', 'B', 'C', 'D'][j]}!`);
            return;
          }
        }
      }
    }

    // Phân loại đề
    const hasMC = questions.some((q) => q.type === 'multiple_choice');
    const hasEssay = questions.some((q) => q.type === 'essay');
    let computedType: 'multiple_choice' | 'essay' | 'mixed' = 'multiple_choice';
    if (hasMC && hasEssay) computedType = 'mixed';
    else if (hasEssay) computedType = 'essay';

    setIsPublishing(true);
    setPublishStatus(null);

    const targetExam: Exam = {
      id: editingExam ? editingExam.id : 'exam-' + Date.now(),
      title: title.trim(),
      subject: subject.trim(),
      grade,
      examType: computedType,
      durationMinutes: Number(durationMinutes) || 15,
      totalPoints: currentTotalPoints,
      description: description.trim(),
      createdAt: editingExam ? editingExam.createdAt : new Date().toISOString(),
      author: author.trim() || 'Giáo Viên Tin Học THCS',
      questions,
      status: 'active'
    };

    const res = await onPublishExam(targetExam);
    setIsPublishing(false);

    if (res.success) {
      setPublishStatus({ type: 'success', message: res.message });
      setTimeout(() => {
        onCancel();
      }, 1200);
    } else {
      setPublishStatus({ type: 'error', message: res.message });
    }
  };

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-6">
      {/* Header và thao tác */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {grade} • {subject}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              {editingExam ? 'Chế độ: Đang Chỉnh Sửa Đề' : 'Chế độ: Soạn Đề Thi Mới'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span>{editingExam ? `Sửa Đề: ${editingExam.title}` : 'Soạn Đề Kiểm Tra Tin Học Mới'}</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Upload file Word */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleWordFileUpload}
            accept=".docx,.txt"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsingWord}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-2xl text-xs transition flex items-center gap-1.5 border border-emerald-200"
            title="Tải lên file Word (.docx) chứa câu hỏi"
          >
            <FileUp className="w-4 h-4 text-emerald-600" />
            <span>{isParsingWord ? 'Đang đọc...' : 'Tải File Word (.docx)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWordPasteModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition flex items-center gap-1.5"
          >
            <FileCode className="w-4 h-4 text-indigo-600" />
            <span>Dán Text Word</span>
          </button>

          <button
            onClick={onCancel}
            type="button"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition"
          >
            Hủy
          </button>

          <button
            onClick={handleSubmit}
            disabled={isPublishing}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs transition flex items-center gap-2 shadow-md shadow-indigo-100 disabled:opacity-50"
          >
            <CloudUpload className="w-4 h-4" />
            <span>{isPublishing ? 'Đang lưu...' : editingExam ? 'Cập Nhật Đề Thi' : 'Đăng Đề Lên Cloud'}</span>
          </button>
        </div>
      </div>

      {/* Thông báo kết quả */}
      {wordFileSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{wordFileSuccessMsg}</span>
          </div>
          <button onClick={() => setWordFileSuccessMsg('')} className="text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {publishStatus && (
        <div
          className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 ${
            publishStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {publishStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span>{publishStatus.message}</span>
        </div>
      )}

      {/* THANH TỔNG ĐIỂM CỦA ĐỀ THI (CHUẨN 10.0 ĐIỂM) */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 sm:p-5 rounded-3xl text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-amber-300">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Tổng Điểm Của Đề:</span>
              <span className={`text-lg font-black ${currentTotalPoints === 10.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {currentTotalPoints.toFixed(1)} / 10.0 điểm
              </span>
              {currentTotalPoints === 10.0 ? (
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ✔ Đã chuẩn 10.0đ
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ⚠️ Chưa bằng 10.0đ
                </span>
              )}
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Mỗi câu trắc nghiệm hoặc tự luận đều có ô nhập điểm cụ thể bên dưới.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleApplyEvenSplit}
          className="px-4 py-2 bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-100 font-bold rounded-xl text-xs transition border border-indigo-400/30 flex items-center gap-1.5"
          title="Tự động chia đều điểm cho tất cả các câu để tổng bằng 10.0 điểm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Tự động chia đều 10.0 điểm</span>
        </button>
      </div>

      {/* Thông Tin Cơ Bản Đề Thi */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>1. Cấu Hình Thông Tin Đề Kiểm Tra</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-700">Tên đề kiểm tra *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Kiểm tra 15 phút - Tin học 6: Thiết bị vào ra"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Khối lớp *</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value as GradeLevel)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700"
            >
              <option value="Khối 6">Khối 6 (Lớp 6)</option>
              <option value="Khối 7">Khối 7 (Lớp 7)</option>
              <option value="Khối 8">Khối 8 (Lớp 8)</option>
              <option value="Khối 9">Khối 9 (Lớp 9)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Thời gian làm bài (Phút) *</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="180"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Môn học</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Tên Giáo viên tạo đề</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Thầy Cô Bộ Môn Tin Học"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-700">Hướng dẫn học sinh / Ghi chú</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú về hình thức làm bài, số lượng câu trắc nghiệm và tự luận..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Danh Sách Câu Hỏi Trắc Nghiệm & Tự Luận */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>2. Danh Sách Câu Hỏi ({questions.length} câu)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Mỗi câu trắc nghiệm hoặc tự luận hiển thị số điểm tương ứng (Tổng thang điểm 10.0đ).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddMultipleChoice}
              type="button"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Câu Trắc Nghiệm</span>
            </button>

            <button
              onClick={handleAddEssay}
              type="button"
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Câu Tự Luận</span>
            </button>
          </div>
        </div>

        {/* Danh sách từng câu hỏi */}
        <div className="space-y-5">
          {questions.map((q, idx) => (
            <div
              key={q.id || idx}
              className={`bg-white rounded-3xl border-2 p-6 shadow-xs space-y-4 transition ${
                q.type === 'essay' ? 'border-purple-200' : 'border-slate-200'
              }`}
            >
              {/* Header câu hỏi */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-xl ${
                      q.type === 'essay'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    Câu {idx + 1}: {q.type === 'essay' ? '📝 Tự Luận' : '🔘 Trắc Nghiệm'}
                  </span>

                  {/* Ô Nhập Điểm Cụ Thể Của Câu Này */}
                  <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-600">Điểm:</span>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      max="10"
                      value={q.points ?? 1.0}
                      onChange={(e) => updateQuestionField(idx, 'points', Number(e.target.value))}
                      className="w-14 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-black text-xs text-indigo-700 text-center"
                    />
                    <span className="text-[11px] font-bold text-slate-500">đ</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicateQuestion(idx)}
                    type="button"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                    title="Nhân bản câu này"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(idx)}
                    type="button"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    title="Xóa câu này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Nội dung câu hỏi */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nội dung câu hỏi *</label>
                <textarea
                  rows={2}
                  value={q.question}
                  onChange={(e) => updateQuestionField(idx, 'question', e.target.value)}
                  placeholder="Nhập nội dung câu hỏi hoặc yêu cầu bài tập..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* CHÈN HÌNH ẢNH MINH HỌA */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Hình ảnh minh họa cho câu hỏi (Tùy chọn)</span>
                  </span>

                  <label className="text-xs font-bold px-3 py-1 bg-white hover:bg-slate-100 text-indigo-700 rounded-xl border border-slate-200 cursor-pointer transition flex items-center gap-1 shadow-xs">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Chọn ảnh từ máy</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleImageUploadForQuestion(idx, f);
                      }}
                    />
                  </label>
                </div>

                {q.imageUrl ? (
                  <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden group">
                    <img
                      src={q.imageUrl}
                      alt="Ảnh câu hỏi"
                      className="max-h-48 rounded-lg object-contain bg-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => updateQuestionField(idx, 'imageUrl', undefined)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow hover:bg-red-700 transition"
                      title="Gỡ ảnh này"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Hoặc dán đường link ảnh trực tuyến (https://...)"
                    onChange={(e) => updateQuestionField(idx, 'imageUrl', e.target.value.trim() || undefined)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                )}
              </div>

              {/* PHẦN A: CÂU TRẮC NGHIỆM */}
              {q.type === 'multiple_choice' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      4 Phương án trả lời (Nhấp nút tròn bên trái để chỉ định Đáp án đúng):
                    </label>
                    <span className="text-xs text-indigo-600 font-semibold">
                      Đáp án đúng hiện tại:{' '}
                      <strong>{optionLetters[q.correctAnswer ?? 0]}</strong>
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(q.options || ['', '', '', '']).map((opt, optIdx) => {
                      const isSelected = q.correctAnswer === optIdx;

                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200'
                              : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <label className="flex items-center gap-2 cursor-pointer pl-1">
                            <input
                              type="radio"
                              name={`correct_answer_${idx}`}
                              checked={isSelected}
                              onChange={() => updateQuestionField(idx, 'correctAnswer', optIdx)}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span
                              className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white text-slate-600 border border-slate-300'
                              }`}
                            >
                              {optionLetters[optIdx]}
                            </span>
                          </label>

                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOptionText(idx, optIdx, e.target.value)}
                            placeholder={`Nhập phương án ${optionLetters[optIdx]}...`}
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-bold text-slate-500">
                      Lời giải chi tiết / Gợi ý (Học sinh xem sau khi nộp bài):
                    </label>
                    <input
                      type="text"
                      value={q.explanation || ''}
                      onChange={(e) => updateQuestionField(idx, 'explanation', e.target.value)}
                      placeholder="Ví dụ: Theo SGK Tin học trang... hoặc công thức giải thích."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* PHẦN B: CÂU TỰ LUẬN */}
              {q.type === 'essay' && (
                <div className="space-y-3 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900">
                      Cấu hình câu hỏi Tự Luận
                    </span>
                    <span className="text-xs font-black text-purple-700 bg-white px-2.5 py-1 rounded-lg border border-purple-200">
                      Thang điểm câu này: {(q.points || 3.0).toFixed(1)} điểm
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Đáp án chuẩn / Tiêu chí & Biểu điểm chấm của Giáo Viên:
                    </label>
                    <textarea
                      rows={3}
                      value={q.sampleAnswer || ''}
                      onChange={(e) => updateQuestionField(idx, 'sampleAnswer', e.target.value)}
                      placeholder="Ghi rõ các ý cần có trong câu trả lời của học sinh để đối chiếu khi chấm bài..."
                      className="w-full px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Nút thêm câu hỏi phía dưới */}
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <button
            onClick={handleAddMultipleChoice}
            type="button"
            className="px-5 py-2.5 bg-white hover:bg-slate-50 text-indigo-700 font-bold rounded-2xl text-xs transition border-2 border-dashed border-indigo-200 hover:border-indigo-400 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm câu hỏi Trắc Nghiệm</span>
          </button>

          <button
            onClick={handleAddEssay}
            type="button"
            className="px-5 py-2.5 bg-white hover:bg-slate-50 text-purple-700 font-bold rounded-2xl text-xs transition border-2 border-dashed border-purple-200 hover:border-purple-400 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm câu hỏi Tự Luận</span>
          </button>
        </div>
      </div>

      {/* MODAL DÁN VĂN BẢN TỪ FILE WORD */}
      {showWordPasteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-black text-slate-900">Dán Nhanh Đề Thi Từ Word</h3>
              </div>
              <button
                onClick={() => setShowWordPasteModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Mở file Word, sao chép toàn bộ văn bản và dán vào bên dưới. Hệ thống sẽ tự động nhận diện câu hỏi và phân bổ điểm số:
            </p>

            <textarea
              rows={10}
              value={wordPasteText}
              onChange={(e) => setWordPasteText(e.target.value)}
              placeholder={`Câu 1: Thiết bị nào là thiết bị vào của máy tính?\nA. Màn hình\nB. Bàn phím\nC. Máy in\nD. Loa\nĐáp án: B\n\nCâu 2: [Tự luận] Nêu 3 biện pháp an toàn khi sử dụng mạng Internet.`}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowWordPasteModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleApplyWordPaste}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md transition"
              >
                Chuyển Đổi Thành Đề Thi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nút Đăng Đề Ở Cuối Trang */}
      <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
        <button
          onClick={onCancel}
          type="button"
          className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition"
        >
          Hủy bỏ
        </button>

        <button
          onClick={handleSubmit}
          disabled={isPublishing}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm shadow-xl shadow-indigo-100 transition flex items-center gap-2.5 disabled:opacity-50"
        >
          <CloudUpload className="w-5 h-5" />
          <span>{isPublishing ? 'Đang lưu...' : editingExam ? 'Lưu Thay Đổi Đề Thi' : 'Đăng Đề Lên Hệ Thống Cloud'}</span>
        </button>
      </div>
    </div>
  );
};
