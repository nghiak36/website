import { TeacherAccount } from '../types';

const STORAGE_KEYS = {
  TEACHER_ACCOUNT: 'edtech_teacher_account_v2',
  TEACHER_SESSION: 'edtech_teacher_session'
};

export const RECOVERY_PHONE = '0702788047';

const DEFAULT_TEACHER: TeacherAccount = {
  username: 'admin',
  passwordHash: 'admin',
  hasChangedInitialPassword: false, // Bắt buộc đổi mật khẩu khi đăng nhập lần đầu
  recoveryPhone: RECOVERY_PHONE,
  name: 'Giáo Viên Tin Học THCS',
  schoolName: 'Trường THCS'
};

// Lấy thông tin tài khoản giáo viên
export function getTeacherAccount(): TeacherAccount {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHER_ACCOUNT);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_TEACHER,
        ...parsed,
        recoveryPhone: RECOVERY_PHONE
      };
    }
  } catch (e) {
    console.error('Lỗi đọc tài khoản giáo viên:', e);
  }
  return DEFAULT_TEACHER;
}

// Lưu thông tin / mật khẩu giáo viên
export function saveTeacherAccount(account: TeacherAccount): void {
  localStorage.setItem(STORAGE_KEYS.TEACHER_ACCOUNT, JSON.stringify(account));
}

// Kiểm tra phiên đăng nhập
export function isTeacherLoggedIn(): boolean {
  return localStorage.getItem(STORAGE_KEYS.TEACHER_SESSION) === 'active';
}

// Đăng nhập giáo viên
export function loginTeacher(
  usernameInput: string,
  passwordInput: string
): { success: boolean; requiresPasswordChange: boolean; message: string } {
  const account = getTeacherAccount();

  const isUserMatch = usernameInput.trim().toLowerCase() === account.username.toLowerCase();
  const isPassMatch = passwordInput === account.passwordHash;

  if (isUserMatch && isPassMatch) {
    // Nếu đang dùng mật khẩu mặc định "admin" hoặc chưa từng đổi mật khẩu ban đầu
    const needsChange =
      !account.hasChangedInitialPassword ||
      (account.username === 'admin' && account.passwordHash === 'admin');

    if (!needsChange) {
      localStorage.setItem(STORAGE_KEYS.TEACHER_SESSION, 'active');
    }

    return {
      success: true,
      requiresPasswordChange: needsChange,
      message: needsChange
        ? 'Đăng nhập lần đầu thành công! Bạn phải đổi mật khẩu mới để bảo mật hệ thống.'
        : 'Đăng nhập thành công!'
    };
  }

  return {
    success: false,
    requiresPasswordChange: false,
    message: 'Tên đăng nhập (ID) hoặc Mật khẩu không chính xác! (Mặc định ban đầu: admin / admin)'
  };
}

// Đổi mật khẩu lần đầu bắt buộc
export function completeInitialPasswordChange(newPassword: string): { success: boolean; message: string } {
  if (!newPassword || newPassword.trim().length < 4) {
    return { success: false, message: 'Mật khẩu mới phải có ít nhất 4 ký tự!' };
  }
  if (newPassword === 'admin') {
    return { success: false, message: 'Vui lòng chọn mật khẩu khác mật khẩu mặc định "admin"!' };
  }

  const account = getTeacherAccount();
  const updated: TeacherAccount = {
    ...account,
    passwordHash: newPassword,
    hasChangedInitialPassword: true
  };

  saveTeacherAccount(updated);
  localStorage.setItem(STORAGE_KEYS.TEACHER_SESSION, 'active');
  return { success: true, message: 'Đổi mật khẩu thành công! Bạn đã có thể vào trang Giáo viên.' };
}

// Khôi phục mật khẩu bằng số điện thoại 0702788047
export function resetPasswordWithPhone(
  phoneInput: string,
  newPassword: string
): { success: boolean; message: string } {
  const cleanPhone = phoneInput.replace(/[\s\.\-]/g, '').trim();

  if (cleanPhone !== RECOVERY_PHONE) {
    return {
      success: false,
      message: `Số điện thoại không đúng! Số điện thoại đăng ký khôi phục là: ${RECOVERY_PHONE}`
    };
  }

  if (!newPassword || newPassword.trim().length < 4) {
    return { success: false, message: 'Mật khẩu mới phải có ít nhất 4 ký tự!' };
  }

  const account = getTeacherAccount();
  const updated: TeacherAccount = {
    ...account,
    passwordHash: newPassword,
    hasChangedInitialPassword: true
  };

  saveTeacherAccount(updated);
  return {
    success: true,
    message: 'Khôi phục mật khẩu thành công! Mật khẩu mới của bạn đã được cập nhật.'
  };
}

// Đăng xuất giáo viên
export function logoutTeacher(): void {
  localStorage.removeItem(STORAGE_KEYS.TEACHER_SESSION);
}
