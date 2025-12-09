<?php
/**
 * Sitemap Generator Class
 * 
 * Generates XML sitemap for tool CPT
 *
 * @package BusinessTools
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Business_Tools_Sitemap Class
 */
class Business_Tools_Sitemap {
    
    /**
     * Initialize
     */
    public static function init() {
        add_action('init', array(__CLASS__, 'add_sitemap_rewrite_rule'));
        add_action('template_redirect', array(__CLASS__, 'render_sitemap'));
    }
    
    /**
     * Add rewrite rule for sitemap
     */
    public static function add_sitemap_rewrite_rule() {
        add_rewrite_tag('%business_tools_sitemap%', '([^&]+)');
        add_rewrite_rule('^sitemap-tools\.xml$', 'index.php?business_tools_sitemap=1', 'top');
    }
    
    /**
     * Render sitemap XML
     */
    public static function render_sitemap() {
        if (!get_query_var('business_tools_sitemap')) {
            return;
        }
        
        // Get all published tools
        $tools = get_posts(array(
            'post_type' => 'tool',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'date',
            'order' => 'DESC',
        ));
        
        header('Content-Type: application/xml; charset=utf-8');
        echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        
        // Homepage
        echo '  <url>' . "\n";
        echo '    <loc>' . esc_url(home_url('/')) . '</loc>' . "\n";
        echo '    <lastmod>' . date('c', strtotime(get_lastpostmodified('gmt'))) . '</lastmod>' . "\n";
        echo '    <changefreq>daily</changefreq>' . "\n";
        echo '    <priority>1.0</priority>' . "\n";
        echo '  </url>' . "\n";
        
        // Tools archive
        $archive_url = get_post_type_archive_link('tool');
        if ($archive_url) {
            echo '  <url>' . "\n";
            echo '    <loc>' . esc_url($archive_url) . '</loc>' . "\n";
            echo '    <lastmod>' . date('c', strtotime(get_lastpostmodified('gmt'))) . '</lastmod>' . "\n";
            echo '    <changefreq>weekly</changefreq>' . "\n";
            echo '    <priority>0.8</priority>' . "\n";
            echo '  </url>' . "\n";
        }
        
        // Individual tools
        foreach ($tools as $tool) {
            $url = get_permalink($tool);
            $modified = get_post_modified_time('c', false, $tool);
            
            echo '  <url>' . "\n";
            echo '    <loc>' . esc_url($url) . '</loc>' . "\n";
            echo '    <lastmod>' . esc_html($modified) . '</lastmod>' . "\n";
            echo '    <changefreq>monthly</changefreq>' . "\n";
            echo '    <priority>0.9</priority>' . "\n";
            echo '  </url>' . "\n";
        }
        
        echo '</urlset>';
        exit;
    }
}

// Initialize
Business_Tools_Sitemap::init();

