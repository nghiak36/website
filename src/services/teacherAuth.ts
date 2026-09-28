import { TeacherAccount } from '../types';
import {
  loadTeacherAccountFromCloud,
  saveTeacherAccountToCloud
} from './storage';

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

// Lấy thông tin tài khoản giáo viên từ LocalStorage
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

// Lưu thông tin / mật khẩu giáo viên (vào LocalStorage và tự động đồng bộ lên Cloud Firestore)
export async function saveTeacherAccount(account: TeacherAccount): Promise<boolean> {
  const merged: TeacherAccount = {
    ...account,
    recoveryPhone: RECOVERY_PHONE
  };
  localStorage.setItem(STORAGE_KEYS.TEACHER_ACCOUNT, JSON.stringify(merged));

  // Đồng bộ lên Cloud Firestore
  try {
    const cloudSuccess = await saveTeacherAccountToCloud(merged);
    return cloudSuccess;
  } catch (err) {
    console.warn('Không thể đồng bộ tài khoản lên Cloud (offline):', err);
    return false;
  }
}

// Đồng bộ tài khoản từ Cloud Firestore về máy hiện tại
export async function syncTeacherAccountWithCloud(): Promise<TeacherAccount> {
  try {
    const cloudAcc = await loadTeacherAccountFromCloud();
    if (cloudAcc && cloudAcc.passwordHash) {
      const merged: TeacherAccount = {
        ...DEFAULT_TEACHER,
        ...cloudAcc,
        recoveryPhone: RECOVERY_PHONE
      };
      localStorage.setItem(STORAGE_KEYS.TEACHER_ACCOUNT, JSON.stringify(merged));
      console.log('Đã đồng bộ thông tin tài khoản giáo viên từ Cloud Firestore');
      return merged;
    } else {
      // Nếu trên Firestore chưa có dữ liệu nhưng máy này đã đổi mật khẩu, tải lên Cloud
      const local = getTeacherAccount();
      if (local.hasChangedInitialPassword && local.passwordHash !== 'admin') {
        await saveTeacherAccountToCloud(local);
      }
    }
  } catch (e) {
    console.warn('Lỗi đồng bộ tài khoản giáo viên với Cloud:', e);
  }
  return getTeacherAccount();
}

// Kiểm tra phiên đăng nhập
export function isTeacherLoggedIn(): boolean {
  return localStorage.getItem(STORAGE_KEYS.TEACHER_SESSION) === 'active';
}

// Đăng nhập giáo viên (Hỗ trợ Async & Tự động kiểm tra Cloud Firestore khi dùng máy tính khác)
export async function loginTeacher(
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; requiresPasswordChange: boolean; message: string }> {
  const cleanUser = usernameInput.trim();
  const cleanPass = passwordInput.trim();

  // 1. Kiểm tra tài khoản trong LocalStorage trước
  let account = getTeacherAccount();
  let isUserMatch = cleanUser.toLowerCase() === account.username.toLowerCase();
  let isPassMatch = cleanPass === account.passwordHash;

  // 2. Nếu đăng nhập không khớp, tự động tải tài khoản mới nhất từ Cloud Firestore
  // Nhờ đó khi giáo viên mở máy tính mới, laptop khác, điện thoại hoặc duyệt web ẩn danh,
  // chỉ cần nhập đúng mật khẩu đã đổi là đăng nhập được ngay!
  if (!isUserMatch || !isPassMatch) {
    try {
      const cloudAcc = await loadTeacherAccountFromCloud();
      if (cloudAcc && cloudAcc.passwordHash) {
        account = {
          ...DEFAULT_TEACHER,
          ...cloudAcc,
          recoveryPhone: RECOVERY_PHONE
        };
        localStorage.setItem(STORAGE_KEYS.TEACHER_ACCOUNT, JSON.stringify(account));
        isUserMatch = cleanUser.toLowerCase() === account.username.toLowerCase();
        isPassMatch = cleanPass === account.passwordHash;
      }
    } catch (e) {
      console.warn('Không thể kiểm tra mật khẩu Cloud:', e);
    }
  }

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
        ? 'Đăng nhập lần đầu thành công! Thầy/Cô vui lòng đổi mật khẩu mới để bảo mật hệ thống.'
        : 'Đăng nhập thành công!'
    };
  }

  return {
    success: false,
    requiresPasswordChange: false,
    message: 'Tên đăng nhập (ID) hoặc Mật khẩu không chính xác! (Mặc định ban đầu: admin / admin)'
  };
}

// Đổi mật khẩu lần đầu bắt buộc (lưu LocalStorage và đồng bộ lên Cloud)
export async function completeInitialPasswordChange(newPassword: string): Promise<{ success: boolean; message: string }> {
  if (!newPassword || newPassword.trim().length < 4) {
    return { success: false, message: 'Mật khẩu mới phải có ít nhất 4 ký tự!' };
  }
  if (newPassword.trim() === 'admin') {
    return { success: false, message: 'Vui lòng chọn mật khẩu khác mật khẩu mặc định "admin"!' };
  }

  const account = getTeacherAccount();
  const updated: TeacherAccount = {
    ...account,
    passwordHash: newPassword.trim(),
    hasChangedInitialPassword: true
  };

  await saveTeacherAccount(updated);
  localStorage.setItem(STORAGE_KEYS.TEACHER_SESSION, 'active');
  return {
    success: true,
    message: 'Đổi mật khẩu thành công! Mật khẩu mới đã được lưu và đồng bộ lên Cloud. Thầy/Cô có thể đăng nhập trên mọi máy tính và thiết bị.'
  };
}

// Cập nhật thông tin tài khoản / mật khẩu từ màn hình Quản Trị
export async function updateTeacherCredentials(
  newUsername: string,
  newPassword?: string,
  teacherName?: string
): Promise<{ success: boolean; message: string }> {
  const account = getTeacherAccount();
  const updated: TeacherAccount = {
    ...account,
    username: newUsername.trim() || account.username,
    passwordHash: newPassword && newPassword.trim().length >= 4 ? newPassword.trim() : account.passwordHash,
    hasChangedInitialPassword: true,
    name: teacherName !== undefined ? teacherName.trim() : account.name
  };

  const synced = await saveTeacherAccount(updated);
  return {
    success: true,
    message: synced
      ? 'Đã cập nhật và đồng bộ mật khẩu lên Cloud thành công! Thầy/Cô có thể đăng nhập trên các máy tính khác ngay bây giờ.'
      : 'Đã lưu trên máy này. Khi kết nối Cloud/Firebase, hệ thống sẽ tự động đồng bộ.'
  };
}

// Khôi phục mật khẩu bằng số điện thoại 0702788047
export async function resetPasswordWithPhone(
  phoneInput: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
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
    passwordHash: newPassword.trim(),
    hasChangedInitialPassword: true
  };

  await saveTeacherAccount(updated);
  return {
    success: true,
    message: 'Khôi phục mật khẩu thành công! Mật khẩu mới đã được cập nhật và đồng bộ lên Cloud.'
  };
}

// Đăng xuất giáo viên
export function logoutTeacher(): void {
  localStorage.removeItem(STORAGE_KEYS.TEACHER_SESSION);
}
