import React, { useState, useEffect } from 'react';
import {
  Lock,
  ShieldCheck,
  KeyRound,
  User,
  AlertCircle,
  CheckCircle2,
  Phone,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import {
  loginTeacher,
  getTeacherAccount,
  completeInitialPasswordChange,
  resetPasswordWithPhone,
  syncTeacherAccountWithCloud,
  RECOVERY_PHONE
} from '../../services/teacherAuth';

interface TeacherLoginModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({
  isOpen,
  onSuccess,
  onCancel
}) => {
  // Chế độ: 'login' | 'force_change_password' | 'forgot_password'
  const [modalMode, setModalMode] = useState<'login' | 'force_change_password' | 'forgot_password'>('login');

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Đổi mật khẩu lần đầu
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Quên mật khẩu qua số điện thoại
  const [phoneInput, setPhoneInput] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');

  // Tự động đồng bộ tài khoản từ Cloud Firestore ngay khi mở modal
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
      syncTeacherAccountWithCloud().then((acc) => {
        if (acc && acc.username) {
          setUsername(acc.username);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Đăng nhập
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await loginTeacher(username, password);
      if (res.success) {
        if (res.requiresPasswordChange) {
          setModalMode('force_change_password');
          setNewPassword('');
          setConfirmNewPassword('');
          setSuccessMessage('Đăng nhập thành công! Vì lý do an toàn, Thầy/Cô vui lòng đổi mật khẩu mới cho lần đầu tiên sử dụng.');
        } else {
          onSuccess();
        }
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage('Lỗi đăng nhập: ' + (err?.message || 'Không thể xác thực'));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Lưu mật khẩu mới lần đầu
  const handleForceChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await completeInitialPasswordChange(newPassword);
      if (res.success) {
        alert(res.message);
        onSuccess();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage('Lỗi đổi mật khẩu: ' + (err?.message || 'Không thể đổi'));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Khôi phục mật khẩu qua số điện thoại
  const handleForgotPhoneReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    setIsLoading(true);
    try {
      const res = await resetPasswordWithPhone(phoneInput, resetNewPass);
      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          setModalMode('login');
          setPassword(resetNewPass);
          setSuccessMessage('Mật khẩu đã được đặt lại thành công! Bạn có thể đăng nhập ngay.');
        }, 1500);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage('Lỗi khôi phục: ' + (err?.message || 'Không thể khôi phục'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative border border-slate-100">
        {/* Nút thoát */}
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition font-bold"
        >
          ✕
        </button>

        {/* Biểu tượng */}
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-xl font-black text-slate-900">
            {modalMode === 'login' && 'Khu Vực Dành Cho Giáo Viên'}
            {modalMode === 'force_change_password' && 'Bắt Buộc Đổi Mật Khẩu Lần Đầu'}
            {modalMode === 'forgot_password' && 'Khôi Phục Mật Khẩu Bằng Số Điện Thoại'}
          </h3>
          <p className="text-xs text-slate-500">
            {modalMode === 'login' && 'Học sinh không thể truy cập đề thi, đáp án và bảng điểm nếu không có mật khẩu'}
            {modalMode === 'force_change_password' && 'Thiết lập mật khẩu riêng để bảo vệ quyền quản lý đề kiểm tra'}
            {modalMode === 'forgot_password' && 'Nhập đúng số điện thoại của Giáo viên đã thiết lập'}
          </p>
        </div>

        {/* Thông báo lỗi / thành công */}
        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. MÀN HÌNH ĐĂNG NHẬP */}
        {modalMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tên đăng nhập (ID) *</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ID mặc định: admin"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mật khẩu *</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setModalMode('forgot_password');
                  }}
                  className="text-xs text-indigo-600 hover:underline font-bold"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu mặc định: admin"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-xs text-indigo-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tài khoản mặc định ban đầu:</span>
              </p>
              <p className="font-mono text-slate-700 pl-5">
                ID: <strong>admin</strong> • Mật khẩu: <strong>admin</strong>
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition"
              >
                Học Sinh Quay Lại
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm shadow-md shadow-indigo-100 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang kiểm tra...</span>
                  </>
                ) : (
                  <span>Vào Hệ Thống</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* 2. MÀN HÌNH BẮT BUỘC ĐỔI MẬT KHẨU LẦN ĐẦU */}
        {modalMode === 'force_change_password' && (
          <form onSubmit={handleForceChangePassword} className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-medium leading-relaxed">
              ⚠️ <strong>Lưu ý quan trọng:</strong> Đây là lần đầu tiên bạn đăng nhập với tài khoản mặc định. Bạn bắt buộc phải đổi mật khẩu mới để học sinh không thể truy cập tài khoản này! (Mật khẩu mới sẽ được đồng bộ lên Cloud để dùng trên mọi máy tính).
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Mật khẩu mới (Tối thiểu 4 ký tự) *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới của bạn..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Xác nhận lại mật khẩu mới *</label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới vừa gõ..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-sm shadow-md shadow-emerald-100 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang lưu và đồng bộ Cloud...</span>
                </>
              ) : (
                <span>Lưu Mật Khẩu Mới & Vào Hệ Thống</span>
              )}
            </button>
          </form>
        )}

        {/* 3. MÀN HÌNH QUÊN MẬT KHẨU QUA SỐ ĐIỆN THOẠI 0702788047 */}
        {modalMode === 'forgot_password' && (
          <form onSubmit={handleForgotPhoneReset} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-600" />
                <span>Số điện thoại xác thực Giáo Viên *</span>
              </label>
              <input
                type="text"
                required
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Nhập số điện thoại: 0702788047"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
              />
              <p className="text-[11px] text-slate-400">
                (SĐT khôi phục đã cấu hình: <strong>0702788047</strong>)
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Mật khẩu mới muốn đặt *</label>
              <input
                type="password"
                required
                value={resetNewPass}
                onChange={(e) => setResetNewPass(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setErrorMessage('');
                  setSuccessMessage('');
                  setModalMode('login');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại</span>
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>Xác Nhận & Đặt Lại</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
