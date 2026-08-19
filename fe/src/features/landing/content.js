/*
  Toàn bộ nội dung (copy) của trang giới thiệu Owly.
*/

export const site = {
  name: "Owly",
  tagline: "Nền tảng quản lý lớp học & học viên thông minh",
};

export const nav = {
  links: [
    { label: "Tính năng", href: "#features" },
    { label: "Giải pháp", href: "#benefits" },
    { label: "Bảng giá", href: "#pricing" },
    { label: "Hỏi đáp", href: "#faq" },
  ],
  cta: { label: "Đăng nhập", href: "/signin" },
};

export const hero = {
  label: "Est. 2026 · Giải pháp quản lý lớp học toàn diện",
  titleTop: "Quản lý lớp học",
  titleAccent: "tinh tế & tối giản.",
  sub: "Owly là nền tảng quản lý lớp học hiện đại dành cho Giáo viên, Học sinh và Phụ huynh — điểm danh tự động, nộp bài tập Cloudflare R2, và đối soát học phí VietQR trong một giao diện duy nhất.",
  primaryCta: { label: "Trải nghiệm ngay — Miễn phí", href: "/signup" },
  secondaryCta: { label: "Khám phá các tính năng", href: "#features" },
  note: "Tự động hóa · An toàn · Tương thích đa thiết bị",
};

export const stats = [
  { value: "100%", label: "Lớp học được số hóa" },
  { value: "99.8%", label: "Chính xác khi điểm danh" },
  { value: "0đ", label: "Phí khởi tạo ban đầu" },
  { value: "24/7", label: "Truy cập mọi lúc mọi nơi" },
];

export const features = {
  label: "Tính năng nổi bật",
  heading: "Mọi thứ phục vụ trải nghiệm dạy & học",
  sub: "Sáu tính năng cốt lõi được thiết kế tối giản, loại bỏ thao tác thừa để giáo viên tập trung vào việc giảng dạy.",
  items: [
    {
      index: "01",
      title: "Điểm danh & Lịch học tự động",
      body: "Theo dõi sĩ số lớp, điểm danh theo thời gian thực và quản lý lịch học lặp lại theo tuần hoặc buổi học bù dễ dàng.",
    },
    {
      index: "02",
      title: "Bài tập & Lưu trữ Cloudflare R2",
      body: "Soạn bài tập phong phú với Tiptap Editor, nhập đề từ file Word (.docx) qua Mammoth, lưu trữ và nộp bài an toàn trên Cloudflare R2.",
    },
    {
      index: "03",
      title: "Đối soát Học phí VietQR",
      body: "Tự động tạo hóa đơn theo tháng, phát hành mã VietQR động và xác nhận minh chứng chuyển khoản từ phụ huynh/học sinh.",
    },
    {
      index: "04",
      title: "Bảng tin Lớp học & Thảo luận",
      body: "Không gian dặn dò, thông báo học liệu mới tự động và trao đổi bình luận trực tiếp giữa giáo viên và học sinh.",
    },
    {
      index: "05",
      title: "Học liệu & Tài liệu dùng chung",
      body: "Tải lên và chia sẻ bài giảng, tài liệu ôn tập dạng PDF, Word, Excel không giới hạn số lượng bài viết.",
    },
    {
      index: "06",
      title: "Thống kê & Nhật ký học tập",
      body: "Báo cáo tỉ lệ chuyên cần, lịch sử nộp bài tập và tổng quan theo dõi sự tiến bộ của từng học sinh.",
    },
  ],
};

export const benefits = {
  label: "Vì sao chọn Owly",
  heading: "Xây dựng cho sự gắn kết lâu dài",
  paragraphs: [
    "Các công cụ quản lý truyền thống thường rườm rà và phức tạp. Owly bắt đầu từ một triết lý khác: xây dựng một không gian tinh tế, trực quan, giúp việc tương tác giữa Giáo viên, Học sinh và Phụ huynh trở nên mượt mà nhất.",
    "Không cần cài đặt phức tạp. Không quảng cáo gây xao nhãng. Mọi dữ liệu lớp học đều được bảo mật và truy cập tức thì từ máy tính, tablet hay điện thoại.",
  ],
  points: [
    "Giao diện chuẩn hóa Light/Dark mode tự động thích ứng",
    "Phân quyền minh bạch: Giáo viên, Học sinh và Phụ huynh",
    "Hỗ trợ xem trên di động và mọi kích thước màn hình",
    "Bảo mật dữ liệu tuyệt đối và sao lưu liên tục",
  ],
};

export const testimonials = {
  label: "Cảm nhận người dùng",
  heading: "Tin cậy, tinh tế và hiệu quả",
  items: [
    {
      quote:
        "Owly giúp tôi tiết kiệm hàng giờ mỗi tuần trong việc thu học phí và điểm danh. Việc giao bài tập qua Cloudflare R2 cũng vô cùng mượt mà.",
      name: "Cô Nguyễn Thu Hà",
      role: "Giáo viên Tiếng Anh, Hà Nội",
    },
    {
      quote:
        "Giao diện Owly rất rõ ràng và dễ dùng. Con tôi theo dõi được lịch học và hạn nộp bài tập chính xác mà không lo bị nhầm lẫn.",
      name: "Thầy Trần Minh Đức",
      role: "Giáo viên Toán THPT, TP. Hồ Chí Minh",
    },
    {
      quote:
        "Nhờ có mã VietQR động và báo cáo điểm danh, việc phụ huynh nộp học phí và nhận thông tin học tập của con vô cùng minh bạch.",
      name: "Chị Lê Thanh Hương",
      role: "Phụ huynh học sinh",
    },
  ],
};

export const pricing = {
  label: "Bảng giá",
  heading: "Gói dịch vụ minh bạch, linh hoạt",
  sub: "Chọn gói phù hợp với quy mô lớp học của bạn. Nâng cấp hoặc thay đổi bất kỳ lúc nào.",
  note: "Thanh toán theo tháng hoặc năm · Không phí ẩn · Hỗ trợ 24/7",
  tiers: [
    {
      name: "Cá nhân (Học sinh)",
      price: "0đ",
      period: "vĩnh viễn",
      blurb: "Miễn phí toàn bộ cho học sinh tham gia lớp học và nộp bài.",
      features: [
        "Tham gia lớp học qua mã lớp",
        "Xem lịch học & điểm danh",
        "Nộp bài tập & xem kết quả chấm",
        "Tải học liệu & thảo luận bài viết",
      ],
      cta: "Bắt đầu ngay",
      featured: false,
    },
    {
      name: "Giáo viên",
      price: "199.000đ",
      period: "mỗi tháng",
      blurb: "Đầy đủ tính năng quản lý dành cho giáo viên trực tiếp giảng dạy.",
      features: [
        "Tất cả tính năng cá nhân",
        "Quản lý không giới hạn lớp học & học sinh",
        "Điểm danh & sinh lịch tuần lặp lại",
        "Soạn bài tập Tiptap/Word & lưu R2",
        "Quản lý học phí & VietQR tự động",
      ],
      cta: "Đăng ký dùng thử",
      featured: true,
    },
    {
      name: "Trung tâm",
      price: "499.000đ",
      period: "mỗi tháng",
      blurb: "Giải pháp mở rộng cho trung tâm đào tạo và nhiều trợ giảng.",
      features: [
        "Tất cả tính năng của gói Giáo viên",
        "Tài khoản quản trị trung tâm",
        "Phân quyền nhiều giáo viên & trợ giảng",
        "Báo cáo tài chính & doanh thu học phí",
      ],
      cta: "Liên hệ tư vấn",
      featured: false,
    },
  ],
};

export const faq = {
  label: "Hỏi đáp",
  heading: "Thắc mắc thường gặp",
  contact: {
    text: "Cần trợ giúp thêm? Gửi thư cho chúng tôi tại — support@owly.edu.vn",
    href: "#top",
  },
  items: [
    {
      q: "Owly hỗ trợ những đối tượng người dùng nào?",
      a: "Owly hỗ trợ 3 nhóm người dùng chính: Giáo viên (tạo lớp, quản lý bài tập, điểm danh, thu học phí), Học sinh (xem lịch, nộp bài, thảo luận) và Phụ huynh (theo dõi chuyên cần và nộp học phí).",
    },
    {
      q: "Việc thu học phí qua VietQR hoạt động như thế nào?",
      a: "Hệ thống tự động tạo mã VietQR kèm số tiền và nội dung chuyển khoản chính xác cho từng hóa đơn học sinh. Giáo viên nhận tiền trực tiếp về tài khoản ngân hàng của mình và duyệt giao dịch nhanh chóng.",
    },
    {
      q: "Dữ liệu bài tập và tài liệu được lưu trữ ở đâu?",
      a: "Toàn bộ tài liệu bài giảng và tệp nộp bài tập của học sinh được lưu trữ an toàn trên dịch vụ lưu trữ đám mây Cloudflare R2 với tốc độ tải cực nhanh và tính bảo mật cao.",
    },
    {
      q: "Tôi có thể truy cập Owly trên điện thoại không?",
      a: "Có, giao diện Owly được thiết kế tương thích hoàn hảo trên điện thoại di động, máy tính bảng và máy tính bàn thông qua trình duyệt web.",
    },
    {
      q: "Dữ liệu cá nhân và điểm số của học sinh có an toàn không?",
      a: "Hoàn toàn an toàn. Owly áp dụng chính sách phân quyền nghiêm ngặt, học sinh chỉ xem được điểm số và bài làm của chính mình, các thông tin liên hệ được bảo vệ nghiêm ngặt.",
    },
  ],
};

export const journal = {
  label: "Tin tức & Cập nhật",
  heading: "Nhật ký phát triển Owly",
  sub: "Những thông tin cập nhật mới nhất về tính năng và kinh nghiệm quản lý lớp học hiệu quả.",
  posts: [
    {
      category: "Tính năng mới",
      date: "12 Tháng 8, 2026",
      title: "Tự động hóa Nộp bài tập từ File Word",
      excerpt:
        "Tích hợp Mammoth.js cho phép giáo viên kéo thả file bài tập .docx trực tiếp vào trình soạn thảo một cách nhanh chóng.",
    },
    {
      category: "Hướng dẫn",
      date: "28 Tháng 7, 2026",
      title: "Tối ưu hóa Thu học phí Lớp học",
      excerpt:
        "Cách ứng dụng mã VietQR động để giảm thiểu 90% thời gian đối soát tiền học phí hàng tháng.",
    },
    {
      category: "Bảo mật",
      date: "02 Tháng 7, 2026",
      title: "Nâng cấp Hạ tầng Cloudflare R2",
      excerpt:
        "Đảm bảo tốc độ truy cập bài giảng và học liệu tức thì cho hơn 10.000 học sinh trên toàn hệ thống.",
    },
  ],
};

export const cta = {
  label: "Lời mời trải nghiệm",
  heading: "Bắt đầu số hóa lớp học của bạn ngay hôm nay.",
  sub: "Gia nhập hàng nghìn giáo viên đang nâng cao chất lượng quản lý lớp học cùng Owly. Đăng ký hoàn toàn miễn phí và bắt đầu chỉ trong vài phút.",
  emailPlaceholder: "email-cua-ban@example.com",
  buttonLabel: "Đăng ký tài khoản",
  successMessage:
    "Cảm ơn bạn đã quan tâm! Chúng tôi đã nhận được yêu cầu và sẽ hỗ trợ bạn ngay.",
  note: "Khởi tạo nhanh chóng · Dễ dàng cài đặt",
};

export const footer = {
  blurb:
    "Nền tảng quản lý học tập, lớp học, điểm danh và học phí thông minh dành cho Giáo viên & Học sinh.",
  columns: [
    {
      heading: "Sản phẩm",
      links: ["Tính năng", "Bảng giá", "Quy trình nộp bài", "Học liệu Cloudflare"],
    },
    {
      heading: "Hệ thống",
      links: ["Giới thiệu Owly", "Bảo mật dữ liệu", "Điều khoản dịch vụ", "Chính sách quyền riêng tư"],
    },
    {
      heading: "Hỗ trợ",
      links: ["Trung tâm trợ giúp", "Hướng dẫn sử dụng", "Liên hệ Giáo viên", "Trạng thái hệ thống"],
    },
  ],
  copyright: "© 2026 Owly Platform. Mọi quyền được bảo lưu.",
  colophon: "Thiết kế chuẩn font Playfair Display · Source Sans 3 · IBM Plex Mono",
};
