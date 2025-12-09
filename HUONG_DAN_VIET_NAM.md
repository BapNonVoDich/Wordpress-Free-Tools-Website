# Hướng Dẫn Thiết Lập - Tiếng Việt

## Các Bước Khắc Phục Vấn Đề

### Vấn Đề 1: Menu "Công Cụ" Không Hiển Thị

**Nguyên nhân:** Plugin chưa được kích hoạt hoặc rewrite rules chưa được flush.

**Giải pháp:**

1. **Vào WordPress Admin:**
   - Truy cập: http://localhost:8080/wp-admin
   - Đăng nhập với tài khoản admin của bạn

2. **Kiểm tra Plugin:**
   - Vào **Plugins** (Gói mở rộng) trong menu bên trái
   - Tìm plugin **"Business Tools"**
   - Đảm bảo nó đã được **Kích hoạt** (Activate)
   - Nếu chưa, click **"Kích hoạt"** (Activate)

3. **Cấu hình Permalink (Cấu trúc đường dẫn):**
   - Vào **Settings** (Cài đặt) → **Permalinks** (Cấu trúc đường dẫn)
   - Trong trang bạn đang xem, chọn **"Tiêu đề bài viết"** (Post name)
   - Click nút **"Lưu thay đổi"** (Save Changes) ở dưới cùng
   - Điều này sẽ flush rewrite rules và làm cho URLs `/tools/` hoạt động

4. **Làm mới trang:**
   - Quay lại trang chủ: http://localhost:8080
   - Làm mới trang (F5 hoặc Ctrl+R)
   - Menu "Công Cụ" sẽ xuất hiện với dropdown chứa 3 công cụ

---

### Vấn Đề 2: Giao Diện Máy Tính Không Hiển Thị

**Nguyên nhân:** Template chưa load đúng hoặc plugin chưa được kích hoạt.

**Giải pháp:**

1. **Kiểm tra Plugin đã kích hoạt:**
   - Vào **Plugins** → Đảm bảo **Business Tools** đã được kích hoạt

2. **Truy cập trực tiếp công cụ:**
   - Thử truy cập: http://localhost:8080/tools/calculator/
   - Nếu thấy lỗi 404, bạn cần:
     - Vào **Settings** → **Permalinks**
     - Click **"Lưu thay đổi"** (không cần thay đổi gì, chỉ cần click Save)

3. **Kiểm tra trong WordPress Admin:**
   - Vào **Tools** (Công cụ) → **Site Health** (nếu có)
   - Hoặc kiểm tra **Plugins** xem có lỗi nào không

---

### Vấn Đề 3: Trang Công Cụ Hiển Thị 404

**Giải pháp:**

1. **Flush Rewrite Rules:**
   - Vào **Settings** → **Permalinks**
   - Click **"Lưu thay đổi"** (Save Changes)
   - Điều này sẽ tạo lại các rewrite rules

2. **Deactivate và Reactivate Plugin:**
   - Vào **Plugins**
   - **Vô hiệu hóa** (Deactivate) plugin **Business Tools**
   - Sau đó **Kích hoạt** (Activate) lại
   - Điều này sẽ chạy lại activation hook và flush rewrite rules

---

## Kiểm Tra Nhanh

Sau khi làm các bước trên, kiểm tra:

1. **Menu Header:**
   - Trang chủ: http://localhost:8080
   - Bạn sẽ thấy menu "Công Cụ" với dropdown

2. **Trang Công Cụ:**
   - http://localhost:8080/tools/calculator/ - Máy Tính
   - http://localhost:8080/tools/bill-splitter/ - Chia Hóa Đơn
   - http://localhost:8080/tools/tax-calculator/ - Tính Thuế Tự Động

3. **Danh Sách Công Cụ:**
   - http://localhost:8080/tools/ - Tất cả công cụ

---

## Nếu Vẫn Không Hoạt Động

1. **Kiểm tra Docker:**
   ```powershell
   cd "E:\Work\Projects\Tools Web\docker"
   docker-compose ps
   ```
   Tất cả containers phải có status "Up"

2. **Xem Logs:**
   ```powershell
   docker-compose logs wordpress
   ```
   Tìm các lỗi liên quan đến plugin

3. **Restart Containers:**
   ```powershell
   docker-compose restart
   ```

4. **Kiểm tra File Permissions:**
   - Đảm bảo các file trong `plugin/business-tools/` và `theme/tools-theme/` có thể đọc được

---

## Các Trang Quan Trọng Trong WordPress Admin

- **Plugins** (Gói mở rộng): http://localhost:8080/wp-admin/plugins.php
- **Themes** (Giao diện): http://localhost:8080/wp-admin/themes.php
- **Permalinks** (Cấu trúc đường dẫn): http://localhost:8080/wp-admin/options-permalink.php
- **Settings** (Cài đặt): http://localhost:8080/wp-admin/options-general.php

---

## Lưu Ý

- Sau khi thay đổi permalink, **LUÔN LUÔN** click **"Lưu thay đổi"** để flush rewrite rules
- Plugin phải được **Kích hoạt** để các công cụ hoạt động
- Theme phải được **Kích hoạt** để giao diện hiển thị đúng
- Nếu thay đổi code, có thể cần restart Docker containers

