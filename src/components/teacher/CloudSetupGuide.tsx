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
  Server
} from 'lucide-react';
import { generateStandaloneHtml } from '../../services/standaloneGenerator';
import {
  saveCustomFirebaseConfig,
  getSavedFirebaseConfig,
  getIsCloudConnected
} from '../../services/storage';
import { FirebaseCustomConfig } from '../../types';

interface CloudSetupGuideProps {
  onConfigUpdated: () => void;
}

export const CloudSetupGuide: React.FC<CloudSetupGuideProps> = ({ onConfigUpdated }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [configJsonInput, setConfigJsonInput] = useState('');
  const [configSaveMsg, setConfigSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isConnected = getIsCloudConnected();
  const currentSaved = getSavedFirebaseConfig();

  // Tải file index.html độc lập
  const handleDownloadStandaloneHtml = () => {
    const htmlContent = generateStandaloneHtml();
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
    const htmlContent = generateStandaloneHtml();
    navigator.clipboard.writeText(htmlContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Lưu cấu hình Firebase người dùng dán vào
  const handleSaveFirebaseConfig = () => {
    try {
      // Cho phép người dùng dán object JS hoặc JSON hoặc đoạn code `const firebaseConfig = { ... }`
      let clean = configJsonInput.trim();
      if (clean.includes('firebaseConfig =')) {
        clean = clean.split('firebaseConfig =')[1];
      }
      if (clean.endsWith(';')) {
        clean = clean.slice(0, -1);
      }

      // Xử lý json key không có nháy kép nếu dán từ JS
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
      {/* 1. HERO BANNER: 1-CLICK TẢI FILE INDEX.HTML ĐỘC LẬP */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-indigo-100">
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Mã nguồn hoàn chỉnh 100% độc lập</span>
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
            className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl text-sm shadow-xl transition flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
          >
            <Download className="w-5 h-5" />
            <span>{downloaded ? 'Đã tải về máy! 🎉' : 'Tải File index.html (1-Click)'}</span>
          </button>
        </div>
      </div>

      {/* 2. CẤU HÌNH FIREBASE NGAY TRÊN ỨNG DỤNG NÀY */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Cấu Hình Kết Nối Firebase Cloud</h3>
              <p className="text-xs text-slate-500">
                Đồng bộ bài thi và điểm số của học sinh trực tiếp vào Database của bạn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>{isConnected ? 'Firebase Cloud Đã Kết Nối 🟢' : 'Đang dùng LocalStorage'}</span>
            </span>
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
              * Nếu không cấu hình, toàn bộ dữ liệu vẫn được lưu trữ an toàn trong máy (LocalStorage).
            </p>
            <button
              onClick={handleSaveFirebaseConfig}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow transition"
            >
              Lưu & Kiểm Tra Kết Nối
            </button>
          </div>
        </div>
      </div>

      {/* 3. HƯỚNG DẪN 3 BƯỚC TẠO FIREBASE FIRESTORE MIỄN PHÍ */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
            1
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">
              Cách Tạo Cơ Sở Dữ Liệu Firebase Firestore Miễn Phí (Trong 3 Phút)
            </h3>
            <p className="text-xs text-slate-500">
              Hoàn toàn miễn phí, lưu trữ hàng ngàn bài thi mà không cần thẻ tín dụng
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs font-black text-indigo-600 bg-indigo-100 px-2.5 py-0.5 rounded-full">
              Bước 1
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Tạo Dự Án Firebase</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Truy cập{' '}
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 font-bold underline inline-flex items-center gap-1"
              >
                console.firebase.google.com <ExternalLink className="w-3 h-3" />
              </a>
              . Đăng nhập bằng Gmail, nhấp <strong>"Add project"</strong> và đặt tên dự án (ví dụ: <code>thi-truc-nghiem</code>).
            </p>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs font-black text-indigo-600 bg-indigo-100 px-2.5 py-0.5 rounded-full">
              Bước 2
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Bật Cloud Firestore</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vào mục <strong>Build &gt; Firestore Database</strong> &gt; Nhấp <strong>"Create database"</strong>.
              Chọn chế độ <strong>"Start in test mode"</strong> (Chế độ thử nghiệm) để học sinh có thể ghi bài nộp mà không cần tài khoản mật khẩu.
            </p>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs font-black text-indigo-600 bg-indigo-100 px-2.5 py-0.5 rounded-full">
              Bước 3
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Lấy Mã firebaseConfig</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vào biểu tượng <strong>Cài đặt dự án (Project Settings)</strong> &gt; kéo xuống mục <strong>"Your apps"</strong> &gt; chọn biểu tượng Web (<strong>&lt;/&gt;</strong>).
              Sao chép object <code>firebaseConfig</code> và dán vào file <code>index.html</code> (dòng 50) hoặc ô cấu hình ở trên!
            </p>
          </div>
        </div>

        {/* Mẹo cấu hình bảo mật Firestore Rules */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
          <p className="font-bold">💡 Lưu ý quan trọng về Firestore Rules (Bảo mật cho học sinh nộp bài):</p>
          <p>
            Vào tab <strong>Rules</strong> của Firestore trong Firebase Console và đảm bảo cho phép đọc/ghi:
          </p>
          <pre className="p-3 bg-white rounded-xl border border-amber-300 font-mono text-slate-800 text-xs mt-1">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
          </pre>
        </div>
      </div>

      {/* 4. HƯỚNG DẪN ĐƯA LÊN WEB MIỄN PHÍ ĐỂ GỬI LINK CHO HỌC SINH */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            2
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">
              Cách Đưa File index.html Lên Mạng Để Lấy Link Gửi Học Sinh (30 Giây)
            </h3>
            <p className="text-xs text-slate-500">
              Không cần mua tên miền, không tốn phí máy chủ, hoạt động 24/7
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Cách 1: Netlify Drop (Nhanh nhất thế giới - 30 giây) */}
          <div className="p-5 bg-gradient-to-b from-slate-50 to-emerald-50/30 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                Khuyên Dùng (30 giây)
              </span>
              <h4 className="font-bold text-slate-900 text-base">Netlify Drop</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                1. Tạo 1 thư mục trên máy tính, bỏ file <code>index.html</code> vừa tải vào thư mục đó.<br />
                2. Mở trình duyệt vào:{' '}
                <a
                  href="https://app.netlify.com/drop"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 font-bold underline inline-flex items-center gap-1"
                >
                  app.netlify.com/drop <ExternalLink className="w-3 h-3" />
                </a><br />
                3. Kéo thả thư mục đó vào trình duyệt. Trong 5 giây bạn sẽ nhận được đường link web (ví dụ: <code>https://bai-tap-12a1.netlify.app</code>) để gửi qua Zalo/Facebook cho học sinh!
              </p>
            </div>
            <div className="text-xs text-emerald-700 font-bold bg-white p-2.5 rounded-xl border border-emerald-100">
              ✔ Miễn phí 100% vĩnh viễn
            </div>
          </div>

          {/* Cách 2: Vercel */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-700 bg-slate-200 px-2.5 py-0.5 rounded-full inline-block">
                Cách 2
              </span>
              <h4 className="font-bold text-slate-900 text-base">Vercel Deploy</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                1. Vào{' '}
                <a
                  href="https://vercel.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 font-bold underline"
                >
                  vercel.com
                </a>{' '}
                và đăng ký tài khoản miễn phí.<br />
                2. Chọn "Add New Project" &gt; Kéo thả thư mục chứa <code>index.html</code>.<br />
                3. Nhấn "Deploy" để nhận link tốc độ cao trên toàn thế giới.
              </p>
            </div>
            <div className="text-xs text-slate-600 font-bold bg-white p-2.5 rounded-xl border border-slate-200">
              ✔ Hỗ trợ tùy chỉnh tên miền riêng
            </div>
          </div>

          {/* Cách 3: GitHub Pages */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-700 bg-slate-200 px-2.5 py-0.5 rounded-full inline-block">
                Cách 3
              </span>
              <h4 className="font-bold text-slate-900 text-base">GitHub Pages</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                1. Tạo repository mới trên{' '}
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 font-bold underline"
                >
                  github.com
                </a>.<br />
                2. Upload file <code>index.html</code> lên nhánh <code>main</code>.<br />
                3. Vào <strong>Settings &gt; Pages</strong> &gt; Chọn nguồn từ nhánh <code>main</code>. Bạn sẽ có link dạng <code>https://tentaikhoan.github.io/tende</code>.
              </p>
            </div>
            <div className="text-xs text-slate-600 font-bold bg-white p-2.5 rounded-xl border border-slate-200">
              ✔ Ổn định và quản lý mã nguồn lâu dài
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
