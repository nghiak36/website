import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Firestore
} from 'firebase/firestore';
import { Exam, Submission, FirebaseCustomConfig } from '../types';
import { INITIAL_EXAMS, INITIAL_SUBMISSIONS } from './defaultData';

const STORAGE_KEYS = {
  EXAMS: 'edtech_exams_data_v2',
  SUBMISSIONS: 'edtech_submissions_data_v2',
  FIREBASE_CONFIG: 'edtech_firebase_config',
  STUDENT_NAME: 'edtech_student_name',
  STUDENT_CLASS: 'edtech_student_class',
  INITIALIZED_CLEAN: 'edtech_initialized_clean_v3'
};

let activeFirestore: Firestore | null = null;
let isFirestoreConnected = false;

// Khởi tạo một lần để xóa sạch tất cả bài tập cũ theo yêu cầu người dùng
(function cleanOldMockDataOnce() {
  try {
    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED_CLEAN)) {
      localStorage.removeItem('edtech_exams_data');
      localStorage.removeItem('edtech_submissions_data');
      localStorage.removeItem('edtech_exams');
      localStorage.removeItem('edtech_submissions');
      localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED_CLEAN, 'true');
    }
  } catch (e) {
    console.error('Lỗi dọn dẹp dữ liệu cũ:', e);
  }
})();

// Khởi tạo cấu hình Firebase nếu người dùng đã lưu
export function initFirestoreFromConfig(config: FirebaseCustomConfig | null): boolean {
  if (!config || !config.apiKey || !config.projectId) {
    activeFirestore = null;
    isFirestoreConnected = false;
    return false;
  }

  try {
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    activeFirestore = getFirestore(app);
    isFirestoreConnected = true;
    return true;
  } catch (error) {
    console.error('Lỗi khi khởi tạo Firebase Firestore:', error);
    activeFirestore = null;
    isFirestoreConnected = false;
    return false;
  }
}

// Lưu cấu hình Firebase vào LocalStorage
export function saveCustomFirebaseConfig(config: FirebaseCustomConfig): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(config));
    return initFirestoreFromConfig(config);
  } catch (e) {
    console.error('Không thể lưu cấu hình Firebase:', e);
    return false;
  }
}

// Lấy cấu hình Firebase đã lưu
export function getSavedFirebaseConfig(): FirebaseCustomConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// Kiểm tra trạng thái kết nối Cloud
export function getIsCloudConnected(): boolean {
  return isFirestoreConnected && activeFirestore !== null;
}

// ======================= EXAMS (QUẢN LÝ ĐỀ THI) =======================

// Tải danh sách đề thi (Firestore hoặc LocalStorage)
export async function loadExamsFromCloud(): Promise<Exam[]> {
  if (activeFirestore) {
    try {
      const examsCol = collection(activeFirestore, 'exams');
      const snap = await getDocs(examsCol);
      if (!snap.empty) {
        const cloudExams: Exam[] = [];
        snap.forEach((d) => {
          cloudExams.push(d.data() as Exam);
        });
        localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(cloudExams));
        return cloudExams;
      }
    } catch (err) {
      console.warn('Không thể đọc Firestore, chuyển sang đọc LocalStorage:', err);
    }
  }

  try {
    const local = localStorage.getItem(STORAGE_KEYS.EXAMS);
    if (local !== null) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Lỗi đọc local exams:', e);
  }

  // Mặc định trả về rỗng vì người dùng đã yêu cầu xóa hết các bài tập đã tạo
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify([]));
  return [];
}

// Lưu đề thi mới (Thêm hoặc Cập nhật)
export async function saveExamToCloud(
  exam: Exam
): Promise<{ success: boolean; cloudSynced: boolean; message: string }> {
  let currentExams: Exam[] = [];
  try {
    const local = localStorage.getItem(STORAGE_KEYS.EXAMS);
    currentExams = local ? JSON.parse(local) : [];
  } catch {
    currentExams = [];
  }

  const existingIndex = currentExams.findIndex((e) => e.id === exam.id);
  if (existingIndex >= 0) {
    currentExams[existingIndex] = exam;
  } else {
    currentExams.unshift(exam);
  }
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(currentExams));

  if (activeFirestore) {
    try {
      const docRef = doc(activeFirestore, 'exams', exam.id);
      await setDoc(docRef, exam, { merge: true });
      return { success: true, cloudSynced: true, message: 'Đã lưu đề kiểm tra lên Cloud thành công!' };
    } catch (err: any) {
      console.error('Lỗi lưu Firestore:', err);
      return {
        success: true,
        cloudSynced: false,
        message: `Đã lưu trên máy. Lỗi đồng bộ Cloud: ${err?.message || 'Không có quyền ghi'}`
      };
    }
  }

  return { success: true, cloudSynced: false, message: 'Đã lưu đề kiểm tra thành công!' };
}

// Xóa đề thi
export async function deleteExamFromStorage(id: string): Promise<Exam[]> {
  let currentExams: Exam[] = [];
  try {
    const local = localStorage.getItem(STORAGE_KEYS.EXAMS);
    currentExams = local ? JSON.parse(local) : [];
  } catch {
    currentExams = [];
  }

  const updated = currentExams.filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(updated));

  if (activeFirestore) {
    try {
      await deleteDoc(doc(activeFirestore, 'exams', id));
    } catch (err) {
      console.warn('Lỗi khi xóa đề trên Firestore:', err);
    }
  }

  return updated;
}

// Xóa nhiều đề thi cùng một lúc
export async function deleteMultipleExamsFromStorage(ids: string[]): Promise<Exam[]> {
  let currentExams: Exam[] = [];
  try {
    const local = localStorage.getItem(STORAGE_KEYS.EXAMS);
    currentExams = local ? JSON.parse(local) : [];
  } catch {
    currentExams = [];
  }

  const idSet = new Set(ids);
  const updated = currentExams.filter((e) => !idSet.has(e.id));
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(updated));

  const db = activeFirestore;
  if (db) {
    try {
      await Promise.all(
        ids.map((id) => deleteDoc(doc(db, 'exams', id)).catch((e) => console.warn(e)))
      );
    } catch (err) {
      console.warn('Lỗi khi xóa nhiều đề trên Firestore:', err);
    }
  }

  return updated;
}

// Xóa tất cả các đề thi
export async function deleteAllExamsFromStorage(): Promise<Exam[]> {
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify([]));

  if (activeFirestore) {
    try {
      const examsCol = collection(activeFirestore, 'exams');
      const snap = await getDocs(examsCol);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
    } catch (err) {
      console.warn('Lỗi khi xóa tất cả đề trên Firestore:', err);
    }
  }

  return [];
}

// ======================= SUBMISSIONS (QUẢN LÝ BÀI NỘP) =======================

// Tải danh sách bài nộp
export async function loadSubmissionsFromCloud(): Promise<Submission[]> {
  if (activeFirestore) {
    try {
      const subCol = collection(activeFirestore, 'submissions');
      const q = query(subCol, orderBy('submittedAt', 'desc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const cloudSubs: Submission[] = [];
        snap.forEach((d) => {
          cloudSubs.push(d.data() as Submission);
        });
        localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(cloudSubs));
        return cloudSubs;
      }
    } catch (err) {
      console.warn('Lỗi đọc submissions từ Cloud, dùng local:', err);
    }
  }

  try {
    const local = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    if (local !== null) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Lỗi đọc local submissions:', e);
  }

  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify([]));
  return [];
}

// Nộp bài thi
export async function submitExamToCloud(
  submission: Submission
): Promise<{ success: boolean; cloudSynced: boolean; message: string }> {
  let currentSubs: Submission[] = [];
  try {
    const local = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    currentSubs = local ? JSON.parse(local) : [];
  } catch {
    currentSubs = [];
  }

  const existingIdx = currentSubs.findIndex((s) => s.id === submission.id);
  if (existingIdx >= 0) {
    currentSubs[existingIdx] = submission;
  } else {
    currentSubs.unshift(submission);
  }
  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(currentSubs));

  if (activeFirestore) {
    try {
      const docRef = doc(activeFirestore, 'submissions', submission.id);
      await setDoc(docRef, submission, { merge: true });
      return { success: true, cloudSynced: true, message: 'Đã gửi kết quả bài làm lên Cloud thành công!' };
    } catch (err: any) {
      console.error('Lỗi nộp bài lên Firestore:', err);
      return {
        success: true,
        cloudSynced: false,
        message: `Đã lưu trên máy. Lỗi đồng bộ Cloud: ${err?.message || 'Lỗi quyền'}`
      };
    }
  }

  return { success: true, cloudSynced: false, message: 'Nộp bài và lưu điểm thành công!' };
}

// Lắng nghe bài nộp theo thời gian thực (Real-time listener)
export function listenSubmissionsFromCloud(callback: (subs: Submission[]) => void): () => void {
  if (activeFirestore) {
    try {
      const subCol = collection(activeFirestore, 'submissions');
      const q = query(subCol, orderBy('submittedAt', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const subs: Submission[] = [];
          snapshot.forEach((d) => {
            subs.push(d.data() as Submission);
          });
          callback(subs);
        },
        (error) => {
          console.warn('Lỗi listener Firestore real-time:', error);
          loadSubmissionsFromCloud().then(callback);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('Không thể thiết lập real-time listener:', e);
    }
  }

  loadSubmissionsFromCloud().then(callback);
  return () => {};
}

// Xóa bài nộp của học sinh (Sửa triệt để cả LocalStorage và Firestore)
export async function deleteSubmission(id: string): Promise<Submission[]> {
  let currentSubs: Submission[] = [];
  try {
    const local = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    currentSubs = local ? JSON.parse(local) : [];
  } catch {
    currentSubs = [];
  }

  const updated = currentSubs.filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(updated));

  // Nếu kết nối Firestore, xóa tài liệu trên Firestore
  if (activeFirestore) {
    try {
      const docRef = doc(activeFirestore, 'submissions', id);
      await deleteDoc(docRef);
      console.log('Đã xóa bài nộp trên Firestore:', id);
    } catch (err) {
      console.error('Lỗi xóa bài nộp trên Firestore:', err);
    }
  }

  return updated;
}

// Xóa nhiều bài nộp cùng lúc (Bulk delete)
export async function deleteMultipleSubmissions(ids: string[]): Promise<Submission[]> {
  let currentSubs: Submission[] = [];
  try {
    const local = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    currentSubs = local ? JSON.parse(local) : [];
  } catch {
    currentSubs = [];
  }

  const idSet = new Set(ids);
  const updated = currentSubs.filter((s) => !idSet.has(s.id));
  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(updated));

  const db = activeFirestore;
  if (db) {
    try {
      await Promise.all(
        ids.map((id) => deleteDoc(doc(db, 'submissions', id)).catch((err) => console.warn(err)))
      );
      console.log('Đã xóa danh sách bài nộp trên Firestore:', ids.length);
    } catch (err) {
      console.error('Lỗi xóa danh sách bài nộp trên Firestore:', err);
    }
  }

  return updated;
}

// Alias để tương thích
export const deleteSubmissionLocal = deleteSubmission;

// Xóa tất cả bài nộp của học sinh
export async function deleteAllSubmissionsFromStorage(): Promise<Submission[]> {
  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify([]));

  if (activeFirestore) {
    try {
      const subCol = collection(activeFirestore, 'submissions');
      const snap = await getDocs(subCol);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
      console.log('Đã xóa tất cả bài nộp trên Firestore');
    } catch (err) {
      console.error('Lỗi xóa tất cả bài nộp trên Firestore:', err);
    }
  }

  return [];
}

// Khởi chạy khi load app
const savedConfig = getSavedFirebaseConfig();
if (savedConfig) {
  initFirestoreFromConfig(savedConfig);
}
