<?php
/**
 * Tool Registry Class
 * 
 * Core auto-registration system for business tools
 *
 * @package BusinessTools
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Business_Tools_Registry Class
 */
class Business_Tools_Registry {
    
    /**
     * Single instance
     */
    private static $instance = null;
    
    /**
     * Registered tools
     */
    private $tools = array();
    
    /**
     * Option name for storing tools
     */
    private $option_name = 'business_tools_registry';
    
    /**
     * Get instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
            self::$instance->load_tools();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        // Private constructor for singleton
    }
    
    /**
     * Load tools from database
     */
    private function load_tools() {
        $stored_tools = get_option($this->option_name, array());
        
        // Validate stored tools
        if (is_array($stored_tools)) {
            $this->tools = $stored_tools;
        }
    }
    
    /**
     * Register a tool
     *
     * @param array $tool_data Tool data array
     * @return bool|WP_Error True on success, WP_Error on failure
     */
    public static function register_tool($tool_data) {
        $instance = self::get_instance();
        
        // Validate tool data
        $required_fields = array('id', 'name', 'slug', 'description');
        foreach ($required_fields as $field) {
            if (empty($tool_data[$field])) {
                return new WP_Error(
                    'missing_field',
                    sprintf(__('Thiếu trường bắt buộc: %s', 'business-tools'), $field)
                );
            }
        }
        
        // Set defaults
        $tool = wp_parse_args($tool_data, array(
            'id' => '',
            'name' => '',
            'slug' => '',
            'description' => '',
            'category' => 'business',
            'icon' => '',
            'version' => '1.0.0',
            'author' => '',
            'registered_at' => current_time('mysql'),
        ));
        
        // Sanitize data
        $tool['id'] = sanitize_key($tool['id']);
        $tool['slug'] = sanitize_title($tool['slug']);
        $tool['name'] = sanitize_text_field($tool['name']);
        $tool['description'] = sanitize_textarea_field($tool['description']);
        $tool['category'] = sanitize_key($tool['category']);
        
        // Add to registry
        $instance->tools[$tool['id']] = $tool;
        
        // Save to database
        $instance->save_tools();
        
        // Invalidate caches
        Business_Tools_Cache_Invalidator::invalidate_tool_registration();
        
        // Trigger action
        do_action('business_tools_tool_registered', $tool);
        
        return true;
    }
    
    /**
     * Get all registered tools
     *
     * @return array Array of registered tools
     */
    public static function get_all_tools() {
        $instance = self::get_instance();
        return array_values($instance->tools);
    }
    
    /**
     * Get tool by ID
     *
     * @param string $tool_id Tool ID
     * @return array|null Tool data or null if not found
     */
    public static function get_tool_by_id($tool_id) {
        $instance = self::get_instance();
        return isset($instance->tools[$tool_id]) ? $instance->tools[$tool_id] : null;
    }
    
    /**
     * Get tool by slug
     *
     * @param string $slug Tool slug
     * @return array|null Tool data or null if not found
     */
    public static function get_tool_by_slug($slug) {
        $instance = self::get_instance();
        
        foreach ($instance->tools as $tool) {
            if ($tool['slug'] === $slug) {
                return $tool;
            }
        }
        
        return null;
    }
    
    /**
     * Get tools by category
     *
     * @param string $category Category name
     * @return array Array of tools in category
     */
    public static function get_tools_by_category($category) {
        $instance = self::get_instance();
        $filtered = array();
        
        foreach ($instance->tools as $tool) {
            if ($tool['category'] === $category) {
                $filtered[] = $tool;
            }
        }
        
        return $filtered;
    }
    
    /**
     * Unregister a tool
     *
     * @param string $tool_id Tool ID
     * @return bool True on success, false on failure
     */
    public static function unregister_tool($tool_id) {
        $instance = self::get_instance();
        
        if (isset($instance->tools[$tool_id])) {
            unset($instance->tools[$tool_id]);
            $instance->save_tools();
            
            // Invalidate caches
            Business_Tools_Cache_Invalidator::invalidate_tool_registration();
            
            // Trigger action
            do_action('business_tools_tool_unregistered', $tool_id);
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Save tools to database
     */
    private function save_tools() {
        update_option($this->option_name, $this->tools);
        
        // Clear transient cache
        delete_transient('business_tools_all_tools');
    }
    
    /**
     * Get tools count
     *
     * @return int Number of registered tools
     */
    public static function get_tools_count() {
        $instance = self::get_instance();
        return count($instance->tools);
    }
}

