<?php
/**
 * Dynamic Menu Class
 * 
 * Auto-generates navigation menu from registered tools
 *
 * @package BusinessTools
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Business_Tools_Dynamic_Menu Class
 */
class Business_Tools_Dynamic_Menu {
    
    /**
     * Initialize hooks
     */
    public static function init() {
        add_filter('wp_nav_menu_items', array(__CLASS__, 'add_tools_to_menu'), 10, 2);
        add_filter('wp_get_nav_menu_items', array(__CLASS__, 'filter_menu_items'), 10, 3);
    }
    
    /**
     * Render menu manually (for header.php)
     */
    public static function render_menu() {
        // Ensure tools are registered
        if (class_exists('Business_Tools_Registry')) {
            $tools = Business_Tools_Registry::get_all_tools();
        } else {
            $tools = array();
        }
        
        echo '<ul class="main-menu">';
        
        // Home link
        echo '<li><a href="' . esc_url(home_url('/')) . '">' . esc_html__('Trang Chủ', 'business-tools') . '</a></li>';
        
        // Tools dropdown - always show, even if empty
        echo '<li class="menu-item-has-children">';
        echo '<a href="' . esc_url(home_url('/tools/')) . '">' . esc_html__('Công Cụ', 'business-tools') . '</a>';
        echo '<ul class="sub-menu">';
        
        if (!empty($tools)) {
            foreach ($tools as $tool) {
                $tool_url = home_url('/tools/' . $tool['slug'] . '/');
                echo '<li><a href="' . esc_url($tool_url) . '">' . esc_html($tool['name']) . '</a></li>';
            }
        } else {
            // Show placeholder if no tools registered yet
            echo '<li><a href="' . esc_url(home_url('/tools/')) . '">' . esc_html__('Tất Cả Công Cụ', 'business-tools') . '</a></li>';
        }
        
        echo '</ul>';
        echo '</li>';
        
        // Blog link
        $blog_page_id = get_option('page_for_posts');
        if ($blog_page_id) {
            echo '<li><a href="' . esc_url(get_permalink($blog_page_id)) . '">' . esc_html__('Blog', 'business-tools') . '</a></li>';
        }
        
        // About page (if exists)
        $about_page = get_page_by_path('about');
        if ($about_page) {
            echo '<li><a href="' . esc_url(get_permalink($about_page)) . '">' . esc_html__('Về Chúng Tôi', 'business-tools') . '</a></li>';
        }
        
        echo '</ul>';
    }
    
    /**
     * Add tools to menu items
     *
     * @param string $items Menu items HTML
     * @param object $args Menu arguments
     * @return string Modified menu items
     */
    public static function add_tools_to_menu($items, $args) {
        // Only add to primary menu
        if (!isset($args->theme_location) || 'primary' !== $args->theme_location) {
            return $items;
        }
        
        $tools = Business_Tools_Registry::get_all_tools();
        
        if (empty($tools)) {
            return $items;
        }
        
        // Build tools submenu
        $tools_submenu = '';
        foreach ($tools as $tool) {
            $tool_url = home_url('/tools/' . $tool['slug'] . '/');
            $tools_submenu .= '<li><a href="' . esc_url($tool_url) . '">' . esc_html($tool['name']) . '</a></li>';
        }
        
        // Find Tools menu item and add submenu
        if (strpos($items, 'Công Cụ') !== false || strpos($items, 'Tools') !== false) {
            $items = preg_replace(
                '/(<li[^>]*>.*?Công Cụ.*?<\/a>)/i',
                '$1<ul class="sub-menu">' . $tools_submenu . '</ul>',
                $items
            );
        } else {
            // Add Tools menu item if it doesn't exist
            $tools_menu = '<li class="menu-item menu-item-has-children">';
            $tools_menu .= '<a href="' . esc_url(home_url('/tools/')) . '">' . esc_html__('Công Cụ', 'business-tools') . '</a>';
            $tools_menu .= '<ul class="sub-menu">' . $tools_submenu . '</ul>';
            $tools_menu .= '</li>';
            
            $items .= $tools_menu;
        }
        
        return $items;
    }
    
    /**
     * Filter menu items
     *
     * @param array $items Menu items
     * @param object $menu Menu object
     * @param array $args Menu arguments
     * @return array Modified menu items
     */
    public static function filter_menu_items($items, $menu, $args) {
        // This can be used for more advanced menu manipulation
        return $items;
    }
}

// Initialize
Business_Tools_Dynamic_Menu::init();

