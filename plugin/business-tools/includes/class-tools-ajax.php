<?php
/**
 * Tools AJAX Handler Class
 * 
 * Handles AJAX requests for tool calculations
 *
 * @package BusinessTools
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Business_Tools_AJAX Class
 */
class Business_Tools_AJAX {
    
    /**
     * Initialize hooks
     */
    public static function init() {
        // Load rate limiter
        require_once BUSINESS_TOOLS_PLUGIN_DIR . 'includes/class-rate-limiter.php';
        // Calculator AJAX
        add_action('wp_ajax_business_tools_calculate', array(__CLASS__, 'handle_calculation'));
        add_action('wp_ajax_nopriv_business_tools_calculate', array(__CLASS__, 'handle_calculation'));
        
        // Bill Splitter AJAX
        add_action('wp_ajax_business_tools_split_bill', array(__CLASS__, 'handle_bill_split'));
        add_action('wp_ajax_nopriv_business_tools_split_bill', array(__CLASS__, 'handle_bill_split'));
        
        // Tax Calculator AJAX
        add_action('wp_ajax_business_tools_calculate_tax', array(__CLASS__, 'handle_tax_calculation'));
        add_action('wp_ajax_nopriv_business_tools_calculate_tax', array(__CLASS__, 'handle_tax_calculation'));
        
        // SEO Checker AJAX - Fetch URL content
        add_action('wp_ajax_business_tools_fetch_url', array(__CLASS__, 'handle_fetch_url'));
        add_action('wp_ajax_nopriv_business_tools_fetch_url', array(__CLASS__, 'handle_fetch_url'));
        
        // SEO Checker AJAX - PageSpeed Insights
        add_action('wp_ajax_business_tools_pagespeed', array(__CLASS__, 'handle_pagespeed'));
        add_action('wp_ajax_nopriv_business_tools_pagespeed', array(__CLASS__, 'handle_pagespeed'));
    }
    
    /**
     * Verify nonce
     *
     * @return bool
     */
    private static function verify_nonce() {
        $nonce = isset($_POST['nonce']) ? sanitize_text_field($_POST['nonce']) : '';
        return wp_verify_nonce($nonce, 'business-tools-nonce');
    }
    
    /**
     * Check rate limit and send error if exceeded
     *
     * @return bool True if allowed, false if rate limited
     */
    private static function check_rate_limit() {
        $rate_check = Business_Tools_Rate_Limiter::check_rate_limit();
        
        if (is_wp_error($rate_check)) {
            wp_send_json_error(array(
                'message' => $rate_check->get_error_message(),
                'code' => 'rate_limit_exceeded',
                'retry_after' => $rate_check->get_error_data('retry_after'),
            ));
            return false;
        }
        
        return true;
    }
    
    /**
     * Handle calculation request
     */
    public static function handle_calculation() {
        // Check rate limit
        if (!self::check_rate_limit()) {
            return;
        }
        
        if (!self::verify_nonce()) {
            wp_send_json_error(array('message' => __('Lỗi bảo mật.', 'business-tools')));
            return;
        }
        
        $tool_id = isset($_POST['tool_id']) ? sanitize_text_field($_POST['tool_id']) : '';
        
        // Route to appropriate tool handler
        switch ($tool_id) {
            case 'calculator':
                self::handle_calculator();
                break;
            default:
                wp_send_json_error(array('message' => __('Công cụ không hợp lệ.', 'business-tools')));
        }
    }
    
    /**
     * Handle calculator calculation
     */
    private static function handle_calculator() {
        // Calculator now works entirely client-side
        // This method is kept for backward compatibility
        wp_send_json_success(array('message' => 'Calculator works client-side'));
    }
    
    /**
     * Handle bill split request
     */
    public static function handle_bill_split() {
        // Check rate limit
        if (!self::check_rate_limit()) {
            return;
        }
        
        if (!self::verify_nonce()) {
            wp_send_json_error(array('message' => __('Lỗi bảo mật.', 'business-tools')));
            return;
        }
        
        // Try both field names for compatibility
        $total_bill = isset($_POST['total_bill']) ? floatval($_POST['total_bill']) : (isset($_POST['bill_amount']) ? floatval($_POST['bill_amount']) : 0);
        $individual_amounts = isset($_POST['individual_amounts']) ? $_POST['individual_amounts'] : array();
        
        // Convert to array of floats
        if (is_array($individual_amounts)) {
            $individual_amounts = array_map('floatval', $individual_amounts);
            // Filter out empty values
            $individual_amounts = array_filter($individual_amounts, function($val) {
                return $val >= 0;
            });
            $individual_amounts = array_values($individual_amounts); // Re-index
        } else {
            $individual_amounts = array();
        }
        
        $result = Business_Tools_Bill_Splitter::calculate($total_bill, $individual_amounts);
        
        if (is_wp_error($result)) {
            wp_send_json_error(array('message' => $result->get_error_message()));
        }
        
        wp_send_json_success($result);
    }
    
    /**
     * Handle tax calculation request
     */
    public static function handle_tax_calculation() {
        // Check rate limit
        if (!self::check_rate_limit()) {
            return;
        }
        
        if (!self::verify_nonce()) {
            wp_send_json_error(array('message' => __('Lỗi bảo mật.', 'business-tools')));
            return;
        }
        
        $tax_type = isset($_POST['tax_type']) ? sanitize_text_field($_POST['tax_type']) : 'vat';
        
        // Only PIT calculation (VAT removed)
        $monthly_income = isset($_POST['monthly_income']) ? floatval($_POST['monthly_income']) : 0;
        $num_dependents = isset($_POST['num_dependents']) ? intval($_POST['num_dependents']) : 0;
        
        // Remove dots from formatted number
        $monthly_income = str_replace('.', '', $monthly_income);
        $monthly_income = floatval($monthly_income);
        
        $result = Business_Tools_Tax_Calculator::calculate_pitt($monthly_income, $num_dependents);
        
        if (is_wp_error($result)) {
            wp_send_json_error(array('message' => $result->get_error_message()));
        }
        
        wp_send_json_success($result);
    }
    
    /**
     * Handle fetch URL content request for SEO checker
     */
    public static function handle_fetch_url() {
        // Check rate limit
        if (!self::check_rate_limit()) {
            return;
        }
        
        if (!self::verify_nonce()) {
            wp_send_json_error(array('message' => __('Lỗi bảo mật.', 'business-tools')));
            return;
        }
        
        $url = isset($_POST['url']) ? esc_url_raw($_POST['url']) : '';
        
        if (empty($url)) {
            wp_send_json_error(array('message' => __('Vui lòng nhập URL hợp lệ.', 'business-tools')));
            return;
        }
        
        // Validate URL
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            wp_send_json_error(array('message' => __('URL không hợp lệ.', 'business-tools')));
            return;
        }
        
        // Only allow http and https protocols
        $parsed_url = parse_url($url);
        if (!isset($parsed_url['scheme']) || !in_array($parsed_url['scheme'], array('http', 'https'))) {
            wp_send_json_error(array('message' => __('Chỉ hỗ trợ URL http và https.', 'business-tools')));
            return;
        }
        
        // Determine if URL is local/internal (for SSL verification)
        $is_local = (
            strpos($url, home_url()) === 0 || 
            strpos($url, 'localhost') !== false || 
            strpos($url, '127.0.0.1') !== false ||
            strpos($url, '192.168.') !== false ||
            strpos($url, '10.0.') !== false ||
            strpos($url, '.local') !== false ||
            strpos($url, '.test') !== false
        );
        
        // Prepare browser-like headers to avoid bot detection
        $parsed_url = parse_url($url);
        $headers = array(
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language' => 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding' => 'gzip, deflate, br',
            'Cache-Control' => 'max-age=0',
            'Connection' => 'keep-alive',
            'Upgrade-Insecure-Requests' => '1',
            'Sec-Fetch-Dest' => 'document',
            'Sec-Fetch-Mode' => 'navigate',
            'Sec-Fetch-Site' => 'none',
            'Sec-Fetch-User' => '?1',
        );
        
        // Add Referer if we can determine it
        if (isset($parsed_url['scheme']) && isset($parsed_url['host'])) {
            $headers['Referer'] = $parsed_url['scheme'] . '://' . $parsed_url['host'] . '/';
        }
        
        // Use a realistic Chrome user agent
        $user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        
        // Fetch URL content using wp_remote_get
        // Note: Some servers don't support HEAD requests or have SSL issues, so we use GET directly
        $response = wp_remote_get($url, array(
            'timeout' => 30,
            'sslverify' => !$is_local, // Verify SSL for external URLs, skip for local/internal
            'redirection' => 5, // Allow redirects
            'user-agent' => $user_agent,
            'headers' => $headers,
            'cookies' => array(), // Empty cookies array to start fresh
        ));
        
        if (is_wp_error($response)) {
            $error_message = $response->get_error_message();
            $error_code = $response->get_error_code();
            
            // Provide more helpful error messages
            if (strpos($error_message, 'SSL') !== false || strpos($error_message, 'certificate') !== false) {
                wp_send_json_error(array(
                    'message' => __('Lỗi SSL: Không thể xác minh chứng chỉ SSL của trang web. Vui lòng kiểm tra URL hoặc thử lại sau.', 'business-tools')
                ));
            } else if (strpos($error_message, 'timeout') !== false || strpos($error_message, 'timed out') !== false) {
                wp_send_json_error(array(
                    'message' => __('Yêu cầu quá thời gian: Trang web không phản hồi. Vui lòng thử lại sau.', 'business-tools')
                ));
            } else if (strpos($error_message, 'resolve') !== false || strpos($error_message, 'DNS') !== false) {
                wp_send_json_error(array(
                    'message' => __('Không thể tìm thấy trang web: URL không tồn tại hoặc không thể truy cập.', 'business-tools')
                ));
            } else {
                wp_send_json_error(array(
                    'message' => sprintf(__('Không thể tải nội dung từ URL: %s', 'business-tools'), $error_message)
                ));
            }
            return;
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        
        // Handle 403 Forbidden - try with different headers (some sites block certain user agents)
        if ($status_code === 403) {
            // Retry with simpler headers (some sites block complex headers)
            $simple_headers = array(
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language' => 'vi-VN,vi;q=0.9',
            );
            
            $retry_response = wp_remote_get($url, array(
                'timeout' => 30,
                'sslverify' => !$is_local,
                'redirection' => 5,
                'user-agent' => $user_agent,
                'headers' => $simple_headers,
            ));
            
            if (!is_wp_error($retry_response)) {
                $retry_status = wp_remote_retrieve_response_code($retry_response);
                if ($retry_status >= 200 && $retry_status < 400) {
                    // Retry successful, use this response
                    $response = $retry_response;
                    $status_code = $retry_status;
                }
            }
        }
        
        // Allow successful status codes (200, 201, etc.) and redirects that were followed
        if ($status_code < 200 || $status_code >= 400) {
            // Provide helpful error messages for common status codes
            $status_messages = array(
                403 => __('Trang web từ chối truy cập (403 Forbidden). Trang web có thể chặn truy cập từ server hoặc yêu cầu xác thực. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.', 'business-tools'),
                404 => __('Không tìm thấy trang (404 Not Found). Vui lòng kiểm tra lại URL.', 'business-tools'),
                500 => __('Lỗi máy chủ (500 Internal Server Error). Vui lòng thử lại sau.', 'business-tools'),
                503 => __('Dịch vụ tạm thời không khả dụng (503 Service Unavailable). Vui lòng thử lại sau.', 'business-tools'),
            );
            
            $message = isset($status_messages[$status_code]) 
                ? $status_messages[$status_code]
                : sprintf(__('URL trả về mã lỗi: %d', 'business-tools'), $status_code);
            
            wp_send_json_error(array('message' => $message));
            return;
        }
        
        $body = wp_remote_retrieve_body($response);
        
        if (empty($body)) {
            wp_send_json_error(array('message' => __('Không thể lấy nội dung từ URL.', 'business-tools')));
            return;
        }
        
        // Check actual content size (in case Content-Length header was missing)
        if (strlen($body) > 10 * 1024 * 1024) { // 10MB
            wp_send_json_error(array(
                'message' => __('Nội dung trang web quá lớn (vượt quá 10MB). Vui lòng thử với URL khác.', 'business-tools')
            ));
            return;
        }
        
        // Get content type (optional check - some servers don't send proper content-type)
        $content_type = wp_remote_retrieve_header($response, 'content-type');
        
        // Check if content looks like HTML (more lenient check)
        $is_html = false;
        if ($content_type) {
            $is_html = (stripos($content_type, 'text/html') !== false || 
                       stripos($content_type, 'application/xhtml') !== false);
        }
        
        // If content-type doesn't indicate HTML, check actual content
        if (!$is_html) {
            // Check first few bytes for HTML indicators
            $body_start = substr($body, 0, 200);
            $is_html = (stripos($body_start, '<html') !== false || 
                       stripos($body_start, '<!DOCTYPE') !== false ||
                       stripos($body_start, '<head') !== false ||
                       stripos($body_start, '<body') !== false);
        }
        
        if (!$is_html) {
            wp_send_json_error(array(
                'message' => __('URL không phải là trang HTML. Vui lòng nhập URL của trang web HTML.', 'business-tools')
            ));
            return;
        }
        
        // Also check for robots.txt and sitemap
        $parsed_url = parse_url($url);
        $base_url = $parsed_url['scheme'] . '://' . $parsed_url['host'];
        if (isset($parsed_url['port'])) {
            $base_url .= ':' . $parsed_url['port'];
        }
        
        $robots_txt_exists = false;
        $sitemap_exists = false;
        
        // Check robots.txt (reduced timeout, don't fail if check fails - it's optional)
        $robots_url = $base_url . '/robots.txt';
        $robots_response = wp_remote_get($robots_url, array(
            'timeout' => 5,
            'sslverify' => true,
            'redirection' => 2,
            'httpversion' => '1.1',
        ));
        
        // Don't fail if robots.txt check fails - it's optional
        if (!is_wp_error($robots_response)) {
            $robots_code = wp_remote_retrieve_response_code($robots_response);
            if ($robots_code === 200) {
                $robots_content_type = wp_remote_retrieve_header($robots_response, 'content-type');
                $robots_body = wp_remote_retrieve_body($robots_response);
                
                // Verify it's actually robots.txt content (not an error page)
                if (!empty($robots_body) && 
                    (stripos($robots_content_type, 'text/plain') !== false || 
                     stripos($robots_content_type, 'text/html') !== false ||
                     preg_match('/User-agent|Disallow|Allow|Sitemap/i', $robots_body))) {
                    $robots_txt_exists = true;
                }
            }
        }
        // If robots.txt check fails, we continue - it's not critical
        
        // Check sitemap.xml (try multiple common locations, don't fail if all fail)
        $sitemap_urls = array(
            $base_url . '/sitemap.xml',
            $base_url . '/sitemap_index.xml',
            $base_url . '/sitemap-index.xml',
            $base_url . '/wp-sitemap.xml', // WordPress default
        );
        
        foreach ($sitemap_urls as $sitemap_url) {
            $sitemap_response = wp_remote_get($sitemap_url, array(
                'timeout' => 5,
                'sslverify' => true,
                'redirection' => 2,
                'httpversion' => '1.1',
            ));
            
            // Don't fail if sitemap check fails - it's optional
            if (!is_wp_error($sitemap_response)) {
                $sitemap_code = wp_remote_retrieve_response_code($sitemap_response);
                if ($sitemap_code === 200) {
                    $sitemap_content_type = wp_remote_retrieve_header($sitemap_response, 'content-type');
                    $sitemap_body = wp_remote_retrieve_body($sitemap_response);
                    
                    // Verify it's actually sitemap XML (not an error page)
                    if (!empty($sitemap_body) && 
                        (stripos($sitemap_content_type, 'xml') !== false ||
                         stripos($sitemap_body, '<?xml') !== false ||
                         stripos($sitemap_body, '<urlset') !== false ||
                         stripos($sitemap_body, '<sitemapindex') !== false)) {
                        $sitemap_exists = true;
                        break; // Found valid sitemap, no need to check others
                    }
                }
            }
            // Continue to next sitemap URL if this one fails
        }
        // If all sitemap checks fail, we continue - it's not critical
        
        // Check for www/non-www subdomain issue
        $www_issue = self::check_www_subdomain($url);
        
        // Validate that we have valid HTML content before sending
        if (empty($body) || strlen($body) < 100) {
            wp_send_json_error(array(
                'message' => __('Nội dung trang web quá ngắn hoặc không hợp lệ. Có thể trang web đang chặn truy cập hoặc yêu cầu JavaScript để hiển thị nội dung.', 'business-tools')
            ));
            return;
        }
        
        wp_send_json_success(array(
            'content' => $body,
            'url' => $url,
            'robots_txt_exists' => $robots_txt_exists,
            'sitemap_exists' => $sitemap_exists,
            'www_issue' => $www_issue,
        ));
    }
    
    /**
     * Handle PageSpeed Insights API request
     */
    public static function handle_pagespeed() {
        // Security headers
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        
        // Check rate limit (unified with other handlers)
        if (!self::check_rate_limit()) {
            return;
        }
        
        if (!self::verify_nonce()) {
            wp_send_json_error(array('message' => __('Nonce verification failed.', 'business-tools')));
            return;
        }
        
        $url = isset($_POST['url']) ? esc_url_raw($_POST['url']) : '';
        
        if (empty($url)) {
            wp_send_json_error(array('message' => __('Vui lòng nhập URL hợp lệ.', 'business-tools')));
            return;
        }
        
        // Validate URL
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            wp_send_json_error(array('message' => __('URL không hợp lệ.', 'business-tools')));
            return;
        }
        
        // Get Google API key from options (can be set via WordPress admin or wp-config.php)
        $api_key = get_option('business_tools_pagespeed_api_key', '');
        
        // Allow override via wp-config.php
        if (defined('BUSINESS_TOOLS_PAGESPEED_API_KEY')) {
            $api_key = BUSINESS_TOOLS_PAGESPEED_API_KEY;
        }
        
        if (empty($api_key)) {
            wp_send_json_error(array('message' => __('Google PageSpeed Insights API key chưa được cấu hình. Vui lòng thêm API key trong WordPress settings hoặc wp-config.php.', 'business-tools')));
            return;
        }
        
        // Call Google PageSpeed Insights API
        $api_url = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
        $api_url = add_query_arg(array(
            'url' => urlencode($url),
            'key' => $api_key,
            'strategy' => 'mobile', // Can be 'mobile' or 'desktop'
        ), $api_url);
        
        $response = wp_remote_get($api_url, array(
            'timeout' => 30,
            'sslverify' => true,
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => __('Không thể kết nối đến Google PageSpeed Insights API: ', 'business-tools') . $response->get_error_message()
            ));
            return;
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if ($status_code !== 200) {
            $error_message = __('Lỗi từ Google PageSpeed Insights API.', 'business-tools');
            if (isset($data['error']['message'])) {
                $error_message = $data['error']['message'];
            }
            wp_send_json_error(array('message' => $error_message));
            return;
        }
        
        if (empty($data) || !isset($data['lighthouseResult'])) {
            wp_send_json_error(array('message' => __('Không thể phân tích kết quả từ Google PageSpeed Insights.', 'business-tools')));
            return;
        }
        
        // Extract relevant metrics
        $lighthouse = $data['lighthouseResult'];
        $categories = isset($lighthouse['categories']) ? $lighthouse['categories'] : array();
        $audits = isset($lighthouse['audits']) ? $lighthouse['audits'] : array();
        
        // Get performance score
        $performance_score = isset($categories['performance']['score']) ? round($categories['performance']['score'] * 100) : 0;
        
        // Get other scores
        $accessibility_score = isset($categories['accessibility']['score']) ? round($categories['accessibility']['score'] * 100) : 0;
        $best_practices_score = isset($categories['best-practices']['score']) ? round($categories['best-practices']['score'] * 100) : 0;
        $seo_score = isset($categories['seo']['score']) ? round($categories['seo']['score'] * 100) : 0;
        
        // Extract key metrics (matching the image format)
        $metrics = array();
        
        // First Contentful Paint
        if (isset($audits['first-contentful-paint'])) {
            $fcp_value = isset($audits['first-contentful-paint']['numericValue']) ? $audits['first-contentful-paint']['numericValue'] : 0;
            $metrics['fcp'] = round($fcp_value / 1000, 1); // Convert to seconds
        }
        
        // Speed Index
        if (isset($audits['speed-index'])) {
            $si_value = isset($audits['speed-index']['numericValue']) ? $audits['speed-index']['numericValue'] : 0;
            $metrics['speed_index'] = round($si_value / 1000, 1); // Convert to seconds
        }
        
        // Time To Interactive
        if (isset($audits['interactive'])) {
            $tti_value = isset($audits['interactive']['numericValue']) ? $audits['interactive']['numericValue'] : 0;
            $metrics['tti'] = round($tti_value / 1000, 1); // Convert to seconds
        }
        
        // First Meaningful Paint
        if (isset($audits['first-meaningful-paint'])) {
            $fmp_value = isset($audits['first-meaningful-paint']['numericValue']) ? $audits['first-meaningful-paint']['numericValue'] : 0;
            $metrics['fmp'] = round($fmp_value / 1000, 1); // Convert to seconds
        }
        
        // First CPU Idle
        if (isset($audits['first-cpu-idle'])) {
            $fci_value = isset($audits['first-cpu-idle']['numericValue']) ? $audits['first-cpu-idle']['numericValue'] : 0;
            $metrics['fci'] = round($fci_value / 1000, 1); // Convert to seconds
        }
        
        // Estimated Input Latency
        if (isset($audits['estimated-input-latency'])) {
            $eil_value = isset($audits['estimated-input-latency']['numericValue']) ? $audits['estimated-input-latency']['numericValue'] : 0;
            $metrics['eil'] = round($eil_value, 0); // Keep in milliseconds
        }
        
        // Largest Contentful Paint (for Chrome UX Report)
        if (isset($audits['largest-contentful-paint'])) {
            $lcp_value = isset($audits['largest-contentful-paint']['numericValue']) ? $audits['largest-contentful-paint']['numericValue'] : 0;
            $metrics['lcp'] = round($lcp_value / 1000, 1); // Convert to seconds
        }
        
        // Total Blocking Time (for Chrome UX Report - First Input Delay)
        if (isset($audits['total-blocking-time'])) {
            $tbt_value = isset($audits['total-blocking-time']['numericValue']) ? $audits['total-blocking-time']['numericValue'] : 0;
            $metrics['tbt'] = round($tbt_value, 0); // Keep in milliseconds
        }
        
        // Cumulative Layout Shift (CLS) - Core Web Vital
        if (isset($audits['cumulative-layout-shift'])) {
            $cls_value = isset($audits['cumulative-layout-shift']['numericValue']) ? $audits['cumulative-layout-shift']['numericValue'] : 0;
            $metrics['cls'] = round($cls_value, 3); // Keep as decimal (0.0-1.0)
        }
        
        // Interaction to Next Paint (INP) - New Core Web Vital (if available)
        if (isset($audits['interaction-to-next-paint'])) {
            $inp_value = isset($audits['interaction-to-next-paint']['numericValue']) ? $audits['interaction-to-next-paint']['numericValue'] : 0;
            $metrics['inp'] = round($inp_value, 0); // Keep in milliseconds
        }
        
        // First Input Delay (FID) - Legacy Core Web Vital (if available)
        if (isset($audits['max-potential-fid'])) {
            $fid_value = isset($audits['max-potential-fid']['numericValue']) ? $audits['max-potential-fid']['numericValue'] : 0;
            $metrics['fid'] = round($fid_value, 0); // Keep in milliseconds
        }
        
        // Get opportunities (recommendations)
        $opportunities = array();
        $opportunity_audits = array(
            'render-blocking-resources',
            'unused-css-rules',
            'unused-javascript',
            'modern-image-formats',
            'offscreen-images',
            'unminified-css',
            'unminified-javascript',
            'efficient-animated-content',
            'uses-optimized-images',
            'uses-text-compression',
            'uses-responsive-images',
        );
        
        foreach ($opportunity_audits as $audit_id) {
            if (isset($audits[$audit_id]) && isset($audits[$audit_id]['details']['overallSavingsMs'])) {
                $opportunities[] = array(
                    'id' => $audit_id,
                    'title' => isset($audits[$audit_id]['title']) ? $audits[$audit_id]['title'] : $audit_id,
                    'description' => isset($audits[$audit_id]['description']) ? $audits[$audit_id]['description'] : '',
                    'savings' => round($audits[$audit_id]['details']['overallSavingsMs']),
                );
            }
        }
        
        // Sort by savings (descending)
        usort($opportunities, function($a, $b) {
            return $b['savings'] - $a['savings'];
        });
        
        wp_send_json_success(array(
            'metrics' => $metrics,
        ));
    }
    
    /**
     * Check for www/non-www subdomain issue
     *
     * @param string $url URL to check
     * @return array Issue details
     */
    private static function check_www_subdomain($url) {
        $parsed = parse_url($url);
        if (!isset($parsed['host'])) {
            return array('has_issue' => false);
        }
        
        $host = $parsed['host'];
        $has_www = strpos($host, 'www.') === 0;
        
        // Check if both www and non-www versions exist
        $base_host = $has_www ? substr($host, 4) : $host;
        $www_url = ($parsed['scheme'] ?? 'https') . '://www.' . $base_host . ($parsed['path'] ?? '');
        $non_www_url = ($parsed['scheme'] ?? 'https') . '://' . $base_host . ($parsed['path'] ?? '');
        
        $www_exists = false;
        $non_www_exists = false;
        
        // Check www version
        $www_response = wp_remote_head($www_url, array(
            'timeout' => 5,
            'sslverify' => true,
            'redirection' => 0, // Don't follow redirects
        ));
        if (!is_wp_error($www_response)) {
            $www_code = wp_remote_retrieve_response_code($www_response);
            $www_exists = ($www_code >= 200 && $www_code < 400);
        }
        
        // Check non-www version
        $non_www_response = wp_remote_head($non_www_url, array(
            'timeout' => 5,
            'sslverify' => true,
            'redirection' => 0,
        ));
        if (!is_wp_error($non_www_response)) {
            $non_www_code = wp_remote_retrieve_response_code($non_www_response);
            $non_www_exists = ($non_www_code >= 200 && $non_www_code < 400);
        }
        
        // Issue exists if both versions are accessible
        $has_issue = $www_exists && $non_www_exists;
        
        return array(
            'has_issue' => $has_issue,
            'www_exists' => $www_exists,
            'non_www_exists' => $non_www_exists,
            'current_has_www' => $has_www,
            'www_url' => $www_url,
            'non_www_url' => $non_www_url,
        );
    }
}

// Initialize
Business_Tools_AJAX::init();

