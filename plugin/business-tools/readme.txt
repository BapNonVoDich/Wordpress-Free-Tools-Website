=== Business Tools ===
Contributors: yourname
Tags: business, tools, calculator, vietnamese
Requires at least: 6.0
Tested up to: 6.4
Requires PHP: 8.0
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Free business tools for Vietnamese users with a custom Tool post type and interactive calculators.

== Description ==

Business Tools is a WordPress plugin that provides free business calculation tools for Vietnamese users. It registers a dedicated “Tool” post type so mỗi công cụ là một bài viết riêng, dễ quản lý và mở rộng.

== Features ==

* Tool Post Type - Thêm/sửa công cụ giống như viết bài
* Three Core Tools - Calculator, Bill Splitter, Tax Calculator
* Vietnamese Language Support - Fully localized
* Modern, Responsive Design - Mobile-first approach
* SEO Optimized - Schema.org markup and meta tags

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/business-tools`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Plugin sẽ tự tạo 3 công cụ mẫu (Máy Tính, Chia Hóa Đơn, Tính Thuế)
4. Tạo thêm công cụ bằng cách vào **Công Cụ > Thêm mới**

== Frequently Asked Questions ==

= Làm sao để thêm công cụ mới? =

1. Vào WordPress Admin → Công Cụ (Tool) → Thêm mới
2. Nhập tiêu đề, mô tả, nội dung hướng dẫn
3. Lưu và xuất bản
4. Công cụ sẽ tự động xuất hiện ở menu, trang chủ và danh sách `/tools/`

= Tôi có thể tùy biến giao diện/mã nguồn của từng công cụ không? =

Có. Bạn có thể tạo template riêng (`single-tool-{slug}.php`) hoặc mở rộng plugin để thêm logic theo slug.

== Changelog ==

= 1.0.0 =
* Initial release với Tool CPT
* Calculator tool
* Bill Splitter tool
* Tax Calculator tool
* Vietnamese language support

== Upgrade Notice ==

= 1.0.0 =
Initial release of Business Tools plugin.

