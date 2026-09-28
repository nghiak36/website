/**
 * Trình tạo file index.html duy nhất (Single Page Application độc lập)
 * Dành cho Giáo viên & Học sinh Tin Học THCS (Khối 6, 7, 8, 9).
 * - Có bảo vệ ID & Mật khẩu tab Giáo viên (Mặc định: giaovien / 123456).
 * - Hỗ trợ cả câu hỏi Trắc nghiệm và Tự luận.
 * - Cho phép chèn hình ảnh vào câu hỏi (Upload file ảnh hoặc dán link).
 * - Hỗ trợ dán văn bản Word (.docx/txt) để tự động tạo câu hỏi.
 * - Nhúng sẵn Firebase SDK v10 (Compat), Tailwind CDN, Lucide Icons.
 */

import { FirebaseCustomConfig } from '../types';

export function generateStandaloneHtml(customConfig?: FirebaseCustomConfig | null): string {
  const cfg = customConfig || {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: ''
  };

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EdTech ExamHub THCS - Tin Học Khối 6, 7, 8, 9</title>
  <meta name="description" content="Hệ thống thi trắc nghiệm & tự luận Tin học THCS dành cho Học sinh & Giáo viên kết nối Firebase Firestore">
  
  <!-- 1. Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- 2. Lucide Icons CDN -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <!-- 3. Firebase SDK v10 (Compat) -->
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>

  <!-- Font chữ tiếng Việt chuẩn -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col">

  <!-- ========================================== -->
  <!-- BƯỚC CẤU HÌNH FIREBASE: DÁN API KEY VÀO ĐÂY -->
  <!-- ========================================== -->
  <script>
    /**
     * Dán toàn bộ object firebaseConfig của bạn từ Firebase Console vào dưới đây:
     * (Nếu để trống, hệ thống sẽ tự động lưu dữ liệu an toàn trên LocalStorage của máy)
     */
    const firebaseConfig = {
      apiKey: "${cfg.apiKey || ''}",
      authDomain: "${cfg.authDomain || ''}",
      projectId: "${cfg.projectId || ''}",
      storageBucket: "${cfg.storageBucket || ''}",
      messagingSenderId: "${cfg.messagingSenderId || ''}",
      appId: "${cfg.appId || ''}",
      measurementId: "${cfg.measurementId || ''}"
    };

    let db = null;
    let isCloudActive = false;

    if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId) {
      try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        isCloudActive = true;
        console.log("Firebase Firestore đã được kết nối thành công!");
      } catch (err) {
        console.error("Lỗi khởi tạo Firebase:", err);
      }
    }
  </script>

  <!-- ========================================== -->
  <!-- THANH ĐIỀU HƯỚNG CHÍNH (ROLE SWITCHER)     -->
  <!-- ========================================== -->
  <header class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
    <div class="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <!-- Logo & Tên ứng dụng -->
      <div class="flex items-center gap-3 cursor-pointer" onclick="switchRole('student')">
        <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-100">
          <i data-lucide="graduation-cap" class="w-6 h-6"></i>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-extrabold text-lg text-slate-900 tracking-tight">EdTech ExamHub <span class="text-indigo-600">THCS</span></h1>
            <span id="cloudStatusBadge" class="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 border border-amber-200">
              Offline (Local)
            </span>
          </div>
          <p class="text-xs text-slate-500">Tin Học Khối 6, 7, 8, 9 - Trắc nghiệm & Tự luận</p>
        </div>
      </div>

      <!-- Role Switcher Tabs (Có khóa Giáo viên) -->
      <div class="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-sm font-semibold">
        <button id="btnRoleStudent" onclick="switchRole('student')" class="px-4 py-1.5 rounded-lg transition-all flex items-center gap-2 bg-white text-indigo-700 shadow-xs">
          <i data-lucide="user-round" class="w-4 h-4"></i>
          <span>Học Sinh</span>
        </button>
        <button id="btnRoleTeacher" onclick="handleTeacherTabClick()" class="px-4 py-1.5 rounded-lg transition-all flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <i data-lucide="shield-check" class="w-4 h-4 text-indigo-600"></i>
          <span>Giáo Viên (Khóa ID/Pass)</span>
        </button>
      </div>
    </div>
  </header>

  <!-- ========================================== -->
  <!-- VÙNG HIỂN THỊ NỘI DUNG CHÍNH               -->
  <!-- ========================================== -->
  <main class="flex-1 max-w-6xl w-full mx-auto px-4 py-6">

    <!-- 1. GIAO DIỆN HỌC SINH -->
    <div id="studentContainer" class="space-y-6">
      
      <!-- Card Thông tin học sinh -->
      <div class="bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-900 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="space-y-1 text-center md:text-left">
          <h2 class="text-xl md:text-2xl font-bold flex items-center justify-center md:justify-start gap-2">
            <span>Xin chào,</span>
            <span id="displayStudentName" class="underline decoration-indigo-300">Em học sinh</span> 👋
          </h2>
          <p class="text-indigo-100 text-sm">
            Lớp: <span id="displayStudentClass" class="font-semibold bg-white/20 px-2 py-0.5 rounded text-white">Chưa đặt</span>
            • Chọn bài kiểm tra Tin học theo đúng khối lớp bên dưới để bắt đầu làm bài.
          </p>
        </div>
        <button onclick="openStudentModal()" class="px-4 py-2 bg-white text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-50 transition shadow">
          Đổi Họ tên & Lớp
        </button>
      </div>

      <!-- Tab Lọc 4 Khối Lớp (Khối 6, 7, 8, 9) -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1">
        <button onclick="filterGrade('all')" id="btnGradeAll" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 text-white border border-indigo-600 shadow-xs">
          Tất cả khối
        </button>
        <button onclick="filterGrade('Khối 6')" id="btnGrade6" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50">
          Khối 6
        </button>
        <button onclick="filterGrade('Khối 7')" id="btnGrade7" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50">
          Khối 7
        </button>
        <button onclick="filterGrade('Khối 8')" id="btnGrade8" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50">
          Khối 8
        </button>
        <button onclick="filterGrade('Khối 9')" id="btnGrade9" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50">
          Khối 9
        </button>
      </div>

      <!-- Danh sách bài thi (Grid) -->
      <div id="examGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <!-- Javascript render dynamic cards -->
      </div>
    </div>

    <!-- 2. GIAO DIỆN LÀM BÀI THI -->
    <div id="examTakingContainer" class="hidden space-y-6">
      <!-- Header đếm ngược -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-16 z-30 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span id="takingGradeBadge" class="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">Khối 6</span>
            <h3 id="takingExamTitle" class="font-bold text-slate-900 text-base md:text-lg">Tên đề thi</h3>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">Thí sinh: <span id="takingStudentName" class="font-semibold text-slate-800"></span> - Lớp: <span id="takingStudentClass" class="font-semibold text-slate-800"></span></p>
        </div>

        <div class="flex items-center gap-3">
          <div id="timerBadge" class="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl font-mono text-lg font-extrabold shadow-inner">
            <i data-lucide="clock" class="w-5 h-5 text-indigo-600"></i>
            <span id="countdownText">15:00</span>
          </div>

          <button onclick="confirmSubmitExam()" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 text-sm">
            <i data-lucide="check-circle" class="w-4 h-4"></i>
            <span>Nộp Bài</span>
          </button>
        </div>
      </div>

      <!-- Câu hỏi & Palette -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div class="lg:col-span-3 space-y-6" id="questionsContainer"></div>
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl border border-slate-200 p-4 sticky top-36 shadow-xs space-y-4">
            <h4 class="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>Bảng Trả Lời</span>
              <span id="answeredCountBadge" class="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-semibold">0/0</span>
            </h4>
            <div id="quickNavGrid" class="grid grid-cols-5 gap-2"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. MÀN HÌNH KẾT QUẢ -->
    <div id="resultContainer" class="hidden space-y-6 max-w-3xl mx-auto">
      <div class="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-lg space-y-6">
        <div class="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-md">
          <i data-lucide="trophy" class="w-10 h-10"></i>
        </div>

        <div class="space-y-1">
          <h2 class="text-2xl md:text-3xl font-black text-slate-900">Chúc Mừng Em Đã Hoàn Thành!</h2>
          <p id="resultExamTitle" class="text-slate-500 font-medium text-sm">Kiểm tra Tin Học</p>
        </div>

        <div class="py-6 px-4 bg-slate-50 rounded-2xl border border-slate-100 max-w-sm mx-auto">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Điểm Số Đạt Được</p>
          <div class="flex items-baseline justify-center gap-1">
            <span id="resultScore" class="text-5xl font-black text-indigo-600">10.0</span>
            <span class="text-xl font-bold text-slate-400">/ 10</span>
          </div>
          <p id="resultRatingBadge" class="mt-2 inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
            Xuất Sắc! 🎉
          </p>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100">
          <button onclick="backToStudentList()" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition text-sm flex items-center gap-2">
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
            <span>Về Danh Sách Đề Thi</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 4. GIAO DIỆN GIÁO VIÊN (ĐÃ BẢO VỆ MẬT KHẨU) -->
    <div id="teacherContainer" class="hidden space-y-6">

      <!-- Header Giáo viên & Đăng xuất -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            <i data-lucide="shield-check" class="w-6 h-6"></i>
          </div>
          <div>
            <h3 class="font-extrabold text-slate-900 text-base">Bàn Làm Việc Giáo Viên Tin Học THCS</h3>
            <p class="text-xs text-slate-500">Đã đăng nhập tài khoản an toàn • Phân quyền quản lý Khối 6, 7, 8, 9</p>
          </div>
        </div>

        <button onclick="logoutTeacher()" class="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs transition border border-red-200 flex items-center gap-1.5">
          <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
          <span>Khóa & Đăng Xuất</span>
        </button>
      </div>

      <!-- Thống kê tổng quan -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <i data-lucide="file-text" class="w-5 h-5"></i>
          </div>
          <div>
            <p class="text-xs text-slate-500 font-medium">Tổng Đề Thi</p>
            <p id="statTotalExams" class="text-xl font-black text-slate-900">0</p>
          </div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i data-lucide="check-check" class="w-5 h-5"></i>
          </div>
          <div>
            <p class="text-xs text-slate-500 font-medium">Bài Đã Nộp</p>
            <p id="statTotalSubmissions" class="text-xl font-black text-slate-900">0</p>
          </div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <i data-lucide="star" class="w-5 h-5"></i>
          </div>
          <div>
            <p class="text-xs text-slate-500 font-medium">Điểm TB</p>
            <p id="statAverageScore" class="text-xl font-black text-slate-900">0.0</p>
          </div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <i data-lucide="award" class="w-5 h-5"></i>
          </div>
          <div>
            <p class="text-xs text-slate-500 font-medium">Đạt (>=5đ)</p>
            <p id="statPassRate" class="text-xl font-black text-slate-900">0%</p>
          </div>
        </div>
      </div>

      <!-- Navigation Sub-Tabs -->
      <div class="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button onclick="switchTeacherTab('submissions')" id="btnTabSubmissions" class="px-4 py-2 font-bold text-sm rounded-xl transition bg-indigo-600 text-white flex items-center gap-2 shadow-xs">
          <i data-lucide="users" class="w-4 h-4"></i>
          <span>Quản Lý Bài Nộp</span>
        </button>
        <button onclick="switchTeacherTab('create')" id="btnTabCreate" class="px-4 py-2 font-bold text-sm rounded-xl transition text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2">
          <i data-lucide="plus-circle" class="w-4 h-4"></i>
          <span>Soạn Đề Mới (Word/Ảnh/Tự Luận)</span>
        </button>
      </div>

      <!-- Tab A: Quản Lý Bài Nộp -->
      <div id="teacherTabSubmissions" class="space-y-4">
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2.5 flex-1">
            <input type="text" id="filterStudentName" oninput="applyFilters()" placeholder="Tìm theo tên học sinh..." class="px-3 py-1.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-xs w-full">
            <select id="filterGradeSelect" onchange="applyFilters()" class="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold bg-white">
              <option value="">Tất cả các khối (6,7,8,9)</option>
              <option value="Khối 6">Khối 6</option>
              <option value="Khối 7">Khối 7</option>
              <option value="Khối 8">Khối 8</option>
              <option value="Khối 9">Khối 9</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="promptDeleteAllSubmissions()" class="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs border border-red-200 transition flex items-center gap-1.5" title="Xóa toàn bộ bài làm của học sinh">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
              <span>Xóa Hết Bài Nộp</span>
            </button>
            <button onclick="exportToCsv()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-1.5">
              <i data-lucide="download" class="w-4 h-4"></i>
              <span>Tải Bảng Điểm (Excel CSV)</span>
            </button>
          </div>
        </div>

        <!-- Thanh thao tác chọn nhiều bài nộp (Khung Check) -->
        <div id="bulkSubsBar" class="hidden bg-indigo-900 text-white rounded-xl p-3 shadow-md flex items-center justify-between gap-3 animate-in fade-in">
          <div class="flex items-center gap-2 text-xs font-bold">
            <i data-lucide="check-square" class="w-4 h-4 text-indigo-300"></i>
            <span>Đã chọn <strong id="selectedSubsCount" class="text-white text-sm">0</strong> bài nộp</span>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="clearSelectedSubs()" class="px-3 py-1 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-lg transition">Bỏ chọn</button>
            <button onclick="promptDeleteSelectedSubs()" class="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-lg shadow transition flex items-center gap-1.5">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              <span>Xóa bài đã chọn</span>
            </button>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th class="py-3 px-3 w-10 text-center">
                    <input type="checkbox" id="selectAllSubs" onchange="toggleSelectAllSubs(this.checked)" class="w-4 h-4 text-indigo-600 rounded cursor-pointer">
                  </th>
                  <th class="py-3 px-3 w-12 text-center">STT</th>
                  <th class="py-3 px-4">Họ và Tên</th>
                  <th class="py-3 px-4">Khối/Lớp</th>
                  <th class="py-3 px-4">Đề Kiểm Tra</th>
                  <th class="py-3 px-4 text-center">Điểm Số</th>
                  <th class="py-3 px-4">Thời Gian Nộp</th>
                  <th class="py-3 px-4 text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody id="submissionsTableBody" class="divide-y divide-slate-100"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab B: Soạn Đề Mới -->
      <div id="teacherTabCreate" class="hidden space-y-6">
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div class="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h3 class="text-lg font-bold text-slate-900">Soạn Đề Kiểm Tra Tin Học THCS Mới</h3>
              <p class="text-xs text-slate-500">Hỗ trợ Trắc nghiệm, Tự luận, chèn hình ảnh minh họa và nạp đề mẫu</p>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="pasteFromWordTextPrompt()" class="text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1">
                <i data-lucide="file-up" class="w-3.5 h-3.5"></i>
                <span>Dán đề từ Word</span>
              </button>
              <button onclick="fillSampleInformatics(document.getElementById('newExamGrade').value)" class="text-xs font-semibold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition flex items-center gap-1">
                <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                <span>Điền mẫu theo khối</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="space-y-1 md:col-span-2">
              <label class="text-xs font-bold text-slate-700">Tên đề kiểm tra *</label>
              <input type="text" id="newExamTitle" placeholder="Ví dụ: Kiểm tra 15 phút - Tin học 6: Thiết bị vào ra" class="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Khối lớp *</label>
              <select id="newExamGrade" class="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="Khối 6">Khối 6</option>
                <option value="Khối 7">Khối 7</option>
                <option value="Khối 8">Khối 8</option>
                <option value="Khối 9">Khối 9</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Thời gian (Phút) *</label>
              <input type="number" id="newExamDuration" value="15" min="1" max="180" class="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                <i data-lucide="list-ordered" class="w-4 h-4 text-indigo-600"></i>
                <span>Danh Sách Câu Hỏi (<span id="creatorQuestionCount">0</span> câu)</span>
              </h4>
              <div class="flex items-center gap-2">
                <button onclick="addEmptyQuestion('multiple_choice')" class="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1">
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  <span>+ Trắc nghiệm</span>
                </button>
                <button onclick="addEmptyQuestion('essay')" class="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition flex items-center gap-1">
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  <span>+ Tự luận</span>
                </button>
              </div>
            </div>

            <div id="questionsBuilderList" class="space-y-4"></div>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button onclick="publishExam()" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2 text-sm">
              <i data-lucide="cloud-upload" class="w-4 h-4"></i>
              <span>Đăng Đề Lên Hệ Thống Cloud</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- ========================================== -->
  <!-- MODAL BẢO MẬT: ĐĂNG NHẬP GIÁO VIÊN (ID & PASS) -->
  <!-- ========================================== -->
  <div id="teacherAuthModal" class="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
      <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
        <i data-lucide="shield-check" class="w-8 h-8"></i>
      </div>
      <div class="text-center space-y-1">
        <h3 class="text-xl font-bold text-slate-900">Khu Vực Dành Cho Giáo Viên</h3>
        <p class="text-xs text-slate-500">Học sinh không thể vào được tab này nếu không có ID và Mật khẩu</p>
      </div>

      <div id="teacherAuthError" class="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold hidden"></div>
      <div id="teacherAuthSuccess" class="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold hidden"></div>

      <!-- Form đăng nhập bình thường -->
      <div id="teacherLoginForm" class="space-y-3">
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700">Tên đăng nhập (ID) *</label>
          <input type="text" id="teacherInputId" placeholder="ID mặc định: admin" class="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
        </div>
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-slate-700">Mật khẩu *</label>
            <button type="button" onclick="showForgotPasswordForm()" class="text-xs text-indigo-600 hover:underline font-bold">Quên mật khẩu?</button>
          </div>
          <input type="password" id="teacherInputPass" placeholder="Mật khẩu mặc định: admin" class="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
        </div>
        <div class="p-3 bg-indigo-50 rounded-xl text-xs text-indigo-900">
          🔑 <strong>Tài khoản mặc định ban đầu:</strong><br>
          ID: <code>admin</code> • Mật khẩu: <code>admin</code>
        </div>
        <div class="flex items-center gap-3">
          <button onclick="closeTeacherModal()" class="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">
            Học Sinh Quay Lại
          </button>
          <button onclick="checkTeacherLogin()" class="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow">
            Đăng Nhập
          </button>
        </div>
      </div>

      <!-- Form đổi mật khẩu bắt buộc lần đầu -->
      <div id="teacherForceChangePassForm" class="space-y-3 hidden">
        <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
          ⚠️ <strong>Lưu ý:</strong> Lần đầu đăng nhập, bạn bắt buộc phải đổi mật khẩu mới để bảo mật hệ thống!
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700">Mật khẩu mới (ít nhất 4 ký tự) *</label>
          <input type="password" id="teacherNewPass" placeholder="Nhập mật khẩu mới..." class="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm">
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700">Xác nhận lại mật khẩu mới *</label>
          <input type="password" id="teacherConfirmNewPass" placeholder="Nhập lại mật khẩu mới..." class="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm">
        </div>
        <button onclick="submitNewPassword()" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow">
          Lưu Mật Khẩu Mới & Vào Hệ Thống
        </button>
      </div>

      <!-- Form khôi phục mật khẩu qua SĐT 0702788047 -->
      <div id="teacherForgotPassForm" class="space-y-3 hidden">
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700">Số điện thoại xác thực Giáo Viên *</label>
          <input type="text" id="teacherPhoneRecovery" placeholder="Nhập số điện thoại: 0702788047" class="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold">
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700">Mật khẩu mới muốn đặt *</label>
          <input type="password" id="teacherPhoneResetPass" placeholder="Nhập mật khẩu mới..." class="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm">
        </div>
        <div class="flex items-center gap-3">
          <button onclick="backToTeacherLogin()" class="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">
            Quay Lại
          </button>
          <button onclick="submitPhoneRecovery()" class="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow">
            Đặt Lại Mật Khẩu
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL NHẬP HỌ TÊN HỌC SINH -->
  <div id="studentModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
      <h3 class="text-lg font-bold text-slate-900 text-center">Thông Tin Học Sinh</h3>
      <p class="text-xs text-slate-500 text-center">Nhập Họ tên & chọn Lớp để bắt đầu làm bài</p>
      <div class="space-y-3">
        <div>
          <label class="text-xs font-bold text-slate-700 mb-1 block">Họ và tên của bạn *</label>
          <input type="text" id="inputStudentName" placeholder="Ví dụ: Nguyễn Văn An" class="w-full px-3.5 py-2.5 border rounded-xl text-sm font-medium">
        </div>
        <div>
          <label class="text-xs font-bold text-slate-700 mb-1 block">Lớp học (Chọn danh sách thả xuống) *</label>
          <select id="inputStudentClass" class="w-full px-3.5 py-2.5 border rounded-xl text-sm font-bold text-indigo-700">
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
      </div>
      <button onclick="saveStudentProfile()" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow">
        Bắt Đầu Vào Học
      </button>
    </div>
  </div>

  <!-- MODAL XÁC NHẬN XÓA (AN TOÀN TUYỆT ĐỐI, KHÔNG DÙNG WINDOW.CONFIRM) -->
  <div id="standaloneDeleteModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 border border-slate-100">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
          <i data-lucide="trash-2" class="w-6 h-6"></i>
        </div>
        <div>
          <h3 id="deleteModalTitle" class="text-base font-black text-slate-900">Xác nhận xóa</h3>
          <p class="text-xs text-slate-500">Hành động này không thể hoàn tác sau khi thực hiện</p>
        </div>
      </div>
      <div id="deleteModalMessage" class="p-3.5 bg-red-50 text-red-800 rounded-xl text-xs leading-relaxed"></div>
      <div class="flex items-center justify-end gap-2.5 pt-2">
        <button onclick="closeDeleteModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition">Hủy bỏ</button>
        <button id="btnConfirmDeleteAction" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow flex items-center gap-1.5 transition">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          <span>Xác Nhận Xóa</span>
        </button>
      </div>
    </div>
  </div>

  <script>
    let currentRole = 'student';
    let isTeacherAuth = false;
    let selectedGradeFilter = 'all';
    let activeExam = null;
    let examTimerInterval = null;
    let remainingSeconds = 0;
    let currentAnswers = {};
    let currentEssayAnswers = {};
    let teacherQuestionsDraft = [];

    // Mật khẩu giáo viên lưu trong máy
    let teacherCredentials = {
      id: localStorage.getItem('edtech_teacher_id') || 'admin',
      pass: localStorage.getItem('edtech_teacher_pass') || 'admin',
      hasChanged: localStorage.getItem('edtech_teacher_has_changed') === 'true',
      recoveryPhone: '0702788047'
    };

    // Tự động kéo tài khoản admin từ Cloud Firestore nếu có kết nối
    if (db) {
      db.collection('settings').doc('admin_account').get().then(doc => {
        if (doc && doc.exists) {
          const d = doc.data();
          if (d && d.passwordHash) {
            teacherCredentials.pass = d.passwordHash;
            teacherCredentials.id = d.username || 'admin';
            teacherCredentials.hasChanged = !!d.hasChangedInitialPassword;
            localStorage.setItem('edtech_teacher_id', teacherCredentials.id);
            localStorage.setItem('edtech_teacher_pass', teacherCredentials.pass);
            if (d.hasChangedInitialPassword) {
              localStorage.setItem('edtech_teacher_has_changed', 'true');
            }
          }
        }
      }).catch(e => console.warn(e));
    }

    // Đề thi ban đầu (Xóa hết đề cũ theo yêu cầu người dùng)
    const DEFAULT_EXAMS = [];

    function getStoredExams() {
      try {
        const d = localStorage.getItem('edtech_exams');
        return d ? JSON.parse(d) : DEFAULT_EXAMS;
      } catch (e) {
        return DEFAULT_EXAMS;
      }
    }

    function saveStoredExams(exams) {
      localStorage.setItem('edtech_exams', JSON.stringify(exams));
    }

    function getStoredSubmissions() {
      try {
        const d = localStorage.getItem('edtech_submissions');
        return d ? JSON.parse(d) : [];
      } catch (e) {
        return [];
      }
    }

    function saveStoredSubmissions(subs) {
      localStorage.setItem('edtech_submissions', JSON.stringify(subs));
    }

    // Role switcher có bảo mật
    function handleTeacherTabClick() {
      if (isTeacherAuth) {
        switchRole('teacher');
      } else {
        document.getElementById('teacherAuthModal').classList.remove('hidden');
        document.getElementById('teacherLoginForm').classList.remove('hidden');
        document.getElementById('teacherForceChangePassForm').classList.add('hidden');
        document.getElementById('teacherForgotPassForm').classList.add('hidden');
        document.getElementById('teacherAuthError').classList.add('hidden');
        document.getElementById('teacherAuthSuccess').classList.add('hidden');
      }
    }

    function closeTeacherModal() {
      document.getElementById('teacherAuthModal').classList.add('hidden');
      document.getElementById('teacherAuthError').classList.add('hidden');
      document.getElementById('teacherAuthSuccess').classList.add('hidden');
    }

    async function checkTeacherLogin() {
      const id = document.getElementById('teacherInputId').value.trim();
      const pass = document.getElementById('teacherInputPass').value;
      const errBox = document.getElementById('teacherAuthError');

      let isMatch = id.toLowerCase() === teacherCredentials.id.toLowerCase() && pass === teacherCredentials.pass;
      if (!isMatch && db) {
        try {
          const doc = await db.collection('settings').doc('admin_account').get();
          if (doc && doc.exists) {
            const d = doc.data();
            if (d && d.passwordHash) {
              teacherCredentials.pass = d.passwordHash;
              teacherCredentials.id = d.username || 'admin';
              teacherCredentials.hasChanged = !!d.hasChangedInitialPassword;
              localStorage.setItem('edtech_teacher_id', teacherCredentials.id);
              localStorage.setItem('edtech_teacher_pass', teacherCredentials.pass);
              if (d.hasChangedInitialPassword) {
                localStorage.setItem('edtech_teacher_has_changed', 'true');
              }
              isMatch = id.toLowerCase() === teacherCredentials.id.toLowerCase() && pass === teacherCredentials.pass;
            }
          }
        } catch(e) { console.warn(e); }
      }

      if (isMatch) {
        const needsChange = !teacherCredentials.hasChanged || (id.toLowerCase() === 'admin' && pass === 'admin');
        if (needsChange) {
          document.getElementById('teacherLoginForm').classList.add('hidden');
          document.getElementById('teacherForceChangePassForm').classList.remove('hidden');
          errBox.classList.add('hidden');
        } else {
          isTeacherAuth = true;
          closeTeacherModal();
          switchRole('teacher');
        }
      } else {
        errBox.innerText = 'ID hoặc Mật khẩu không đúng! (Mặc định ban đầu: admin / admin)';
        errBox.classList.remove('hidden');
      }
    }

    function submitNewPassword() {
      const p1 = document.getElementById('teacherNewPass').value;
      const p2 = document.getElementById('teacherConfirmNewPass').value;
      const errBox = document.getElementById('teacherAuthError');

      if (!p1 || p1.length < 4) {
        errBox.innerText = 'Mật khẩu mới phải có ít nhất 4 ký tự!';
        errBox.classList.remove('hidden');
        return;
      }
      if (p1 === 'admin') {
        errBox.innerText = 'Vui lòng chọn mật khẩu khác mật khẩu mặc định "admin"!';
        errBox.classList.remove('hidden');
        return;
      }
      if (p1 !== p2) {
        errBox.innerText = 'Mật khẩu xác nhận không trùng khớp!';
        errBox.classList.remove('hidden');
        return;
      }

      teacherCredentials.pass = p1;
      teacherCredentials.hasChanged = true;
      localStorage.setItem('edtech_teacher_pass', p1);
      localStorage.setItem('edtech_teacher_has_changed', 'true');

      if (db) {
        db.collection('settings').doc('admin_account').set({
          username: teacherCredentials.id,
          passwordHash: p1,
          hasChangedInitialPassword: true,
          recoveryPhone: '0702788047',
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(e => console.warn(e));
      }

      alert('Đổi mật khẩu thành công! Mật khẩu mới đã được lưu và đồng bộ lên Cloud.');
      isTeacherAuth = true;
      closeTeacherModal();
      switchRole('teacher');
    }

    function showForgotPasswordForm() {
      document.getElementById('teacherLoginForm').classList.add('hidden');
      document.getElementById('teacherForgotPassForm').classList.remove('hidden');
      document.getElementById('teacherAuthError').classList.add('hidden');
      document.getElementById('teacherAuthSuccess').classList.add('hidden');
    }

    function backToTeacherLogin() {
      document.getElementById('teacherLoginForm').classList.remove('hidden');
      document.getElementById('teacherForgotPassForm').classList.add('hidden');
      document.getElementById('teacherForceChangePassForm').classList.add('hidden');
      document.getElementById('teacherAuthError').classList.add('hidden');
      document.getElementById('teacherAuthSuccess').classList.add('hidden');
    }

    function submitPhoneRecovery() {
      const phone = document.getElementById('teacherPhoneRecovery').value.replace(/[\\s\\.\\-]/g, '').trim();
      const newP = document.getElementById('teacherPhoneResetPass').value;
      const errBox = document.getElementById('teacherAuthError');
      const succBox = document.getElementById('teacherAuthSuccess');

      if (phone !== '0702788047') {
        errBox.innerText = 'Số điện thoại không đúng! Số điện thoại đăng ký là: 0702788047';
        errBox.classList.remove('hidden');
        succBox.classList.add('hidden');
        return;
      }
      if (!newP || newP.length < 4) {
        errBox.innerText = 'Mật khẩu mới phải có ít nhất 4 ký tự!';
        errBox.classList.remove('hidden');
        succBox.classList.add('hidden');
        return;
      }

      teacherCredentials.pass = newP;
      teacherCredentials.hasChanged = true;
      localStorage.setItem('edtech_teacher_pass', newP);
      localStorage.setItem('edtech_teacher_has_changed', 'true');

      if (db) {
        db.collection('settings').doc('admin_account').set({
          username: teacherCredentials.id,
          passwordHash: newP,
          hasChangedInitialPassword: true,
          recoveryPhone: '0702788047',
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(e => console.warn(e));
      }

      succBox.innerText = 'Khôi phục mật khẩu thành công! Bạn có thể đăng nhập ngay.';
      succBox.classList.remove('hidden');
      errBox.classList.add('hidden');

      setTimeout(() => {
        backToTeacherLogin();
        document.getElementById('teacherInputPass').value = newP;
      }, 1500);
    }

    function logoutTeacher() {
      isTeacherAuth = false;
      switchRole('student');
    }

    function switchRole(role) {
      currentRole = role;
      const btnStudent = document.getElementById('btnRoleStudent');
      const btnTeacher = document.getElementById('btnRoleTeacher');
      const studentBox = document.getElementById('studentContainer');
      const teacherBox = document.getElementById('teacherContainer');
      const examBox = document.getElementById('examTakingContainer');
      const resultBox = document.getElementById('resultContainer');

      examBox.classList.add('hidden');
      resultBox.classList.add('hidden');

      if (role === 'student') {
        btnStudent.className = 'px-4 py-1.5 rounded-lg transition-all flex items-center gap-2 bg-white text-indigo-700 shadow-xs';
        btnTeacher.className = 'px-4 py-1.5 rounded-lg transition-all flex items-center gap-2 text-slate-600 hover:text-slate-900';
        studentBox.classList.remove('hidden');
        teacherBox.classList.add('hidden');
        refreshExamList();
      } else {
        btnTeacher.className = 'px-4 py-1.5 rounded-lg transition-all flex items-center gap-2 bg-white text-indigo-700 shadow-xs';
        btnStudent.className = 'px-4 py-1.5 rounded-lg transition-all flex items-center gap-2 text-slate-600 hover:text-slate-900';
        studentBox.classList.add('hidden');
        teacherBox.classList.remove('hidden');
        loadTeacherDashboard();
      }
      lucide.createIcons();
    }

    function filterGrade(grade) {
      selectedGradeFilter = grade;
      ['all', '6', '7', '8', '9'].forEach(g => {
        const btn = document.getElementById(g === 'all' ? 'btnGradeAll' : 'btnGrade' + g);
        if (btn) {
          const isAct = (g === 'all' && grade === 'all') || (grade === 'Khối ' + g);
          btn.className = isAct
            ? 'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 text-white border border-indigo-600 shadow-xs'
            : 'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50';
        }
      });
      refreshExamList();
    }

    function refreshExamList() {
      const exams = getStoredExams();
      const grid = document.getElementById('examGrid');
      grid.innerHTML = '';

      const filtered = exams.filter(e => selectedGradeFilter === 'all' || e.grade === selectedGradeFilter);

      if (filtered.length === 0) {
        grid.innerHTML = '<div class="col-span-3 text-center py-12 text-slate-400">Chưa có đề thi nào cho khối lớp này.</div>';
        return;
      }

      filtered.forEach(ex => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4';
        card.innerHTML = \`
          <div class="space-y-2">
            <span class="text-xs font-black px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">\${ex.grade || 'Khối 6'}</span>
            <h4 class="font-bold text-slate-900 text-base leading-snug">\${ex.title}</h4>
          </div>
          <div class="space-y-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <div class="flex items-center justify-between">
              <span>⏱ \${ex.durationMinutes} phút</span>
              <span>📝 \${ex.questions ? ex.questions.length : 0} câu</span>
            </div>
            <button onclick="startExam('\${ex.id}')" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition">
              Bắt Đầu Làm Bài
            </button>
          </div>
        \`;
        grid.appendChild(card);
      });
      lucide.createIcons();
    }

    function startExam(examId) {
      const exams = getStoredExams();
      activeExam = exams.find(e => e.id === examId);
      if (!activeExam) return;

      const pName = localStorage.getItem('edtech_student_name') || 'Học sinh';
      const pClass = localStorage.getItem('edtech_student_class') || '6A1';

      currentAnswers = {};
      currentEssayAnswers = {};
      remainingSeconds = activeExam.durationMinutes * 60;

      document.getElementById('studentContainer').classList.add('hidden');
      document.getElementById('examTakingContainer').classList.remove('hidden');

      document.getElementById('takingGradeBadge').innerText = activeExam.grade || 'Khối 6';
      document.getElementById('takingExamTitle').innerText = activeExam.title;
      document.getElementById('takingStudentName').innerText = pName;
      document.getElementById('takingStudentClass').innerText = pClass;

      renderTakingQuestions();
      clearInterval(examTimerInterval);
      examTimerInterval = setInterval(() => {
        remainingSeconds--;
        const mins = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        document.getElementById('countdownText').innerText = (mins<10?'0':'')+mins+':'+(secs<10?'0':'')+secs;
        if (remainingSeconds <= 0) {
          clearInterval(examTimerInterval);
          alert('HẾT GIỜ! Hệ thống tự động thu bài.');
          submitExamNow();
        }
      }, 1000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      lucide.createIcons();
    }

    function renderTakingQuestions() {
      const container = document.getElementById('questionsContainer');
      container.innerHTML = '';
      const optChars = ['A', 'B', 'C', 'D'];

      activeExam.questions.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4';

        let innerContent = '';
        if (q.type === 'multiple_choice') {
          let optsHtml = '';
          (q.options || []).forEach((opt, oIdx) => {
            const isChecked = currentAnswers[idx] === oIdx;
            optsHtml += \`
              <label onclick="selectAnswer(\${idx}, \${oIdx})" class="flex items-center gap-3 p-3 rounded-xl border \${isChecked ? 'border-indigo-600 bg-indigo-50 font-bold' : 'border-slate-200 hover:bg-slate-50'} cursor-pointer text-sm">
                <span class="w-6 h-6 rounded flex items-center justify-center font-bold text-xs bg-white border border-slate-300">\${optChars[oIdx]}</span>
                <span>\${opt}</span>
              </label>
            \`;
          });
          innerContent = \`<div class="space-y-2">\${optsHtml}</div>\`;
        } else {
          innerContent = \`
            <div class="space-y-2">
              <label class="text-xs font-bold text-purple-900">✍ Nhập câu trả lời tự luận của em:</label>
              <textarea rows="4" oninput="currentEssayAnswers[\${idx}] = this.value" placeholder="Gõ câu trả lời tại đây..." class="w-full p-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
            </div>
          \`;
        }

        card.innerHTML = \`
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <span class="text-xs font-black px-2.5 py-0.5 rounded \${q.type === 'essay' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-50 text-indigo-700'}">
              Câu \${idx + 1}: \${q.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'}
            </span>
          </div>
          <p class="font-bold text-slate-900">\${q.question}</p>
          \${q.imageUrl ? \`<img src="\${q.imageUrl}" class="max-h-48 rounded-lg object-contain border border-slate-200" />\` : ''}
          \${innerContent}
        \`;
        container.appendChild(card);
      });
    }

    function selectAnswer(qIdx, optIdx) {
      currentAnswers[qIdx] = optIdx;
      renderTakingQuestions();
    }

    function confirmSubmitExam() {
      if (confirm('Bạn có chắc chắn muốn nộp bài thi?')) {
        submitExamNow();
      }
    }

    function submitExamNow() {
      clearInterval(examTimerInterval);
      let correct = 0;
      let mcTotal = 0;
      activeExam.questions.forEach((q, idx) => {
        if (q.type === 'multiple_choice') {
          mcTotal++;
          if (currentAnswers[idx] === q.correctAnswer) correct++;
        }
      });

      const score = mcTotal > 0 ? Math.round((correct / mcTotal) * 10 * 10) / 10 : 10;
      const sub = {
        id: 'sub-' + Date.now(),
        examId: activeExam.id,
        examTitle: activeExam.title,
        grade: activeExam.grade,
        studentName: localStorage.getItem('edtech_student_name') || 'Học sinh',
        studentClass: localStorage.getItem('edtech_student_class') || '6A1',
        submittedAt: new Date().toISOString(),
        score,
        answers: currentAnswers,
        essayAnswers: currentEssayAnswers
      };

      const subs = getStoredSubmissions();
      subs.unshift(sub);
      saveStoredSubmissions(subs);

      document.getElementById('examTakingContainer').classList.add('hidden');
      document.getElementById('resultContainer').classList.remove('hidden');
      document.getElementById('resultExamTitle').innerText = activeExam.title;
      document.getElementById('resultScore').innerText = score.toFixed(1);
      lucide.createIcons();
    }

    function backToStudentList() {
      document.getElementById('resultContainer').classList.add('hidden');
      document.getElementById('studentContainer').classList.remove('hidden');
      refreshExamList();
    }

    function loadTeacherDashboard() {
      const exams = getStoredExams();
      const subs = getStoredSubmissions();
      document.getElementById('statTotalExams').innerText = exams.length;
      document.getElementById('statTotalSubmissions').innerText = subs.length;
      renderSubmissions();
    }

    function switchTeacherTab(tab) {
      document.getElementById('teacherTabSubmissions').classList.toggle('hidden', tab !== 'submissions');
      document.getElementById('teacherTabCreate').classList.toggle('hidden', tab !== 'create');
      if (tab === 'create' && teacherQuestionsDraft.length === 0) {
        addEmptyQuestion('multiple_choice');
      }
      lucide.createIcons();
    }

    function addEmptyQuestion(type) {
      teacherQuestionsDraft.push({
        type: type || 'multiple_choice',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        imageUrl: ''
      });
      renderQuestionDrafts();
    }

    function renderQuestionDrafts() {
      const container = document.getElementById('questionsBuilderList');
      container.innerHTML = '';
      document.getElementById('creatorQuestionCount').innerText = teacherQuestionsDraft.length;
      const optChars = ['A', 'B', 'C', 'D'];

      teacherQuestionsDraft.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3';
        
        let specificHtml = '';
        if (q.type === 'multiple_choice') {
          let opts = '';
          optChars.forEach((ch, oIdx) => {
            opts += \`
              <div class="flex items-center gap-2">
                <input type="radio" name="cr_\${idx}" \${q.correctAnswer === oIdx ? 'checked' : ''} onchange="teacherQuestionsDraft[\${idx}].correctAnswer = \${oIdx}">
                <span class="text-xs font-bold w-4">\${ch}:</span>
                <input type="text" value="\${q.options[oIdx]||''}" oninput="teacherQuestionsDraft[\${idx}].options[\${oIdx}] = this.value" placeholder="Đáp án \${ch}" class="flex-1 px-3 py-1 border rounded bg-white text-xs">
              </div>
            \`;
          });
          specificHtml = \`<div class="space-y-1.5">\${opts}</div>\`;
        } else {
          specificHtml = \`
            <div class="space-y-1">
              <label class="text-xs font-bold text-purple-900">Gợi ý đáp án / Biểu điểm:</label>
              <textarea rows="2" oninput="teacherQuestionsDraft[\${idx}].sampleAnswer = this.value" class="w-full p-2 border rounded bg-white text-xs">\${q.sampleAnswer||''}</textarea>
            </div>
          \`;
        }

        card.innerHTML = \`
          <div class="flex items-center justify-between border-b pb-2">
            <span class="text-xs font-bold text-indigo-700">Câu \${idx + 1} (\${q.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'})</span>
            <button onclick="teacherQuestionsDraft.splice(\${idx}, 1); renderQuestionDrafts()" class="text-xs text-red-600 font-bold">Xóa</button>
          </div>
          <textarea rows="2" oninput="teacherQuestionsDraft[\${idx}].question = this.value" placeholder="Nội dung câu hỏi..." class="w-full p-2 border rounded bg-white text-xs">\${q.question||''}</textarea>
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-500 font-bold">Chèn ảnh (URL hoặc Base64):</label>
            <input type="text" value="\${q.imageUrl||''}" oninput="teacherQuestionsDraft[\${idx}].imageUrl = this.value; renderQuestionDrafts()" placeholder="https://... hoặc data:image/..." class="flex-1 px-2 py-1 border rounded bg-white text-xs">
          </div>
          \${q.imageUrl ? \`<img src="\${q.imageUrl}" class="max-h-24 rounded border" />\` : ''}
          \${specificHtml}
        \`;
        container.appendChild(card);
      });
      lucide.createIcons();
    }

    let selectedSubIds = new Set();
    let pendingDeleteAction = null;

    function openDeleteModal(title, msg, onConfirm) {
      document.getElementById('deleteModalTitle').innerText = title;
      document.getElementById('deleteModalMessage').innerHTML = msg;
      pendingDeleteAction = onConfirm;
      document.getElementById('btnConfirmDeleteAction').onclick = function() {
        if (pendingDeleteAction) pendingDeleteAction();
        closeDeleteModal();
      };
      document.getElementById('standaloneDeleteModal').classList.remove('hidden');
      lucide.createIcons();
    }

    function closeDeleteModal() {
      document.getElementById('standaloneDeleteModal').classList.add('hidden');
      pendingDeleteAction = null;
    }

    function toggleSelectAllSubs(checked) {
      const checkboxes = document.querySelectorAll('.sub-checkbox');
      checkboxes.forEach(cb => {
        cb.checked = checked;
        if (checked) {
          selectedSubIds.add(cb.value);
        } else {
          selectedSubIds.delete(cb.value);
        }
      });
      updateSelectedSubsUI();
    }

    function toggleSelectOneSub(id, checked) {
      if (checked) {
        selectedSubIds.add(id);
      } else {
        selectedSubIds.delete(id);
      }
      updateSelectedSubsUI();
    }

    function clearSelectedSubs() {
      selectedSubIds.clear();
      const selectAll = document.getElementById('selectAllSubs');
      if (selectAll) selectAll.checked = false;
      document.querySelectorAll('.sub-checkbox').forEach(cb => cb.checked = false);
      updateSelectedSubsUI();
    }

    function updateSelectedSubsUI() {
      const count = selectedSubIds.size;
      const countEl = document.getElementById('selectedSubsCount');
      if (countEl) countEl.innerText = count;
      const bar = document.getElementById('bulkSubsBar');
      if (bar) {
        if (count > 0) bar.classList.remove('hidden');
        else bar.classList.add('hidden');
      }
      const selectAll = document.getElementById('selectAllSubs');
      const checkboxes = document.querySelectorAll('.sub-checkbox');
      if (selectAll && checkboxes.length > 0) {
        selectAll.checked = count === checkboxes.length;
      }
    }

    function renderSubmissions() {
      const subs = getStoredSubmissions();
      const tbody = document.getElementById('submissionsTableBody');
      tbody.innerHTML = '';

      if (subs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="p-8 text-center text-slate-400 font-medium">Chưa có bài nộp nào của học sinh.</td></tr>';
        updateSelectedSubsUI();
        lucide.createIcons();
        return;
      }

      subs.forEach((s, idx) => {
        const tr = document.createElement('tr');
        const isChecked = selectedSubIds.has(s.id);
        tr.className = 'border-b text-xs ' + (isChecked ? 'bg-indigo-50/60' : '');
        tr.innerHTML = \`
          <td class="p-3 text-center">
            <input type="checkbox" class="sub-checkbox w-4 h-4 text-indigo-600 rounded cursor-pointer" value="\${s.id}" \${isChecked ? 'checked' : ''} onchange="toggleSelectOneSub('\${s.id}', this.checked)">
          </td>
          <td class="p-3 text-center text-slate-400 font-semibold">\${idx + 1}</td>
          <td class="p-3 font-bold text-slate-900">\${s.studentName}</td>
          <td class="p-3"><span class="px-2 py-0.5 bg-slate-100 rounded font-semibold text-slate-700">\${s.grade || ''} - \${s.studentClass}</span></td>
          <td class="p-3 max-w-xs truncate font-medium text-slate-800">\${s.examTitle}</td>
          <td class="p-3 text-center font-bold text-indigo-600">\${s.score.toFixed(1)}/10</td>
          <td class="p-3 text-slate-500">\${new Date(s.submittedAt).toLocaleDateString('vi-VN')}</td>
          <td class="p-3 text-center">
            <button onclick="promptDeleteSingleSub('\${s.id}', '\${s.studentName}')" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Xóa bài nộp này">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        \`;
        tbody.appendChild(tr);
      });
      updateSelectedSubsUI();
      lucide.createIcons();
    }

    function promptDeleteSingleSub(id, studentName) {
      openDeleteModal(
        'Xác nhận xóa bài làm',
        'Thầy/Cô có chắc chắn muốn xóa bài làm của học sinh <strong class="text-red-900">"' + studentName + '"</strong> khỏi hệ thống?',
        function() {
          const arr = getStoredSubmissions().filter(x => x.id !== id);
          saveStoredSubmissions(arr);
          selectedSubIds.delete(id);
          renderSubmissions();
          document.getElementById('statTotalSubmissions').innerText = arr.length;
        }
      );
    }

    function promptDeleteSelectedSubs() {
      if (selectedSubIds.size === 0) return;
      openDeleteModal(
        'Xóa các bài nộp đã chọn',
        'Thầy/Cô có chắc chắn muốn xóa <strong class="text-red-900">' + selectedSubIds.size + ' bài làm đã chọn</strong> khỏi hệ thống?',
        function() {
          const arr = getStoredSubmissions().filter(x => !selectedSubIds.has(x.id));
          saveStoredSubmissions(arr);
          selectedSubIds.clear();
          renderSubmissions();
          document.getElementById('statTotalSubmissions').innerText = arr.length;
        }
      );
    }

    function promptDeleteAllSubmissions() {
      const subs = getStoredSubmissions();
      if (subs.length === 0) return;
      openDeleteModal(
        'Xóa tất cả bài nộp',
        '<strong class="text-red-900">CẢNH BÁO NGUY HIỂM:</strong> Thầy/Cô có chắc chắn muốn xóa toàn bộ <strong class="text-red-900">' + subs.length + ' bài làm</strong> của tất cả học sinh?',
        function() {
          saveStoredSubmissions([]);
          selectedSubIds.clear();
          renderSubmissions();
          document.getElementById('statTotalSubmissions').innerText = 0;
        }
      );
    }

    function publishExam() {
      const title = document.getElementById('newExamTitle').value.trim();
      const grade = document.getElementById('newExamGrade').value;
      const duration = parseInt(document.getElementById('newExamDuration').value) || 15;

      if (!title) { alert('Vui lòng nhập tên đề kiểm tra!'); return; }
      if (teacherQuestionsDraft.length === 0) { alert('Cần ít nhất 1 câu hỏi!'); return; }

      const exams = getStoredExams();
      exams.unshift({
        id: 'exam-' + Date.now(),
        title,
        grade,
        durationMinutes: duration,
        questions: teacherQuestionsDraft
      });
      saveStoredExams(exams);
      alert('Đã đăng đề kiểm tra thành công!');
      teacherQuestionsDraft = [];
      switchTeacherTab('submissions');
    }

    function exportToCsv() {
      const subs = getStoredSubmissions();
      if (subs.length === 0) { alert('Chưa có dữ liệu bài nộp!'); return; }
      const rows = [['STT', 'Họ Tên', 'Khối', 'Lớp', 'Đề Kiểm Tra', 'Điểm', 'Ngày Nộp']];
      subs.forEach((s, idx) => {
        rows.push([idx+1, \`"\${s.studentName}"\`, \`"\${s.grade||''}"\`, \`"\${s.studentClass}"\`, \`"\${s.examTitle}"\`, s.score, \`"\${s.submittedAt}"\`]);
      });
      const csv = rows.map(r=>r.join(',')).join('\\r\\n');
      const blob = new Blob(['\\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'Bang_Diem_Tin_Hoc.csv';
      a.click();
    }

    window.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
      refreshExamList();
      if (isCloudActive) {
        document.getElementById('cloudStatusBadge').innerText = 'Cloud Online 🟢';
        document.getElementById('cloudStatusBadge').className = 'text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-200';
      }
    });
  </script>
</body>
</html>`;
}
