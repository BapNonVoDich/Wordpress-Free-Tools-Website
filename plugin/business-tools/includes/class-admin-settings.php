<?php
/**
 * Admin Settings Class
 * 
 * Handles WordPress admin settings page for Business Tools plugin
 *
 * @package BusinessTools
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Business_Tools_Admin_Settings Class
 */
class Business_Tools_Admin_Settings {
    
    /**
     * Initialize hooks
     */
    public static function init() {
        add_action('admin_menu', array(__CLASS__, 'add_admin_menu'));
        add_action('admin_init', array(__CLASS__, 'register_settings'));
    }
    
    /**
     * Add admin menu
     */
    public static function add_admin_menu() {
        add_submenu_page(
            'edit.php?post_type=tool',
            __('Cài Đặt', 'business-tools'),
            __('Cài Đặt', 'business-tools'),
            'manage_options',
            'business-tools-settings',
            array(__CLASS__, 'render_settings_page')
        );
    }
    
    /**
     * Register settings
     */
    public static function register_settings() {
        // Register PageSpeed API Key setting
        register_setting(
            'business_tools_settings',
            'business_tools_pagespeed_api_key',
            array(
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'default' => '',
            )
        );
    }
    
    /**
     * Render settings page
     */
    public static function render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }
        
        // Handle form submission
        if (isset($_POST['business_tools_settings_submit']) && check_admin_referer('business_tools_settings_nonce')) {
            $api_key = isset($_POST['business_tools_pagespeed_api_key']) ? sanitize_text_field($_POST['business_tools_pagespeed_api_key']) : '';
            update_option('business_tools_pagespeed_api_key', $api_key);
            
            echo '<div class="notice notice-success is-dismissible"><p>' . __('Cài đặt đã được lưu!', 'business-tools') . '</p></div>';
        }
        
        $current_api_key = get_option('business_tools_pagespeed_api_key', '');
        $has_wp_config_key = defined('BUSINESS_TOOLS_PAGESPEED_API_KEY');
        $wp_config_key = $has_wp_config_key ? BUSINESS_TOOLS_PAGESPEED_API_KEY : '';
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <form method="post" action="">
                <?php wp_nonce_field('business_tools_settings_nonce'); ?>
                
                <table class="form-table" role="presentation">
                    <tbody>
                        <tr>
                            <th scope="row">
                                <label for="business_tools_pagespeed_api_key"><?php _e('Google PageSpeed Insights API Key', 'business-tools'); ?></label>
                            </th>
                            <td>
                                <?php if ($has_wp_config_key): ?>
                                    <p class="description" style="color: #d63638;">
                                        <strong><?php _e('Lưu ý:', 'business-tools'); ?></strong> 
                                        <?php _e('API key đang được cấu hình trong wp-config.php. Giá trị trong wp-config.php sẽ được ưu tiên sử dụng.', 'business-tools'); ?>
                                    </p>
                                    <input 
                                        type="text" 
                                        id="business_tools_pagespeed_api_key" 
                                        name="business_tools_pagespeed_api_key" 
                                        value="<?php echo esc_attr($current_api_key); ?>" 
                                        class="regular-text"
                                        placeholder="<?php echo esc_attr($wp_config_key ? '***' . substr($wp_config_key, -4) : ''); ?>"
                                        <?php echo $has_wp_config_key ? 'disabled' : ''; ?>
                                    />
                                    <?php if ($wp_config_key): ?>
                                        <p class="description">
                                            <?php _e('API key từ wp-config.php:', 'business-tools'); ?> 
                                            <code><?php echo esc_html('***' . substr($wp_config_key, -4)); ?></code>
                                        </p>
                                    <?php endif; ?>
                                <?php else: ?>
                                    <input 
                                        type="text" 
                                        id="business_tools_pagespeed_api_key" 
                                        name="business_tools_pagespeed_api_key" 
                                        value="<?php echo esc_attr($current_api_key); ?>" 
                                        class="regular-text"
                                        placeholder="AIzaSy..."
                                    />
                                <?php endif; ?>
                                <p class="description">
                                    <?php _e('Nhập Google PageSpeed Insights API Key của bạn. Nếu chưa có, xem hướng dẫn tại', 'business-tools'); ?>
                                    <a href="<?php echo esc_url(plugin_dir_url(BUSINESS_TOOLS_PLUGIN_FILE) . 'PAGESPEED_API_SETUP.md'); ?>" target="_blank"><?php _e('đây', 'business-tools'); ?></a>.
                                </p>
                                <p class="description">
                                    <?php _e('API key miễn phí có giới hạn 25,000 requests/ngày.', 'business-tools'); ?>
                                </p>
                            </td>
                        </tr>
                    </tbody>
                </table>
                
                <?php submit_button(__('Lưu Cài Đặt', 'business-tools'), 'primary', 'business_tools_settings_submit'); ?>
            </form>
            
            <hr>
            
            <h2><?php _e('Hướng Dẫn', 'business-tools'); ?></h2>
            <div class="card">
                <h3><?php _e('Cách lấy Google PageSpeed Insights API Key:', 'business-tools'); ?></h3>
                <ol>
                    <li><?php _e('Truy cập', 'business-tools'); ?> <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
                    <li><?php _e('Tạo một project mới hoặc chọn project hiện có', 'business-tools'); ?></li>
                    <li><?php _e('Bật PageSpeed Insights API:', 'business-tools'); ?>
                        <ul>
                            <li><?php _e('Vào APIs & Services > Library', 'business-tools'); ?></li>
                            <li><?php _e('Tìm "PageSpeed Insights API"', 'business-tools'); ?></li>
                            <li><?php _e('Click Enable', 'business-tools'); ?></li>
                        </ul>
                    </li>
                    <li><?php _e('Tạo API Key:', 'business-tools'); ?>
                        <ul>
                            <li><?php _e('Vào APIs & Services > Credentials', 'business-tools'); ?></li>
                            <li><?php _e('Click Create Credentials > API Key', 'business-tools'); ?></li>
                            <li><?php _e('Copy API key vừa tạo', 'business-tools'); ?></li>
                        </ul>
                    </li>
                    <li><?php _e('Dán API key vào ô trên và click "Lưu Cài Đặt"', 'business-tools'); ?></li>
                </ol>
            </div>
        </div>
        <?php
    }
}

// Initialize
Business_Tools_Admin_Settings::init();


