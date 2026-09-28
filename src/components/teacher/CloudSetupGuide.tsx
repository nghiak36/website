import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  Flame,
  Globe,
  Code,
  ShieldCheck,
  Zap,
  Terminal,
  Layers,
  Sparkles,
  Server,
  CloudLightning,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { generateStandaloneHtml } from '../../services/standaloneGenerator';
import {
  saveCustomFirebaseConfig,
  getSavedFirebaseConfig,
  getIsCloudConnected,
  getFirebaseConfigSource,
  testFirestoreConnection
} from '../../services/storage';
import { FirebaseCustomConfig } from '../../types';

interface CloudSetupGuideProps {
  onConfigUpdated: () => void;
}

export const CloudSetupGuide: React.FC<CloudSetupGuideProps> = ({ onConfigUpdated }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [copiedVercelEnv, setCopiedVercelEnv] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [configJsonInput, setConfigJsonInput] = useState('');
  const [configSaveMsg, setConfigSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Trạng thái kiểm tra kết nối Firestore thực tế
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const isConnected = getIsCloudConnected();
  const configSource = getFirebaseConfigSource();
  const currentSaved = getSavedFirebaseConfig();

  // Mẫu biến môi trường cho Vercel
  const sampleVercelEnv = `# Dán các biến này vào Vercel: Project Settings -> Environment Variables
VITE_FIREBASE_API_KEY=${currentSaved?.apiKey || 'AIzaSy...'}
VITE_FIREBASE_AUTH_DOMAIN=${currentSaved?.authDomain || 'your-project.firebaseapp.com'}
VITE_FIREBASE_PROJECT_ID=${currentSaved?.projectId || 'your-project-id'}
VITE_FIREBASE_STORAGE_BUCKET=${currentSaved?.storageBucket || 'your-project.firebasestorage.app'}
VITE_FIREBASE_MESSAGING_SENDER_ID=${currentSaved?.messagingSenderId || '123456789'}
VITE_FIREBASE_APP_ID=${currentSaved?.appId || '1:123456789:web:abc123def456'}
VITE_FIREBASE_MEASUREMENT_ID=${currentSaved?.measurementId || 'G-ABC123XYZ'}`;

  // Mẫu quy tắc Firestore Rules
  const sampleFirestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Đề kiểm tra: Cho phép học sinh đọc để làm bài, giáo viên tạo/sửa/xóa
    match /exams/{examId} {
      allow read, write: if true;
    }
    // Bài nộp học sinh: Cho phép nộp bài, xem danh sách, chấm điểm và xóa
    match /submissions/{submissionId} {
      allow read, write: if true;
    }
    // Cài đặt hệ thống & Tài khoản giáo viên: Đồng bộ mật khẩu đổi trên mọi máy tính
    match /settings/{settingId} {
      allow read, write: if true;
    }
  }
}`;

  // Kiểm tra kết nối Firebase thực tế
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testFirestoreConnection();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: 'Lỗi kiểm tra kết nối: ' + (e?.message || 'Không thể kết nối')
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Tải file index.html độc lập
  const handleDownloadStandaloneHtml = () => {
    const htmlContent = generateStandaloneHtml(getSavedFirebaseConfig());
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'index.html');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  // Sao chép toàn bộ mã nguồn file index.html
  const handleCopyStandaloneCode = () => {
    const htmlContent = generateStandaloneHtml(getSavedFirebaseConfig());
    navigator.clipboard.writeText(htmlContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Sao chép mẫu biến môi trường cho Vercel
  const handleCopyVercelEnv = () => {
    navigator.clipboard.writeText(sampleVercelEnv);
    setCopiedVercelEnv(true);
    setTimeout(() => setCopiedVercelEnv(false), 2000);
  };

  // Sao chép Firestore rules
  const handleCopyRules = () => {
    navigator.clipboard.writeText(sampleFirestoreRules);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  // Lưu cấu hình Firebase người dùng dán vào
  const handleSaveFirebaseConfig = () => {
    try {
      let clean = configJsonInput.trim();
      if (clean.includes('firebaseConfig =')) {
        clean = clean.split('firebaseConfig =')[1];
      }
      if (clean.endsWith(';')) {
        clean = clean.slice(0, -1);
      }

      const parsedConfig = new Function(`return ${clean}`)();

      if (!parsedConfig.apiKey || !parsedConfig.projectId) {
        setConfigSaveMsg({
          type: 'error',
          text: 'Cấu hình thiếu apiKey hoặc projectId. Vui lòng kiểm tra lại!'
        });
        return;
      }

      const success = saveCustomFirebaseConfig(parsedConfig as FirebaseCustomConfig);
      if (success) {
        setConfigSaveMsg({
          type: 'success',
          text: 'Đã lưu cấu hình và kết nối thành công tới Firebase Firestore! 🟢'
        });
        onConfigUpdated();
      } else {
        setConfigSaveMsg({
          type: 'error',
          text: 'Khởi tạo Firebase thất bại. Vui lòng kiểm tra lại tính chính xác của API Key.'
        });
      }
    } catch (e: any) {
      setConfigSaveMsg({
        type: 'error',
        text: 'Định dạng cấu hình không hợp lệ: ' + (e?.message || 'Lỗi cú pháp')
      });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. THANH TRẠNG THÁI KẾT NỐI CLOUD / VERCEL */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base sm:text-lg">
                  Trạng Thái Kết Nối Firebase Cloud
                </h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    isConnected
                      ? configSource === 'env'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-blue-50 text-blue-700 border-blue-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  {isConnected
                    ? configSource === 'env'
                      ? '🟢 Biến môi trường Vercel (Tối ưu nhất)'
                      : '🟡 Lưu trong LocalStorage máy này'
                    : '⚪ Đang chạy Offline (LocalStorage)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isConnected && currentSaved?.projectId ? (
                  <span>
                    Đang kết nối tới dự án Firebase: <strong className="text-indigo-600 font-bold">{currentSaved.projectId}</strong>
                  </span>
                ) : (
                  'Chưa kết nối Cloud. Dữ liệu đề thi và bài làm hiện chỉ lưu trên trình duyệt của máy hiện tại.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !isConnected}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                isConnected
                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Đang kiểm tra...' : 'Kiểm Tra Kết Nối Cloud'}</span>
            </button>
          </div>
        </div>

        {/* Thông báo kết quả kiểm tra kết nối */}
        {testResult && (
          <div
            className={`mt-4 p-4 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p>{testResult.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* 2. HƯỚNG DẪN ĐƯA LÊN VERCEL & KẾT NỐI FIREBASE CHUẨN */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-9 text-white shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-indigo-300">
            <CloudLightning className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-1 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dành cho việc đưa web lên Vercel để gửi học sinh làm bài</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Hướng Dẫn Đưa Lên Vercel & Kết Nối Firebase (3 Bước Chuẩn)
            </h2>
            <p className="text-slate-300 text-xs mt-1 leading-relaxed">
              Khi đưa lên Vercel, cả Thầy/Cô và tất cả học sinh (ở bất kỳ đâu, trên điện thoại hay máy tính) đều kết nối chung vào 1 cơ sở dữ liệu Firebase Firestore duy nhất.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {/* Bước 1: Vercel Settings */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-xl bg-indigo-500 text-white font-black text-xs flex items-center justify-center">1</span>
                <span className="text-[10px] font-bold text-indigo-300 uppercase">Vercel Env Vars</span>
              </div>
              <h4 className="font-bold text-sm text-white">Cấu Hình Biến Môi Trường Trên Vercel</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Trên Vercel: Vào dự án của bạn &gt; <strong>Settings</strong> &gt; <strong>Environment Variables</strong> &gt; dán các biến <code>VITE_FIREBASE_*</code> vào.
              </p>
            </div>
            <button
              onClick={handleCopyVercelEnv}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
            >
              {copiedVercelEnv ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedVercelEnv ? 'Đã sao chép mẫu .env!' : 'Copy Mẫu Biến Vercel (.env)'}</span>
            </button>
          </div>

          {/* Bước 2: Firestore Rules */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center">2</span>
                <span className="text-[10px] font-bold text-amber-300 uppercase">Quyền Firestore</span>
              </div>
              <h4 className="font-bold text-sm text-white">Mở Quyền Firestore Rules</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Vào <strong>Firebase Console &gt; Firestore &gt; Tab Rules</strong>, dán quy tắc cho phép đọc/ghi để học sinh gửi bài thi không bị lỗi <em>"permission-denied"</em>.
              </p>
            </div>
            <button
              onClick={handleCopyRules}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow"
            >
              {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRules ? 'Đã sao chép Rules!' : 'Copy Firestore Rules'}</span>
            </button>
          </div>

          {/* Bước 3: Deploy Vercel */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center">3</span>
                <span className="text-[10px] font-bold text-emerald-300 uppercase">Triển khai</span>
              </div>
              <h4 className="font-bold text-sm text-white">Deploy & Nhận Link Web</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Đã có sẵn file <code>vercel.json</code> trong mã nguồn giúp điều hướng SPA mượt mà không lỗi 404 khi tải lại trang trên Vercel.
              </p>
            </div>
            <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl text-xs font-bold text-center border border-emerald-500/30">
              ✔ vercel.json đã sẵn sàng
            </div>
          </div>
        </div>
      </div>

      {/* 3. HERO BANNER: 1-CLICK TẢI FILE INDEX.HTML ĐỘC LẬP */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-indigo-100">
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Tùy chọn phụ: Chạy file độc lập không cần build</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Tải Về File <code className="bg-white/20 px-2 py-0.5 rounded text-amber-200">index.html</code> Duy Nhất
          </h2>
          <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed">
            Chứa trọn gói: Giao diện Tiếng Việt Responsive, Tailwind CSS, Lucide Icons, SDK Firebase Firestore Compat v10,
            chấm điểm tự động và xuất Excel UTF-8. Nhấp đúp chuột là chạy ngay trên máy tính hoặc đưa lên Web miễn phí!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleCopyStandaloneCode}
            className="px-5 py-3 bg-white/15 hover:bg-white/25 text-white font-bold rounded-2xl text-xs backdrop-blur-md transition flex items-center justify-center gap-2 border border-white/20"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Đã sao chép mã!' : 'Sao chép mã nguồn'}</span>
          </button>

          <button
            onClick={handleDownloadStandaloneHtml}
            className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl text-sm shadow-xl transition flex items-center justify-center gap-2 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Download className="w-5 h-5" />
            <span>{downloaded ? 'Đã tải về máy! 🎉' : 'Tải File index.html (1-Click)'}</span>
          </button>
        </div>
      </div>

      {/* 4. CẤU HÌNH FIREBASE THỦ CÔNG (NẾU KHÔNG DÙNG BIẾN VERCEL) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Dán Cấu Hình Firebase Thủ Công (Tùy Chọn)</h3>
              <p className="text-xs text-slate-500">
                Nếu không dùng biến môi trường Vercel, Thầy/Cô có thể dán trực tiếp đoạn mã <code>firebaseConfig</code> vào đây để lưu trên máy
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>Dán đoạn mã firebaseConfig của bạn vào ô dưới đây:</span>
            {currentSaved && (
              <span className="text-indigo-600 font-normal">
                Project ID hiện tại: <strong>{currentSaved.projectId}</strong>
              </span>
            )}
          </label>

          <textarea
            rows={4}
            value={configJsonInput}
            onChange={(e) => setConfigJsonInput(e.target.value)}
            placeholder={`{\n  apiKey: "AIzaSy...",\n  authDomain: "my-exam.firebaseapp.com",\n  projectId: "my-exam-123",\n  storageBucket: "...",\n  messagingSenderId: "...",\n  appId: "..."\n}`}
            className="w-full p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-800 custom-scrollbar"
          />

          {configSaveMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-bold ${
                configSaveMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {configSaveMsg.text}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-400">
              * Khuyên dùng thiết lập biến môi trường trên Vercel để học sinh tự động kết nối mà không cần cấu hình lại.
            </p>
            <button
              onClick={handleSaveFirebaseConfig}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow transition cursor-pointer"
            >
              Lưu & Kích Hoạt Firebase
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
