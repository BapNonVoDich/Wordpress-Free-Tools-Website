# WordPress Business Tools Website

A modern WordPress website featuring free business tools for Vietnamese users, built on a custom Tool post type for easy management and expansion.

## Features

- 🧩 **Tool Post Type** - Mỗi công cụ là một bài viết riêng trong WordPress
- 🇻🇳 **Vietnamese Language Support** - Fully localized for Vietnamese users
- 🎨 **Modern Minimal Design** - Calm, authoritative aesthetic
- 📱 **Fully Responsive** - Mobile-first design approach
- 🔧 **Three Core Tools** - Calculator, Bill Splitter, Tax Calculator

## Project Structure

```
tools-web/
├── docker/              # Docker configuration
├── theme/               # Custom WordPress theme
│   └── tools-theme/
└── plugin/              # Business Tools plugin
    └── business-tools/
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tools-web
```

2. Set up environment variables:
```bash
cp docker/.env.example docker/.env
# Edit docker/.env with your preferred settings
```

3. Start Docker containers:
```bash
cd docker
docker-compose up -d
```

4. Access WordPress:
- WordPress: http://localhost:8080
- phpMyAdmin: http://localhost:8081

5. Complete WordPress installation:
   - Visit http://localhost:8080
   - Follow the WordPress setup wizard
   - Activate the "Tools Theme" theme
   - Activate the "Business Tools" plugin

## Development

### Theme Development

The theme is located in `theme/tools-theme/`. Make changes and they'll be reflected immediately in the Docker container.

### Plugin Development

The plugin is located in `plugin/business-tools/`. Changes are automatically available in WordPress.

### Adding New Tools

1. In WordPress Admin, go to **Công Cụ > Thêm mới**
2. Nhập tiêu đề, mô tả và nội dung hướng dẫn
3. Publish – công cụ tự động xuất hiện trên menu, trang chủ và `/tools/`

## Technical Stack

- WordPress 6.0+
- PHP 8.0+
- MySQL 8.0
- Docker & Docker Compose

## License

This project is for portfolio and learning purposes.

