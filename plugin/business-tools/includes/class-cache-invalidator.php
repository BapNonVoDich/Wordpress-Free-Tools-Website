<?php
/**
 * Cache Invalidator Class
 * 
 * Handles cache invalidation for ISR system
 *
 * @package BusinessTools
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Business_Tools_Cache_Invalidator Class
 */
class Business_Tools_Cache_Invalidator {
    
    /**
     * Initialize hooks
     */
    public static function init() {
        // Legacy hooks (for old registration system)
        add_action('business_tools_tool_registered', array(__CLASS__, 'on_tool_registered'), 10, 1);
        add_action('business_tools_tool_unregistered', array(__CLASS__, 'on_tool_unregistered'), 10, 1);
        
        // CPT hooks (for new CPT-based system)
        add_action('save_post_tool', array(__CLASS__, 'on_tool_saved'), 10, 3);
        add_action('delete_post', array(__CLASS__, 'on_tool_deleted'), 10, 1);
        add_action('trash_post', array(__CLASS__, 'on_tool_trashed'), 10, 1);
        add_action('untrash_post', array(__CLASS__, 'on_tool_untrashed'), 10, 1);
    }
    
    /**
     * Invalidate caches when tool is registered
     *
     * @param array $tool Tool data
     */
    public static function on_tool_registered($tool) {
        self::invalidate_tool_registration();
        self::invalidate_tool_page($tool['slug']);
        self::invalidate_homepage();
    }
    
    /**
     * Invalidate caches when tool is unregistered
     *
     * @param string $tool_id Tool ID
     */
    public static function on_tool_unregistered($tool_id) {
        self::invalidate_tool_registration();
        self::invalidate_homepage();
    }
    
    /**
     * Invalidate tool registration cache
     */
    public static function invalidate_tool_registration() {
        // Clear transient cache
        delete_transient('business_tools_all_tools');
        delete_transient('business_tools_menu_items');
        
        // Clear object cache if available
        if (function_exists('wp_cache_delete')) {
            wp_cache_delete('business_tools_all_tools', 'business-tools');
            wp_cache_delete('business_tools_menu_items', 'business-tools');
        }
        
        // Trigger action
        do_action('business_tools_cache_invalidated', 'tool_registration');
    }
    
    /**
     * Invalidate specific tool page cache
     *
     * @param string $tool_slug Tool slug
     */
    public static function invalidate_tool_page($tool_slug) {
        $cache_key = 'business_tools_page_' . $tool_slug;
        
        // Clear transient
        delete_transient($cache_key);
        
        // Clear object cache
        if (function_exists('wp_cache_delete')) {
            wp_cache_delete($cache_key, 'business-tools');
        }
        
        // Clear ISR cache
        Business_Tools_ISR_Handler::invalidate_page('/tools/' . $tool_slug . '/');
        
        // Trigger action
        do_action('business_tools_cache_invalidated', 'tool_page', $tool_slug);
    }
    
    /**
     * Handle tool CPT save/update
     *
     * @param int $post_id Post ID
     * @param WP_Post $post Post object
     * @param bool $update Whether this is an update
     */
    public static function on_tool_saved($post_id, $post, $update) {
        // Skip autosaves and revisions
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
        
        if (wp_is_post_revision($post_id)) {
            return;
        }
        
        // Get tool slug
        $tool_slug = $post->post_name;
        
        if (empty($tool_slug)) {
            return;
        }
        
        // Invalidate this tool's cache
        self::invalidate_tool_page($tool_slug);
        
        // Invalidate homepage (has tool grid)
        self::invalidate_homepage();
        
        // Invalidate archive page
        Business_Tools_ISR_Handler::invalidate_page('/tools/');
    }
    
    /**
     * Handle tool CPT deletion
     *
     * @param int $post_id Post ID
     */
    public static function on_tool_deleted($post_id) {
        $post = get_post($post_id);
        
        if (!$post || $post->post_type !== 'tool') {
            return;
        }
        
        $tool_slug = $post->post_name;
        
        if (!empty($tool_slug)) {
            self::invalidate_tool_page($tool_slug);
        }
        
        // Invalidate homepage and archive
        self::invalidate_homepage();
        Business_Tools_ISR_Handler::invalidate_page('/tools/');
    }
    
    /**
     * Handle tool CPT trashed
     *
     * @param int $post_id Post ID
     */
    public static function on_tool_trashed($post_id) {
        self::on_tool_deleted($post_id);
    }
    
    /**
     * Handle tool CPT untrashed
     *
     * @param int $post_id Post ID
     */
    public static function on_tool_untrashed($post_id) {
        $post = get_post($post_id);
        
        if (!$post || $post->post_type !== 'tool') {
            return;
        }
        
        $tool_slug = $post->post_name;
        
        if (!empty($tool_slug)) {
            self::invalidate_tool_page($tool_slug);
        }
        
        // Invalidate homepage and archive
        self::invalidate_homepage();
        Business_Tools_ISR_Handler::invalidate_page('/tools/');
    }
    
    /**
     * Invalidate homepage cache
     */
    public static function invalidate_homepage() {
        $cache_key = 'business_tools_homepage';
        
        // Clear transient
        delete_transient($cache_key);
        
        // Clear object cache
        if (function_exists('wp_cache_delete')) {
            wp_cache_delete($cache_key, 'business-tools');
        }
        
        // Clear ISR cache
        Business_Tools_ISR_Handler::invalidate_page('/');
        
        // Trigger action
        do_action('business_tools_cache_invalidated', 'homepage');
    }
    
    /**
     * Clear all caches
     */
    public static function clear_all_caches() {
        // Clear all transients
        global $wpdb;
        $wpdb->query(
            "DELETE FROM {$wpdb->options} 
            WHERE option_name LIKE '_transient_business_tools_%' 
            OR option_name LIKE '_transient_timeout_business_tools_%'"
        );
        
        // Clear object cache
        if (function_exists('wp_cache_flush')) {
            wp_cache_flush();
        }
        
        // Clear ISR caches
        Business_Tools_ISR_Handler::clear_all_caches();
        
        // Trigger action
        do_action('business_tools_all_caches_cleared');
    }
}

// Initialize
Business_Tools_Cache_Invalidator::init();

