import React from 'react';
import {
  GraduationCap,
  UserCheck,
  ShieldCheck,
  FileCode,
  Cloud,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { StudentProfile } from '../types';

interface NavbarProps {
  currentTab: 'student' | 'teacher' | 'guide';
  onSelectTab: (tab: 'student' | 'teacher' | 'guide') => void;
  studentProfile: StudentProfile;
  onEditProfile: () => void;
  isCloudConnected: boolean;
  onOpenCloudSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  studentProfile,
  onEditProfile,
  isCloudConnected,
  onOpenCloudSettings
}) => {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none group"
          onClick={() => onSelectTab('student')}
        >
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                EdTech <span className="text-indigo-600">ExamHub</span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCloudSettings();
                }}
                title={
                  isCloudConnected
                    ? 'Firebase Firestore đã kết nối'
                    : 'Đang dùng LocalStorage (Nhấp để kết nối Firebase)'
                }
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5 transition border ${
                  isCloudConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>{isCloudConnected ? 'Cloud Online' : 'Bộ nhớ máy'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Nền tảng giao & làm bài tập trắc nghiệm online
            </p>
          </div>
        </div>

        {/* Main Role Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-sm font-semibold">
          <button
            onClick={() => onSelectTab('student')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
              currentTab === 'student'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Học Sinh</span>
          </button>

          <button
            onClick={() => onSelectTab('teacher')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
              currentTab === 'teacher'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Giáo Viên</span>
          </button>

          <button
            onClick={() => onSelectTab('guide')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
              currentTab === 'guide'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <FileCode className="w-4 h-4 text-emerald-600" />
            <span className="hidden md:inline">Tải File index.html & Cài Đặt</span>
            <span className="md:hidden">File & HD</span>
          </button>
        </div>

        {/* Student Quick Badge */}
        {studentProfile.name && (
          <div
            onClick={onEditProfile}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition text-xs"
            title="Nhấp để sửa thông tin Họ tên và Lớp"
          >
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
              {studentProfile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="font-bold text-slate-800">{studentProfile.name}</span>
              <span className="text-slate-400 mx-1">•</span>
              <span className="text-indigo-600 font-semibold">{studentProfile.studentClass}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
