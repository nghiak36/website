import React, { useState } from 'react';
import { UserCheck, Sparkles, X, GraduationCap } from 'lucide-react';
import { StudentProfile, ALLOWED_CLASSES } from '../../types';

interface ProfileModalProps {
  initialProfile: StudentProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: StudentProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  initialProfile,
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState(initialProfile.name || '');
  const [studentClass, setStudentClass] = useState(initialProfile.studentClass || '6H1');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập Họ và tên của bạn!');
      return;
    }
    if (!studentClass) {
      alert('Vui lòng chọn Lớp học của bạn!');
      return;
    }
    onSave({ name: name.trim(), studentClass });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative">
        {initialProfile.name && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <UserCheck className="w-7 h-7" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-xl font-black text-slate-900">Thông Tin Học Sinh</h3>
          <p className="text-xs text-slate-500">
            Không cần tài khoản hay mật khẩu! Chỉ cần nhập Họ tên & chọn Lớp để Thầy/Cô ghi nhận điểm số.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Họ và tên của bạn *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn An"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Lớp học (Chọn danh sách thả xuống) *</span>
            </label>
            <select
              required
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <optgroup label="Khối 6">
                <option value="6H1">Lớp 6H1</option>
                <option value="6H2">Lớp 6H2</option>
                <option value="6H3">Lớp 6H3</option>
              </optgroup>
              <optgroup label="Khối 7">
                <option value="7H1">Lớp 7H1</option>
                <option value="7H2">Lớp 7H2</option>
                <option value="7H3">Lớp 7H3</option>
              </optgroup>
              <optgroup label="Khối 8">
                <option value="8H1">Lớp 8H1</option>
                <option value="8H2">Lớp 8H2</option>
                <option value="8H3">Lớp 8H3</option>
              </optgroup>
              <optgroup label="Khối 9">
                <option value="9H1">Lớp 9H1</option>
                <option value="9H2">Lớp 9H2</option>
                <option value="9H3">Lớp 9H3</option>
              </optgroup>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-indigo-100 transition hover:shadow-indigo-200"
          >
            Lưu & Bắt Đầu Vào Học
          </button>
        </form>
      </div>
    </div>
  );
};
