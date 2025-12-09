<?php
/**
 * Plugin Name: Business Tools
 * Plugin URI: https://example.com/business-tools
 * Description: Free business tools for Vietnamese users built on a custom Tool post type with interactive calculators.
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: https://example.com
 * Text Domain: business-tools
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('BUSINESS_TOOLS_VERSION', '1.0.0');
define('BUSINESS_TOOLS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('BUSINESS_TOOLS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('BUSINESS_TOOLS_PLUGIN_FILE', __FILE__);
define('BUSINESS_TOOLS_SEEDED_OPTION', 'business_tools_seeded');

/**
 * Main Plugin Class
 */
class Business_Tools {
    
    /**
     * Single instance of the class
     */
    private static $instance = null;
    
    /**
     * Default tool definitions
     *
     * @var array
     */
    private $tool_definitions = array();
    
    /**
     * Get instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->load_dependencies();
        $this->tool_definitions = $this->define_default_tools();
        $this->init_hooks();
    }
    
    /**
     * Load plugin dependencies
     */
    private function load_dependencies() {
        require_once BUSINESS_TOOLS_PLUGIN_DIR . 'includes/class-tools-ajax.php';
        require_once BUSINESS_TOOLS_PLUGIN_DIR . 'includes/class-isr-handler.php';
        require_once BUSINESS_TOOLS_PLUGIN_DIR . 'includes/class-cache-invalidator.php';
        // Use simple sitemap approach (more reliable)
        require_once BUSINESS_TOOLS_PLUGIN_DIR . 'includes/class-sitemap-simple.php';
        
        // Load admin settings (only in admin)
        if (is_admin()) {
            require_once BUSINESS_TOOLS_PLUGIN_DIR . 'includes/class-admin-settings.php';
        }
        
        // Load tool classes
        require_once BUSINESS_TOOLS_PLUGIN_DIR . 'includes/class-calculator.php';
        require_once BUSINESS_TOOLS_PLUGIN_DIR . 'includes/class-bill-splitter.php';
        require_once BUSINESS_TOOLS_PLUGIN_DIR . 'includes/class-tax-calculator.php';
        require_once BUSINESS_TOOLS_PLUGIN_DIR . 'includes/class-seo-checker.php';
    }
    
    /**
     * Define default tools
     *
     * @return array
     */
    private function define_default_tools() {
        $defaults = array();
        $tool_classes = array(
            'calculator'    => 'Business_Tools_Calculator',
            'bill-splitter' => 'Business_Tools_Bill_Splitter',
            'tax-calculator'=> 'Business_Tools_Tax_Calculator',
            'seo-checker'   => 'Business_Tools_SEO_Checker',
        );

        foreach ($tool_classes as $slug => $class) {
            if (class_exists($class) && method_exists($class, 'get_config')) {
                $config = $class::get_config();
                $defaults[$slug] = array(
                    'title'       => isset($config['name']) ? $config['name'] : ucfirst($slug),
                    'slug'        => isset($config['slug']) ? $config['slug'] : $slug,
                    'description' => isset($config['description']) ? $config['description'] : '',
                    'class'       => $class,
                );
            } else {
                $defaults[$slug] = array(
                    'title'       => ucfirst($slug),
                    'slug'        => $slug,
                    'description' => '',
                    'class'       => $class,
                );
            }
        }

        return $defaults;
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        add_action('plugins_loaded', array($this, 'load_textdomain'));
        add_action('init', array($this, 'register_post_types'));
        add_action('init', array($this, 'register_taxonomies'));
        add_action('init', array($this, 'maybe_seed_default_tools'), 20);
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        
        // Register activation/deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    /**
     * Register Tool custom post type
     */
    public function register_post_types() {
        $labels = array(
            'name'                  => _x('Công Cụ', 'Post type general name', 'business-tools'),
            'singular_name'         => _x('Công Cụ', 'Post type singular name', 'business-tools'),
            'menu_name'             => __('Công Cụ', 'business-tools'),
            'name_admin_bar'        => __('Công Cụ', 'business-tools'),
            'add_new'               => __('Thêm Mới', 'business-tools'),
            'add_new_item'          => __('Thêm Công Cụ Mới', 'business-tools'),
            'new_item'              => __('Công Cụ Mới', 'business-tools'),
            'edit_item'             => __('Chỉnh Sửa Công Cụ', 'business-tools'),
            'view_item'             => __('Xem Công Cụ', 'business-tools'),
            'all_items'             => __('Tất Cả Công Cụ', 'business-tools'),
            'search_items'          => __('Tìm kiếm công cụ', 'business-tools'),
            'not_found'             => __('Không tìm thấy công cụ.', 'business-tools'),
            'not_found_in_trash'    => __('Không có công cụ nào trong thùng rác.', 'business-tools'),
        );

        $args = array(
            'labels'             => $labels,
            'public'             => true,
            'has_archive'        => true,
            'rewrite'            => array(
                'slug'       => 'tools',
                'with_front' => false,
            ),
            'show_in_rest'       => true,
            'menu_icon'          => 'dashicons-calculator',
            'supports'           => array('title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'),
            'taxonomies'         => array('tool_tag'),
        );

        register_post_type('tool', $args);
    }
    
    /**
     * Register taxonomies for tools
     */
    public function register_taxonomies() {
        // Tool Tags
        $tag_labels = array(
            'name'                       => _x('Thẻ Công Cụ', 'taxonomy general name', 'business-tools'),
            'singular_name'              => _x('Thẻ', 'taxonomy singular name', 'business-tools'),
            'search_items'               => __('Tìm kiếm thẻ', 'business-tools'),
            'popular_items'               => __('Thẻ phổ biến', 'business-tools'),
            'all_items'                  => __('Tất cả thẻ', 'business-tools'),
            'edit_item'                  => __('Chỉnh sửa thẻ', 'business-tools'),
            'update_item'                 => __('Cập nhật thẻ', 'business-tools'),
            'add_new_item'                => __('Thêm thẻ mới', 'business-tools'),
            'new_item_name'               => __('Tên thẻ mới', 'business-tools'),
            'separate_items_with_commas' => __('Phân cách thẻ bằng dấu phẩy', 'business-tools'),
            'add_or_remove_items'         => __('Thêm hoặc xóa thẻ', 'business-tools'),
            'choose_from_most_used'       => __('Chọn từ các thẻ thường dùng', 'business-tools'),
            'not_found'                   => __('Không tìm thấy thẻ', 'business-tools'),
            'menu_name'                   => __('Thẻ', 'business-tools'),
        );

        register_taxonomy('tool_tag', array('tool'), array(
            'hierarchical'          => false,
            'labels'                => $tag_labels,
            'show_ui'               => true,
            'show_admin_column'     => true,
            'update_count_callback' => '_update_post_term_count',
            'query_var'             => true,
            'rewrite'               => array('slug' => 'tool-tag'),
            'show_in_rest'          => true,
        ));
    }
    
    /**
     * Load plugin textdomain
     */
    public function load_textdomain() {
        load_plugin_textdomain(
            'business-tools',
            false,
            dirname(plugin_basename(__FILE__)) . '/languages'
        );
    }
    
    /**
     * Enqueue scripts and styles
     */
    public function enqueue_scripts() {
        // Enqueue plugin styles
        wp_enqueue_style(
            'business-tools-style',
            BUSINESS_TOOLS_PLUGIN_URL . 'public/css/business-tools.css',
            array(),
            BUSINESS_TOOLS_VERSION
        );
        
        // Enqueue plugin scripts
        wp_enqueue_script(
            'business-tools-script',
            BUSINESS_TOOLS_PLUGIN_URL . 'public/js/business-tools.js',
            array('jquery'),
            BUSINESS_TOOLS_VERSION,
            true
        );
        
        // Localize script
        wp_localize_script('business-tools-script', 'businessTools', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('business-tools-nonce'),
            'strings' => array(
                'error' => __('Đã xảy ra lỗi. Vui lòng thử lại.', 'business-tools'),
                'calculating' => __('Đang tính toán...', 'business-tools'),
            ),
        ));
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Register rewrite tag first
        add_rewrite_tag('%business_tools_sitemap%', '([^&]+)');
        
        $this->register_post_types();
        $this->register_taxonomies();
        $this->seed_default_tools();
        update_option(BUSINESS_TOOLS_SEEDED_OPTION, 'yes');
        
        // Flush rewrite rules to activate sitemap
        flush_rewrite_rules();
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        flush_rewrite_rules();
    }
    
    /**
     * Seed default tools as CPT entries
     */
    private function seed_default_tools() {
        foreach ($this->tool_definitions as $slug => $tool) {
            $existing = get_page_by_path($slug, OBJECT, 'tool');
            if ($existing) {
                continue;
            }

            wp_insert_post(array(
                'post_title'   => $tool['title'],
                'post_name'    => $slug,
                'post_type'    => 'tool',
                'post_status'  => 'publish',
                'post_content' => $tool['description'],
                'post_excerpt' => $tool['description'],
            ));
        }
    }
    
    /**
     * Seed default tools if they have not been created yet
     */
    public function maybe_seed_default_tools() {
        if ('yes' === get_option(BUSINESS_TOOLS_SEEDED_OPTION)) {
            return;
        }

        $existing_tools = get_posts(array(
            'post_type'      => 'tool',
            'post_status'    => 'any',
            'posts_per_page' => 1,
            'fields'         => 'ids',
        ));

        if (!empty($existing_tools)) {
            update_option(BUSINESS_TOOLS_SEEDED_OPTION, 'yes');
            return;
        }

        $this->seed_default_tools();
        update_option(BUSINESS_TOOLS_SEEDED_OPTION, 'yes');
    }
    
    /**
     * Get tool definitions
     *
     * @return array
     */
    public function get_tool_definitions() {
        return $this->tool_definitions;
    }
    
    /**
     * Get tool definition by slug
     *
     * @param string $slug
     * @return array|null
     */
    public function get_tool_definition($slug) {
        if (isset($this->tool_definitions[$slug])) {
            return $this->tool_definitions[$slug];
        }
        return null;
    }
    
    /**
     * Get tool class by slug
     *
     * @param string $slug
     * @return string|null
     */
    public function get_tool_class($slug) {
        $definition = $this->get_tool_definition($slug);
        if ($definition && !empty($definition['class'])) {
            return $definition['class'];
        }
        return null;
    }
    
    /**
     * Render tool interface
     *
     * @param string $slug
     * @return string
     */
    public function render_tool_interface($slug) {
        $class = $this->get_tool_class($slug);
        if ($class && class_exists($class) && method_exists($class, 'render')) {
            return $class::render();
        }
        return '';
    }
}

/**
 * Initialize the plugin
 */
function business_tools_init() {
    return Business_Tools::get_instance();
}

// Start the plugin
business_tools_init();

/**
 * Helper: Get tool configuration(s)
 *
 * @param string|null $slug
 * @return array|null
 */
function business_tools_get_tool_config($slug = null) {
    $plugin = Business_Tools::get_instance();
    if (null === $slug) {
        return $plugin->get_tool_definitions();
    }
    return $plugin->get_tool_definition($slug);
}

/**
 * Helper: Render tool interface by slug
 *
 * @param string $slug
 * @return string
 */
function business_tools_render_tool_interface($slug) {
    $plugin = Business_Tools::get_instance();
    return $plugin->render_tool_interface($slug);
}

