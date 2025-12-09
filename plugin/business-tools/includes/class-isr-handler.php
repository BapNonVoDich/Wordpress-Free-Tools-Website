<?php
/**
 * ISR Handler Class
 * 
 * Handles Incremental Static Regeneration for tool pages using WordPress Transients API
 * Automatically uses Object Cache (Redis/Memcached) if available
 *
 * @package BusinessTools
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Business_Tools_ISR_Handler Class
 */
class Business_Tools_ISR_Handler {
    
    /**
     * Cache version (for cache invalidation on updates)
     */
    private static $cache_version = '1.0';
    
    /**
     * Cache expiration time (24 hours)
     */
    private static $cache_expiration = 24 * HOUR_IN_SECONDS;
    
    /**
     * Transient prefix
     */
    private static $transient_prefix = 'bt_isr_';
    
    /**
     * Initialize
     */
    public static function init() {
        // Hook into template loading
        add_action('template_redirect', array(__CLASS__, 'maybe_serve_cached_page'), 1);
        add_action('wp', array(__CLASS__, 'maybe_generate_cache'), 99);
    }
    
    /**
     * Get cache key for URL
     *
     * @param string|null $url URL (optional, uses current if not provided)
     * @return string Cache key
     */
    private static function get_cache_key($url = null) {
        if (null === $url) {
            $url = home_url($_SERVER['REQUEST_URI']);
        }
        
        // Create unique key from URL + version
        $key = self::$transient_prefix . md5($url) . '_v' . self::$cache_version;
        return $key;
    }
    
    /**
     * Maybe serve cached page
     * 
     * Checks if cached HTML exists and is valid, serves it if available
     */
    public static function maybe_serve_cached_page() {
        // Only for tool pages
        if (!self::is_tool_page()) {
            return;
        }
        
        // Don't serve cache for admin or logged-in users (optional - for debugging)
        if (current_user_can('manage_options') && isset($_GET['nocache'])) {
            return;
        }
        
        $cache_key = self::get_cache_key();
        
        // ⭐ Get from Transient (automatically uses Object Cache if available)
        $html = get_transient($cache_key);
        
        if ($html !== false) {
            // ✅ Cache exists and is valid → serve immediately
            echo $html;
            exit; // Stop WordPress from rendering
        }
        // Cache doesn't exist or expired → continue normal rendering
    }
    
    /**
     * Maybe generate cache
     * 
     * Generates cache after page is rendered (if not already cached)
     */
    public static function maybe_generate_cache() {
        // Only for tool pages
        if (!self::is_tool_page()) {
            return;
        }
        
        // Don't cache for admin or AJAX requests
        if (wp_doing_ajax() || wp_doing_cron() || is_admin()) {
            return;
        }
        
        // Don't cache if already cached and valid
        $cache_key = self::get_cache_key();
        $existing = get_transient($cache_key);
        
        if ($existing !== false) {
            // Cache already exists and is valid
            return;
        }
        
        // Generate cache in background (non-blocking)
        self::generate_cache_async();
    }
    
    /**
     * Generate cache asynchronously
     * 
     * Makes a non-blocking request to regenerate cache
     */
    private static function generate_cache_async() {
        $url = home_url($_SERVER['REQUEST_URI']);
        
        // Use wp_remote_get with very short timeout (non-blocking)
        // Note: sslverify is set to false only for local/internal requests
        // For production, consider using sslverify => true or checking if URL is local
        $is_local = (strpos($url, home_url()) === 0 || strpos($url, 'localhost') !== false || strpos($url, '127.0.0.1') !== false);
        wp_remote_get($url, array(
            'timeout' => 0.01,
            'blocking' => false,
            'sslverify' => !$is_local, // Verify SSL for external URLs
            'cookies' => $_COOKIE, // Pass cookies for proper rendering
        ));
    }
    
    /**
     * Generate cache for a page
     *
     * @param string $url Page URL
     * @return bool True on success
     */
    public static function generate_cache($url) {
        // Fetch the page HTML
        // Note: sslverify is set to false only for local/internal requests
        $is_local = (strpos($url, home_url()) === 0 || strpos($url, 'localhost') !== false || strpos($url, '127.0.0.1') !== false);
        $response = wp_remote_get($url, array(
            'timeout' => 30,
            'sslverify' => !$is_local, // Verify SSL for external URLs
            'cookies' => $_COOKIE,
        ));
        
        if (is_wp_error($response)) {
            return false;
        }
        
        $html = wp_remote_retrieve_body($response);
        
        if (empty($html)) {
            return false;
        }
        
        // Get cache key
        $cache_key = self::get_cache_key($url);
        
        // ⭐ Save to Transient (automatically uses Object Cache if available)
        // WordPress will:
        // - Use Redis/Memcached if configured → Very fast (RAM)
        // - Use database if no Object Cache → Still works
        set_transient($cache_key, $html, self::$cache_expiration);
        
        return true;
    }
    
    /**
     * Invalidate page cache
     *
     * @param string $path Page path (e.g., '/tools/calculator/')
     */
    public static function invalidate_page($path) {
        $url = home_url($path);
        $cache_key = self::get_cache_key($url);
        
        // ⭐ Delete Transient (works with both Object Cache and database)
        delete_transient($cache_key);
        
        // Also clear from Object Cache directly (if available)
        if (function_exists('wp_cache_delete')) {
            wp_cache_delete($cache_key, 'transient');
        }
    }
    
    /**
     * Clear all ISR caches
     * 
     * Note: This is a simplified version. For production, you might want to
     * track all cache keys or use a pattern-based deletion.
     */
    public static function clear_all_caches() {
        global $wpdb;
        
        // Delete all transients with our prefix
        // WordPress stores transients as: _transient_{key} and _transient_timeout_{key}
        $prefix = '_transient_' . self::$transient_prefix;
        $timeout_prefix = '_transient_timeout_' . self::$transient_prefix;
        
        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} 
                WHERE option_name LIKE %s 
                OR option_name LIKE %s",
                $wpdb->esc_like($prefix) . '%',
                $wpdb->esc_like($timeout_prefix) . '%'
            )
        );
        
        // Clear Object Cache if available
        if (function_exists('wp_cache_flush_group')) {
            wp_cache_flush_group('transient');
        }
    }
    
    /**
     * Check if current page is a tool page
     *
     * @return bool
     */
    private static function is_tool_page() {
        // Check if we're on a tool single page or archive
        if (is_singular('tool') || is_post_type_archive('tool')) {
            return true;
        }
        
        // Fallback: check URL
        $request_uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
        return strpos($request_uri, '/tools/') !== false;
    }
    
    /**
     * Get cache statistics (for debugging)
     *
     * @return array Cache stats
     */
    public static function get_cache_stats() {
        global $wpdb;
        
        $prefix = '_transient_' . self::$transient_prefix;
        $count = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->options} 
                WHERE option_name LIKE %s",
                $wpdb->esc_like($prefix) . '%'
            )
        );
        
        return array(
            'cached_pages' => (int) $count,
            'cache_version' => self::$cache_version,
            'expiration' => self::$cache_expiration,
            'object_cache_enabled' => wp_using_ext_object_cache(),
        );
    }
}

// Initialize
Business_Tools_ISR_Handler::init();

