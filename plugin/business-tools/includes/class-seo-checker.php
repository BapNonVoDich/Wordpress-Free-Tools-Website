<?php
/**
 * SEO Checker Tool Class
 * 
 * Analyze SEO factors for articles and web pages
 *
 * @package BusinessTools
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Business_Tools_SEO_Checker Class
 */
class Business_Tools_SEO_Checker {
    
    /**
     * Tool configuration
     *
     * @return array
     */
    public static function get_config() {
        return array(
            'id'          => 'seo-checker',
            'name'        => 'Kiểm Tra SEO Bài Viết',
            'slug'        => 'seo-checker',
            'description' => 'Phân tích và kiểm tra các yếu tố SEO cho bài viết, bao gồm title, meta description, headings, từ khóa, và nhiều chỉ số khác.',
            'category'    => 'business',
            'version'     => '1.0.0',
        );
    }
    
    /**
     * Analyze SEO factors from content
     *
     * @param string $content HTML content or text
     * @param string $url Optional URL to fetch content from
     * @return array|WP_Error Analysis results or error
     */
    public static function analyze($content, $url = '') {
        if (empty($content) && empty($url)) {
            return new WP_Error('missing_content', __('Vui lòng nhập nội dung hoặc URL để phân tích.', 'business-tools'));
        }
        
        // If URL provided, fetch content (client-side will handle this)
        // This method is mainly for server-side validation
        return array(
            'content' => $content,
            'url' => $url,
            'analyzed' => true,
        );
    }
    
    /**
     * Render SEO checker interface
     *
     * @return string HTML output
     */
    public static function render() {
        ob_start();
        ?>
        <div class="business-tool business-tool-seo-checker">
            <form id="seo-checker-form" class="tool-form">
                <div class="form-group">
                    <label for="seo-url" class="form-label">
                        <?php esc_html_e('URL trang web:', 'business-tools'); ?>
                    </label>
                    <input 
                        type="url" 
                        id="seo-url" 
                        class="form-input" 
                        placeholder="https://example.com/article"
                        required
                        aria-label="<?php esc_attr_e('URL trang web cần kiểm tra SEO', 'business-tools'); ?>"
                        aria-required="true"
                    >
                    <small style="color: #666; font-size: 0.9em; display: block; margin-top: 0.5rem;">
                        <?php esc_html_e('Nhập URL của trang web cần kiểm tra SEO', 'business-tools'); ?>
                    </small>
                </div>
                
                <button type="button" id="seo-analyze-btn" class="btn btn-primary btn-full" aria-label="<?php esc_attr_e('Bắt đầu phân tích SEO', 'business-tools'); ?>">
                    <?php esc_html_e('Phân Tích SEO', 'business-tools'); ?>
                </button>
            </form>
            
            <div class="seo-checker-result" id="seo-checker-result" style="display: none;" role="region" aria-labelledby="seo-results-title">
                <h2 class="section-title" id="seo-results-title"><?php esc_html_e('Kết Quả Phân Tích SEO', 'business-tools'); ?></h2>
                
                <!-- Action Buttons -->
                <div class="seo-action-buttons" id="seo-action-buttons" style="display: none;">
                    <button type="button" id="seo-copy-url-btn" class="btn btn-secondary seo-action-btn" aria-label="<?php esc_attr_e('Copy URL', 'business-tools'); ?>">
                        <span class="seo-btn-icon" aria-hidden="true">📋</span> <?php esc_html_e('Copy URL', 'business-tools'); ?>
                    </button>
                    <button type="button" id="seo-analyze-another-btn" class="btn btn-secondary seo-action-btn" aria-label="<?php esc_attr_e('Analyze Another URL', 'business-tools'); ?>">
                        <span class="seo-btn-icon" aria-hidden="true">🔄</span> <?php esc_html_e('Phân Tích URL Khác', 'business-tools'); ?>
                    </button>
                </div>
                
                <!-- URL Info -->
                <div class="seo-url-info" id="seo-url-info" style="display: none;">
                    <div class="seo-url-display">
                        <strong><?php esc_html_e('URL đang phân tích:', 'business-tools'); ?></strong> <span id="seo-current-url"></span>
                    </div>
                    <div class="seo-analysis-time">
                        <strong><?php esc_html_e('Thời gian phân tích:', 'business-tools'); ?></strong> <span id="seo-analysis-timestamp"></span>
                    </div>
                </div>
                
                <!-- Overall Score -->
                <div class="seo-score-section" role="status" aria-live="polite" aria-atomic="true">
                    <div class="seo-score-circle" aria-label="<?php esc_attr_e('Điểm SEO tổng thể', 'business-tools'); ?>">
                        <div class="seo-score-value" id="seo-overall-score" aria-label="<?php esc_attr_e('Điểm số', 'business-tools'); ?>">0/100</div>
                        <div class="seo-score-label"><?php esc_html_e('Điểm SEO', 'business-tools'); ?></div>
                    </div>
                </div>
                
                <!-- Recommendations - MOVED TO TOP -->
                <div class="seo-section seo-recommendations-section">
                    <h3 class="seo-section-title"><?php esc_html_e('📋 Đề Xuất Cải Thiện', 'business-tools'); ?></h3>
                    <div class="seo-recommendations" id="seo-recommendations">
                        <!-- Dynamic content -->
                    </div>
                </div>
                
                <!-- Summary (Nhận Xét Chung) - Moved right after Recommendations -->
                <div class="seo-section">
                    <h3 class="seo-section-title"><?php esc_html_e('Nhận Xét Chung', 'business-tools'); ?></h3>
                    <div class="seo-factors-grid" id="seo-basic-factors">
                        <!-- Dynamic content -->
                    </div>
                </div>
                
                <!-- Keyword Analysis -->
                <div class="seo-section" id="seo-keyword-section" style="display: none;">
                    <h3 class="seo-section-title"><?php esc_html_e('Phân Tích Từ Khóa', 'business-tools'); ?></h3>
                    <div class="seo-keyword-analysis" id="seo-keyword-analysis">
                        <!-- Dynamic content -->
                    </div>
                </div>
                
                <!-- Content Analysis -->
                <div class="seo-section">
                    <h3 class="seo-section-title"><?php esc_html_e('Phân Tích Nội Dung', 'business-tools'); ?></h3>
                    <div class="seo-content-analysis" id="seo-content-analysis">
                        <!-- Dynamic content -->
                    </div>
                </div>
                
                <!-- Headings Structure -->
                <div class="seo-section">
                    <h3 class="seo-section-title"><?php esc_html_e('Cấu Trúc Heading', 'business-tools'); ?></h3>
                    <div class="seo-headings-structure" id="seo-headings-structure">
                        <!-- Dynamic content -->
                    </div>
                </div>
                
                <!-- Links Analysis -->
                <div class="seo-section">
                    <h3 class="seo-section-title"><?php esc_html_e('Phân Tích Liên Kết', 'business-tools'); ?></h3>
                    <div class="seo-links-analysis" id="seo-links-analysis">
                        <!-- Dynamic content -->
                    </div>
                </div>
                
                <!-- Images Analysis -->
                <div class="seo-section">
                    <h3 class="seo-section-title"><?php esc_html_e('Phân Tích Hình Ảnh', 'business-tools'); ?></h3>
                    <div class="seo-images-analysis" id="seo-images-analysis">
                        <!-- Dynamic content -->
                    </div>
                </div>
                
                <!-- URL Tests -->
                <div class="seo-section">
                    <h3 class="seo-section-title"><?php esc_html_e('Kiểm Tra URL & Cấu Hình', 'business-tools'); ?></h3>
                    <div class="seo-url-tests" id="seo-url-tests">
                        <!-- Dynamic content -->
                    </div>
                </div>
                
                <!-- Structured Data & Social Tags -->
                <div class="seo-section">
                    <h3 class="seo-section-title"><?php esc_html_e('Structured Data & Social Tags', 'business-tools'); ?></h3>
                    <div class="seo-structured-data" id="seo-structured-data">
                        <!-- Dynamic content -->
                    </div>
                </div>
                
                <!-- Mobile Usability - NEW (will be inserted dynamically before PageSpeed) -->
                
                <!-- Google PageSpeed Insights - Loaded last (moved to near bottom) -->
                <div class="seo-section" id="seo-pagespeed-insights">
                    <!-- Dynamic content -->
                </div>
                
                <!-- Back to Top Button -->
                <button type="button" id="seo-back-to-top" class="seo-back-to-top" aria-label="<?php esc_attr_e('Back to top', 'business-tools'); ?>" style="display: none;">
                    <span aria-hidden="true">↑</span>
                </button>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}

