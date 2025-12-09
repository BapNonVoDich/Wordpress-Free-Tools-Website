<?php
/**
 * Tools Theme Functions
 *
 * @package ToolsTheme
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Theme Setup
 */
function tools_theme_setup() {
    // Add theme support
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
        'style',
        'script',
    ));
    add_theme_support('custom-logo');
    add_theme_support('responsive-embeds');
    add_theme_support('wp-block-styles');
    add_theme_support('align-wide');
    
    // Register navigation menus
    register_nav_menus(array(
        'primary' => __('Primary Menu', 'tools-theme'),
        'footer' => __('Footer Menu', 'tools-theme'),
    ));
    
    // Set content width
    $GLOBALS['content_width'] = 1200;
}
add_action('after_setup_theme', 'tools_theme_setup');

/**
 * Enqueue Scripts and Styles
 */
function tools_theme_scripts() {
    // Enqueue Google Fonts
    wp_enqueue_style(
        'tools-theme-fonts',
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Open+Sans:wght@400;500;600&display=swap',
        array(),
        null
    );
    
    // Enqueue theme stylesheet
    wp_enqueue_style(
        'tools-theme-style',
        get_stylesheet_uri(),
        array('tools-theme-fonts'),
        wp_get_theme()->get('Version')
    );
    
    // Enqueue theme JavaScript
    wp_enqueue_script(
        'tools-theme-script',
        get_template_directory_uri() . '/assets/js/main.js',
        array(),
        wp_get_theme()->get('Version'),
        true
    );
    
    // Localize script for AJAX
    wp_localize_script('tools-theme-script', 'toolsTheme', array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('tools-theme-nonce'),
    ));
}
add_action('wp_enqueue_scripts', 'tools_theme_scripts');

/**
 * Add Security Headers
 */
function tools_theme_security_headers() {
    // Prevent MIME type sniffing
    header('X-Content-Type-Options: nosniff');
    
    // Prevent clickjacking
    header('X-Frame-Options: SAMEORIGIN');
    
    // XSS Protection (legacy, but still useful)
    header('X-XSS-Protection: 1; mode=block');
    
    // Referrer Policy
    header('Referrer-Policy: strict-origin-when-cross-origin');
    
    // Content Security Policy (basic)
    if (!headers_sent()) {
        $csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://pagead2.googlesyndication.com blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: http: https:; connect-src 'self'; worker-src 'self' blob:;";
        header("Content-Security-Policy: $csp");
    }
}
add_action('send_headers', 'tools_theme_security_headers');

/**
 * Register Widget Areas
 */
function tools_theme_widgets_init() {
    register_sidebar(array(
        'name' => __('Sidebar', 'tools-theme'),
        'id' => 'sidebar-1',
        'description' => __('Add widgets here.', 'tools-theme'),
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget' => '</section>',
        'before_title' => '<h2 class="widget-title">',
        'after_title' => '</h2>',
    ));
    
    register_sidebar(array(
        'name' => __('Footer 1', 'tools-theme'),
        'id' => 'footer-1',
        'description' => __('Add widgets here.', 'tools-theme'),
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget' => '</div>',
        'before_title' => '<h4 class="widget-title">',
        'after_title' => '</h4>',
    ));
    
    register_sidebar(array(
        'name' => __('Footer 2', 'tools-theme'),
        'id' => 'footer-2',
        'description' => __('Add widgets here.', 'tools-theme'),
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget' => '</div>',
        'before_title' => '<h4 class="widget-title">',
        'after_title' => '</h4>',
    ));
    
    register_sidebar(array(
        'name' => __('Footer 3', 'tools-theme'),
        'id' => 'footer-3',
        'description' => __('Add widgets here.', 'tools-theme'),
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget' => '</div>',
        'before_title' => '<h4 class="widget-title">',
        'after_title' => '</h4>',
    ));
}
add_action('widgets_init', 'tools_theme_widgets_init');

/**
 * Load Text Domain for Translations
 */
function tools_theme_load_textdomain() {
    load_theme_textdomain('tools-theme', get_template_directory() . '/languages');
}
add_action('after_setup_theme', 'tools_theme_load_textdomain');

/**
 * Custom Excerpt Length
 */
function tools_theme_excerpt_length($length) {
    return 30;
}
add_filter('excerpt_length', 'tools_theme_excerpt_length');

/**
 * Custom Excerpt More
 */
function tools_theme_excerpt_more($more) {
    return '...';
}
add_filter('excerpt_more', 'tools_theme_excerpt_more');

/**
 * Fallback Menu
 */
function tools_theme_fallback_menu() {
    echo '<ul>';
    echo '<li><a href="' . esc_url(home_url('/')) . '">' . esc_html__('Trang Chủ', 'tools-theme') . '</a></li>';

    $tools = tools_theme_get_tools(array('posts_per_page' => 5));
    $archive_link = get_post_type_archive_link('tool');
    if (!$archive_link) {
        $archive_link = home_url('/');
    }

    if (!empty($tools)) {
        echo '<li class="menu-item-has-children">';
        echo '<a href="' . esc_url($archive_link) . '">' . esc_html__('Công Cụ', 'tools-theme') . '</a>';
        echo '<ul class="sub-menu">';
        foreach ($tools as $tool) {
            echo '<li><a href="' . esc_url(get_permalink($tool)) . '">' . esc_html(get_the_title($tool)) . '</a></li>';
        }
        echo '<li><a href="' . esc_url($archive_link) . '">' . esc_html__('Xem tất cả công cụ', 'tools-theme') . '</a></li>';
        echo '</ul>';
        echo '</li>';
    } else {
        echo '<li><a href="' . esc_url($archive_link) . '">' . esc_html__('Công Cụ', 'tools-theme') . '</a></li>';
    }

    $blog_page = get_option('page_for_posts');
    if ($blog_page) {
        echo '<li><a href="' . esc_url(get_permalink($blog_page)) . '">' . esc_html__('Blog', 'tools-theme') . '</a></li>';
    }
    echo '</ul>';
}

/**
 * Add Schema.org Markup for Tools
 */
function tools_theme_schema_markup() {
    if (is_singular('tool')) {
        global $post;
        $slug = $post ? $post->post_name : '';
        $config = $slug ? tools_theme_get_tool_config_data($slug) : null;
        $description = has_excerpt($post) ? get_the_excerpt($post) : ($config['description'] ?? '');

        $schema = array(
            '@context' => 'https://schema.org',
            '@type' => 'SoftwareApplication',
            'name' => get_the_title($post),
            'description' => $description,
            'applicationCategory' => 'BusinessApplication',
            'operatingSystem' => 'Web',
            'url' => get_permalink($post),
            'author' => array(
                '@type' => 'Organization',
                'name' => get_bloginfo('name'),
                'url' => home_url('/'),
            ),
            'offers' => array(
                '@type' => 'Offer',
                'price' => '0',
                'priceCurrency' => 'VND',
            ),
            'aggregateRating' => false, // Can be added later if reviews are implemented
        );
        
        // Add image if available
        if (has_post_thumbnail($post)) {
            $schema['image'] = get_the_post_thumbnail_url($post, 'large');
        }
        
        // Add date published
        $schema['datePublished'] = get_the_date('c', $post);
        $schema['dateModified'] = get_the_modified_date('c', $post);

        echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . '</script>';
    }

    // Add Organization schema for homepage
    if (is_front_page()) {
        $org_schema = array(
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => get_bloginfo('name'),
            'url' => home_url('/'),
            'description' => get_bloginfo('description'),
            'logo' => get_site_icon_url() ? get_site_icon_url() : null,
        );
        
        // Add sameAs (social media links) if available
        $same_as = apply_filters('tools_theme_organization_same_as', array());
        if (!empty($same_as)) {
            $org_schema['sameAs'] = $same_as;
        }

        echo '<script type="application/ld+json">' . wp_json_encode($org_schema, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . '</script>';
        
        // Add WebSite schema with search action
        $website_schema = array(
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            'name' => get_bloginfo('name'),
            'url' => home_url('/'),
            'potentialAction' => array(
                '@type' => 'SearchAction',
                'target' => array(
                    '@type' => 'EntryPoint',
                    'urlTemplate' => home_url('/?s={search_term_string}'),
                ),
                'query-input' => 'required name=search_term_string',
            ),
        );
        
        echo '<script type="application/ld+json">' . wp_json_encode($website_schema, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . '</script>';
    }
    
    // Add BreadcrumbList schema for tool pages
    if (is_singular('tool')) {
        global $post;
        $breadcrumbs = array(
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => array(
                array(
                    '@type' => 'ListItem',
                    'position' => 1,
                    'name' => 'Trang Chủ',
                    'item' => home_url('/'),
                ),
                array(
                    '@type' => 'ListItem',
                    'position' => 2,
                    'name' => 'Công Cụ',
                    'item' => get_post_type_archive_link('tool'),
                ),
                array(
                    '@type' => 'ListItem',
                    'position' => 3,
                    'name' => get_the_title($post),
                    'item' => get_permalink($post),
                ),
            ),
        );
        
        echo '<script type="application/ld+json">' . wp_json_encode($breadcrumbs, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . '</script>';
    }
}
add_action('wp_head', 'tools_theme_schema_markup');

/**
 * Add meta description for tool pages
 */
function tools_theme_meta_description() {
    if (!is_singular('tool')) {
        return;
    }

    global $post;
    $slug = $post ? $post->post_name : '';
    $config = $slug ? tools_theme_get_tool_config_data($slug) : null;
    $description = has_excerpt($post) ? get_the_excerpt($post) : ($config['description'] ?? '');

    if (!empty($description)) {
        echo '<meta name="description" content="' . esc_attr($description) . '">' . "\n";
    }
}
add_action('wp_head', 'tools_theme_meta_description');

/**
 * Add Open Graph and Twitter Card meta tags
 */
function tools_theme_open_graph_tags() {
    if (is_singular('tool')) {
        global $post;
        $title = get_the_title($post);
        $description = has_excerpt($post) ? get_the_excerpt($post) : get_bloginfo('description');
        $url = get_permalink($post);
        $image = has_post_thumbnail($post) ? get_the_post_thumbnail_url($post, 'large') : get_site_icon_url();
        $site_name = get_bloginfo('name');
        
        // Open Graph
        echo '<meta property="og:type" content="website">' . "\n";
        echo '<meta property="og:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta property="og:description" content="' . esc_attr(wp_strip_all_tags($description)) . '">' . "\n";
        echo '<meta property="og:url" content="' . esc_url($url) . '">' . "\n";
        echo '<meta property="og:site_name" content="' . esc_attr($site_name) . '">' . "\n";
        if ($image) {
            echo '<meta property="og:image" content="' . esc_url($image) . '">' . "\n";
            echo '<meta property="og:image:width" content="1200">' . "\n";
            echo '<meta property="og:image:height" content="630">' . "\n";
        }
        echo '<meta property="og:locale" content="vi_VN">' . "\n";
        
        // Twitter Card
        echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta name="twitter:description" content="' . esc_attr(wp_strip_all_tags($description)) . '">' . "\n";
        if ($image) {
            echo '<meta name="twitter:image" content="' . esc_url($image) . '">' . "\n";
        }
    } elseif (is_front_page()) {
        $title = get_bloginfo('name');
        $description = get_bloginfo('description');
        $url = home_url('/');
        $image = get_site_icon_url();
        
        echo '<meta property="og:type" content="website">' . "\n";
        echo '<meta property="og:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta property="og:description" content="' . esc_attr($description) . '">' . "\n";
        echo '<meta property="og:url" content="' . esc_url($url) . '">' . "\n";
        echo '<meta property="og:site_name" content="' . esc_attr($title) . '">' . "\n";
        if ($image) {
            echo '<meta property="og:image" content="' . esc_url($image) . '">' . "\n";
        }
        echo '<meta property="og:locale" content="vi_VN">' . "\n";
        
        echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta name="twitter:description" content="' . esc_attr($description) . '">' . "\n";
    }
}
add_action('wp_head', 'tools_theme_open_graph_tags', 5);

/**
 * Add Canonical URL
 */
function tools_theme_canonical_url() {
    if (is_singular()) {
        $canonical = get_permalink();
        echo '<link rel="canonical" href="' . esc_url($canonical) . '">' . "\n";
    } elseif (is_post_type_archive('tool')) {
        $canonical = get_post_type_archive_link('tool');
        echo '<link rel="canonical" href="' . esc_url($canonical) . '">' . "\n";
    } elseif (is_front_page()) {
        $canonical = home_url('/');
        echo '<link rel="canonical" href="' . esc_url($canonical) . '">' . "\n";
    }
}
add_action('wp_head', 'tools_theme_canonical_url', 1);

/**
 * Get published tools
 *
 * @param array $args
 * @return WP_Post[]
 */
function tools_theme_get_tools($args = array()) {
    $defaults = array(
        'post_type'      => 'tool',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'orderby'        => 'menu_order',
        'order'          => 'ASC',
    );

    $query_args = wp_parse_args($args, $defaults);
    return get_posts($query_args);
}

/**
 * Display Tool Grid
 */
function tools_theme_display_tool_grid($tools = null) {
    if (null === $tools) {
        $tools = tools_theme_get_tools();
    }

    if (empty($tools)) {
        return;
    }

    echo '<div class="tools-grid">';
    foreach ($tools as $tool) {
        $tool_url = get_permalink($tool);
        $description = has_excerpt($tool) ? get_the_excerpt($tool) : '';
        if (empty($description)) {
            $config = tools_theme_get_tool_config_data($tool->post_name);
            $description = $config['description'] ?? '';
        }
        ?>
        <div class="tool-card">
            <h3><a href="<?php echo esc_url($tool_url); ?>"><?php echo esc_html(get_the_title($tool)); ?></a></h3>
            <p><?php echo esc_html($description); ?></p>
        </div>
        <?php
    }
    echo '</div>';
}

/**
 * Append Tools dropdown to primary menu
 */
function tools_theme_append_tools_menu($items, $args) {
    if (!isset($args->theme_location) || 'primary' !== $args->theme_location) {
        return $items;
    }

    $tools = tools_theme_get_tools(array('posts_per_page' => 5));
    if (empty($tools)) {
        return $items;
    }

    $archive_link = get_post_type_archive_link('tool');
    if (!$archive_link) {
        $archive_link = home_url('/');
    }

    $submenu = '';
    foreach ($tools as $tool) {
        $submenu .= '<li><a href="' . esc_url(get_permalink($tool)) . '">' . esc_html(get_the_title($tool)) . '</a></li>';
    }
    $submenu .= '<li><a href="' . esc_url($archive_link) . '">' . esc_html__('Xem tất cả công cụ', 'tools-theme') . '</a></li>';

    $items .= '<li class="menu-item menu-item-has-children"><a href="' . esc_url($archive_link) . '">' . esc_html__('Công Cụ', 'tools-theme') . '</a><ul class="sub-menu">' . $submenu . '</ul></li>';
    return $items;
}
add_filter('wp_nav_menu_items', 'tools_theme_append_tools_menu', 10, 2);

/**
 * Safely get tool configuration
 *
 * @param string $slug
 * @return array|null
 */
function tools_theme_get_tool_config_data($slug) {
    if (function_exists('business_tools_get_tool_config')) {
        return business_tools_get_tool_config($slug);
    }
    return null;
}

/**
 * Safely render tool interface
 *
 * @param string $slug
 * @return string
 */
function tools_theme_render_tool_interface($slug) {
    if (function_exists('business_tools_render_tool_interface')) {
        return business_tools_render_tool_interface($slug);
    }
    return '';
}
