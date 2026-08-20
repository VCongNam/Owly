/*
  Nội dung landing page Owly
  Định hướng: Simple · Friendly · Teacher-first
*/

export const site = {
  name: "Owly",
  tagline: "Quản lý lớp học nhẹ nhàng hơn mỗi ngày",
};

export const nav = {
  links: [
    { label: "Tính năng", href: "#features" },
    { label: "Vì sao chọn Owly", href: "#benefits" },
    { label: "Trải nghiệm", href: "#pricing" },
    { label: "Hỏi đáp", href: "#faq" },
  ],
  cta: { label: "Đăng nhập", href: "/signin" },
};

export const hero = {
  label: "Được tạo ra để việc dạy học trở nên đơn giản hơn",

  titleTop: "Quản lý lớp học,",
  titleAccent: "nhẹ nhàng hơn mỗi ngày.",

  sub:
    "Lịch học, điểm danh, bài tập, nhận xét và học phí — tất cả trong một nơi. Owly giúp giáo viên dành ít thời gian hơn cho việc quản lý và nhiều thời gian hơn cho việc giảng dạy.",

  primaryCta: {
    label: "Bắt đầu miễn phí",
    href: "/signup",
  },

  secondaryCta: {
    label: "Khám phá Owly",
    href: "#features",
  },

  note:
    "Không cần cài đặt · Dễ sử dụng · Dùng được trên nhiều thiết bị",
};

export const stats = [
  {
    value: "Thuận tiện",
    label: "Cho mọi công việc của lớp học",
  },
  {
    value: "Dễ dàng",
    label: "Điểm danh và theo dõi lớp",
  },
  {
    value: "Tiện lợi",
    label: "Giao bài và nhận bài",
  },
  {
    value: "Linh hoạt",
    label: "Truy cập khi bạn cần",
  },
];

export const features = {
  label: "Tính năng",

  heading: "Mọi thứ giáo viên cần, gọn trong một nơi",

  sub:
    "Owly giúp bạn quản lý những công việc quen thuộc của lớp học mà không phải chuyển qua lại giữa quá nhiều ứng dụng.",

  items: [
    {
      index: "01",
      title: "Quản lý lớp & học sinh",
      body:
        "Tạo lớp, thêm học sinh và theo dõi thông tin của từng lớp ngay trong một không gian rõ ràng, dễ tìm kiếm.",
    },

    {
      index: "02",
      title: "Lịch học & điểm danh",
      body:
        "Tạo lịch học cố định, thêm buổi học bù và ghi nhận có mặt, vắng hoặc đi muộn nhanh chóng sau mỗi buổi học.",
    },

    {
      index: "03",
      title: "Giao bài & nhận bài",
      body:
        "Tạo bài tập, đặt hạn nộp, đính kèm tài liệu và theo dõi học sinh nào đã hoàn thành ngay trong từng lớp.",
    },

    {
      index: "04",
      title: "Theo dõi tiến bộ của học sinh",
      body:
        "Lưu lại kết quả bài tập, chuyên cần và nhận xét sau từng buổi học để dễ dàng nhìn lại quá trình tiến bộ của mỗi học sinh.",
    },

    {
      index: "05",
      title: "Theo dõi học phí",
      body:
        "Tạo học phí theo từng lớp, theo dõi trạng thái thanh toán và quản lý minh chứng chuyển khoản của học sinh một cách gọn gàng.",
    },

    {
      index: "06",
      title: "Thông báo & tài liệu lớp học",
      body:
        "Chia sẻ thông báo, tài liệu học tập và trao đổi với học sinh ngay trong lớp mà không cần tìm lại nội dung ở nhiều nơi.",
    },
  ],
};

export const benefits = {
  label: "Vì sao chọn Owly",

  heading:
    "Ít việc quản lý hơn. Nhiều thời gian cho việc dạy hơn.",

  paragraphs: [
    "Một lớp học thường đi kèm rất nhiều việc nhỏ: lịch học, điểm danh, bài tập, nhận xét, tài liệu và học phí. Khi mỗi thứ nằm ở một nơi khác nhau, việc quản lý nhanh chóng trở nên mất thời gian.",

    "Owly đưa những công việc đó về cùng một nơi với giao diện đơn giản, dễ làm quen. Bạn không cần phải là người rành công nghệ để bắt đầu.",
  ],

  points: [
    "Dễ làm quen ngay từ lần đầu sử dụng",
    "Thông tin lớp học được sắp xếp rõ ràng",
    "Học sinh dễ theo dõi lịch học và bài tập",
    "Dùng được trên máy tính, tablet và điện thoại",
  ],
};

export const testimonials = {
  label: "Owly đang được hoàn thiện",

  heading: "Được xây dựng cùng những giáo viên đầu tiên",

  items: [
    {
      quote:
        "Owly hiện vẫn đang trong quá trình phát triển. Những góp ý từ người dùng đầu tiên sẽ trực tiếp giúp chúng tôi quyết định các tính năng cần cải thiện tiếp theo.",

      name: "Owly",
      role: "Giai đoạn trải nghiệm sớm",
    },

    {
      quote:
        "Mục tiêu của Owly không phải là thêm thật nhiều tính năng, mà là làm cho những công việc giáo viên phải làm mỗi ngày trở nên đơn giản hơn.",

      name: "Owly",
      role: "Triết lý sản phẩm",
    },

    {
      quote:
        "Các tính năng mới sẽ được bổ sung từng bước dựa trên nhu cầu thực tế của giáo viên và học sinh.",

      name: "Owly",
      role: "Phát triển liên tục",
    },
  ],
};

export const pricing = {
  label: "Trải nghiệm sớm",

  heading: "Bắt đầu sử dụng Owly miễn phí",

  sub:
    "Owly đang trong giai đoạn phát triển và hoàn thiện. Giáo viên có thể trải nghiệm các tính năng hiện có miễn phí và gửi góp ý trực tiếp cho chúng tôi.",

  note:
    "Không phí khởi tạo · Không cần thẻ thanh toán · Có thể thay đổi khi Owly ra mắt chính thức",

  tiers: [
    {
      name: "Trải nghiệm Owly",

      price: "0đ",

      period: "trong giai đoạn trải nghiệm",

      blurb:
        "Phù hợp cho giáo viên muốn bắt đầu quản lý lớp học trên Owly và đồng hành cùng quá trình phát triển sản phẩm.",

      features: [
        "Tạo và quản lý lớp học",
        "Quản lý học sinh",
        "Lịch học & điểm danh",
        "Bài tập & bài nộp",
        "Nhận xét và theo dõi tiến bộ",
        "Theo dõi học phí",
        "Tài liệu & thông báo lớp học",
      ],

      cta: "Bắt đầu miễn phí",

      featured: true,
    },
  ],
};

export const faq = {
  label: "Hỏi đáp",

  heading: "Những điều bạn có thể muốn biết",

  contact: {
    text:
      "Bạn có góp ý hoặc cần hỗ trợ? Hãy liên hệ với đội ngũ Owly.",
    href: "#top",
  },

  items: [
    {
      q: "Owly dành cho ai?",

      a:
        "Owly hiện được xây dựng chủ yếu dành cho giáo viên cá nhân, giáo viên dạy thêm và những người đang trực tiếp quản lý lớp học của mình. Học sinh có thể đăng nhập để theo dõi lớp, lịch học, bài tập và các thông tin liên quan.",
    },

    {
      q: "Tôi có cần cài đặt phần mềm không?",

      a:
        "Không. Owly hoạt động trên trình duyệt web nên bạn chỉ cần đăng nhập và sử dụng. Giao diện được thiết kế để có thể sử dụng trên máy tính, tablet và điện thoại.",
    },

    {
      q: "Điểm danh có hoàn toàn tự động không?",

      a:
        "Hiện tại giáo viên có thể điểm danh nhanh theo từng buổi học và ghi nhận các trạng thái như có mặt, vắng hoặc đi muộn. Owly sẽ tiếp tục bổ sung thêm các cách điểm danh tiện lợi hơn trong tương lai.",
    },

    {
      q: "Owly hỗ trợ quản lý học phí như thế nào?",

      a:
        "Giáo viên có thể tạo thông tin học phí, theo dõi trạng thái thanh toán và kiểm tra minh chứng chuyển khoản ngay trong hệ thống. Các tính năng thanh toán và xác nhận tự động đang nằm trong kế hoạch phát triển tiếp theo.",
    },

    {
      q: "Phụ huynh có tài khoản riêng không?",

      a:
        "Ở phiên bản hiện tại, Owly tập trung vào giáo viên và học sinh. Các tính năng dành riêng cho phụ huynh có thể được phát triển thêm dựa trên nhu cầu thực tế của người dùng.",
    },

    {
      q: "Owly có miễn phí không?",

      a:
        "Trong giai đoạn trải nghiệm và phát triển, Owly cho phép người dùng bắt đầu miễn phí. Chính sách giá chính thức sẽ được công bố sau khi sản phẩm hoàn thiện hơn.",
    },
  ],
};

export const journal = {
  label: "Sắp tới trên Owly",

  heading: "Owly sẽ tiếp tục tốt hơn",

  sub:
    "Chúng tôi đang phát triển thêm những tính năng giúp giáo viên giảm bớt các công việc lặp lại và tập trung nhiều hơn vào việc giảng dạy.",

  posts: [
    {
      category: "Đang phát triển",

      date: "Roadmap",

      title: "AI hỗ trợ soạn bài tập",

      excerpt:
        "Chọn chủ đề, trình độ và dạng bài mong muốn để Owly hỗ trợ tạo nội dung bài tập, sau đó giáo viên có thể chỉnh sửa trước khi giao cho học sinh.",
    },

    {
      category: "Đang phát triển",

      date: "Roadmap",

      title: "Thanh toán & xác nhận học phí tự động",

      excerpt:
        "Giảm bớt việc kiểm tra thủ công bằng cách hỗ trợ theo dõi giao dịch và cập nhật trạng thái học phí thuận tiện hơn.",
    },

    {
      category: "Tương lai",

      date: "Roadmap",

      title: "Nhiều công cụ hơn cho giáo viên",

      excerpt:
        "Owly sẽ tiếp tục bổ sung tính năng dựa trên những vấn đề thực tế mà giáo viên gặp phải trong quá trình quản lý lớp học.",
    },
  ],
};

export const cta = {
  label: "Bắt đầu với Owly",

  heading:
    "Dành ít thời gian hơn cho việc quản lý. Dành nhiều thời gian hơn cho việc dạy.",

  sub:
    "Tạo lớp học đầu tiên của bạn trên Owly và trải nghiệm cách quản lý lịch học, điểm danh, bài tập và học phí trong cùng một nơi.",

  emailPlaceholder: "Nhập email của bạn",

  buttonLabel: "Bắt đầu miễn phí",

  successMessage:
    "Cảm ơn bạn đã quan tâm đến Owly! Chúng tôi đã nhận được thông tin của bạn.",

  note: "Bắt đầu miễn phí · Không cần cài đặt",
};

export const footer = {
  blurb:
    "Owly giúp giáo viên quản lý lớp học, học sinh, lịch học, bài tập và học phí trong một không gian đơn giản và dễ sử dụng.",

  columns: [
    {
      heading: "Owly",
      links: [
        "Tính năng",
        "Trải nghiệm miễn phí",
        "Sắp tới trên Owly",
        "Giới thiệu",
      ],
    },

    {
      heading: "Sản phẩm",
      links: [
        "Quản lý lớp học",
        "Bài tập",
        "Điểm danh",
        "Học phí",
      ],
    },

    {
      heading: "Hỗ trợ",
      links: [
        "Hướng dẫn sử dụng",
        "Gửi góp ý",
        "Liên hệ",
        "Chính sách quyền riêng tư",
      ],
    },
  ],

  copyright:
    "© 2026 Owly. Mọi quyền được bảo lưu.",

  colophon:
    "Được tạo ra để việc quản lý lớp học trở nên đơn giản hơn.",
};