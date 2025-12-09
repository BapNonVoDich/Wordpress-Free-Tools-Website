# Google PageSpeed Insights API Setup

## Cách lấy API Key

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo một project mới hoặc chọn project hiện có
3. Bật **PageSpeed Insights API**:
   - Vào **APIs & Services** > **Library**
   - Tìm "PageSpeed Insights API"
   - Click **Enable**
4. Tạo API Key:
   - Vào **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **API Key**
   - Copy API key vừa tạo

## Cách cấu hình API Key

### Cách 1: Sử dụng WordPress Admin (Dễ nhất - Khuyến nghị)

1. Vào **WordPress Admin** > **Công Cụ** > **Cài Đặt**
2. Tìm phần **Google PageSpeed Insights API Key**
3. Dán API key của bạn vào ô input
4. Click **Lưu Cài Đặt**

### Cách 2: Sử dụng wp-config.php

Nếu bạn muốn cấu hình qua code, thêm dòng sau vào file `wp-config.php`:

```php
define('BUSINESS_TOOLS_PAGESPEED_API_KEY', 'YOUR_API_KEY_HERE');
```

**Lưu ý:** Nếu cấu hình trong wp-config.php, giá trị đó sẽ được ưu tiên sử dụng và không thể thay đổi từ WordPress Admin.

### Cách 3: Sử dụng WordPress Options (Code)

Thêm vào database option `business_tools_pagespeed_api_key` với giá trị là API key của bạn:

```php
update_option('business_tools_pagespeed_api_key', 'YOUR_API_KEY_HERE');
```

## Lưu ý

- API Key miễn phí có giới hạn: 25,000 requests/ngày
- Nếu không cấu hình API key, tool sẽ hiển thị thông báo lỗi nhưng vẫn hoạt động với các tính năng khác
- API key nên được giữ bí mật, không commit vào Git

