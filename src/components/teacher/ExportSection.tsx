import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  Filter,
  CheckCircle2,
  Table,
  Sparkles
} from 'lucide-react';
import { Submission, Exam } from '../../types';

interface ExportSectionProps {
  submissions: Submission[];
  exams: Exam[];
}

export const ExportSection: React.FC<ExportSectionProps> = ({ submissions, exams }) => {
  const [filterExamId, setFilterExamId] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  // Lọc theo đề
  const filteredSubs = submissions.filter((s) => {
    if (filterExamId === 'all') return true;
    return s.examId === filterExamId;
  });

  // Tạo nội dung CSV chuẩn UTF-8 BOM cho Excel
  const generateCsvString = (): string => {
    const headers = [
      'STT',
      'Họ và Tên',
      'Lớp',
      'Tên Đề Kiểm Tra',
      'Điểm Số (Thang 10)',
      'Số Câu Đúng',
      'Tổng Số Câu',
      'Thời Gian Làm (Giây)',
      'Thời Gian Nộp'
    ];

    const rows = [headers];

    filteredSubs.forEach((sub, idx) => {
      const dateStr = sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('vi-VN') : '';
      rows.push([
        String(idx + 1),
        `"${(sub.studentName || '').replace(/"/g, '""')}"`,
        `"${(sub.studentClass || '').replace(/"/g, '""')}"`,
        `"${(sub.examTitle || '').replace(/"/g, '""')}"`,
        String(sub.score.toFixed(1)),
        String(sub.correctCount),
        String(sub.totalQuestions),
        String(sub.timeSpentSeconds || 0),
        `"${dateStr}"`
      ]);
    });

    return rows.map((r) => r.join(',')).join('\r\n');
  };

  const handleDownloadCsv = () => {
    if (filteredSubs.length === 0) {
      alert('Không có dữ liệu bài nộp nào để xuất file!');
      return;
    }

    const csvData = generateCsvString();
    // BẮT BUỘC: Thêm UTF-8 BOM (\uFEFF) để Excel trên Windows/Mac mở tiếng Việt hiển thị hoàn hảo!
    const blob = new Blob(['\uFEFF' + csvData], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const now = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Bang_Diem_Hoc_Sinh_${now}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyCsv = () => {
    const csvData = generateCsvString();
    navigator.clipboard.writeText(csvData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner Giới Thiệu & Nút Tải */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-emerald-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Mã hóa UTF-8 BOM chuẩn cho Microsoft Excel</span>
          </div>
          <h2 className="text-2xl font-black">Xuất Bảng Điểm & Kết Quả Ra File Excel</h2>
          <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
            Tải về trọn bộ danh sách bài nộp, họ tên học sinh, lớp, điểm số thang 10 và thời gian nộp.
            Cam kết không bị lỗi font Tiếng Việt khi mở trên Microsoft Excel, Google Sheets hay Apple Numbers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopyCsv}
            className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-2xl text-xs backdrop-blur-md transition flex items-center gap-2 border border-white/20"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã sao chép!' : 'Sao chép văn bản'}</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="px-6 py-3 bg-white text-emerald-800 hover:bg-emerald-50 font-black rounded-2xl text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Tải File CSV (Excel) Ngay</span>
          </button>
        </div>
      </div>

      {/* Bộ Lọc Xuất & Xem Trước */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-slate-900 text-base">Xem Trước Bảng Điểm Xuất Ra</h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {filteredSubs.length} bản ghi
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-500">Lọc theo đề:</span>
            <select
              value={filterExamId}
              onChange={(e) => setFilterExamId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả đề kiểm tra</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bảng xem trước */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">STT</th>
                <th className="py-2.5 px-3">Họ và Tên</th>
                <th className="py-2.5 px-3">Lớp</th>
                <th className="py-2.5 px-3">Đề Kiểm Tra</th>
                <th className="py-2.5 px-3">Điểm Số</th>
                <th className="py-2.5 px-3">Đúng/Tổng</th>
                <th className="py-2.5 px-3">Thời Gian Làm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSubs.slice(0, 10).map((sub, idx) => {
                const mins = Math.floor((sub.timeSpentSeconds || 0) / 60);
                const secs = (sub.timeSpentSeconds || 0) % 60;
                const timeStr = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

                return (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{sub.studentName}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded">
                        {sub.studentClass}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 max-w-xs truncate">{sub.examTitle}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-extrabold text-indigo-700">
                        {sub.score.toFixed(1)} / 10
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      {sub.correctCount} / {sub.totalQuestions}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{timeStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredSubs.length > 10 && (
            <p className="text-center py-3 text-xs text-slate-400 font-medium bg-slate-50 border-t border-slate-100">
              ...và còn {filteredSubs.length - 10} bài nộp khác sẽ được xuất đầy đủ trong file CSV.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
