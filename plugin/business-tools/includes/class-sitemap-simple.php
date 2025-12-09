<?php
/**
 * Simple Sitemap Generator (Alternative approach)
 * 
 * Uses direct file access instead of rewrite rules
 *
 * @package BusinessTools
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Business_Tools_Sitemap_Simple Class
 */
class Business_Tools_Sitemap_Simple {
    
    /**
     * Initialize
     */
    public static function init() {
        add_action('template_redirect', array(__CLASS__, 'maybe_render_sitemap'), 1);
    }
    
    /**
     * Check and render sitemap if requested
     */
    public static function maybe_render_sitemap() {
        // Skip if admin or doing AJAX
        if (is_admin() || wp_doing_ajax() || wp_doing_cron()) {
            return;
        }
        
        $request_uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
        $parsed_url = parse_url($request_uri);
        $path = isset($parsed_url['path']) ? $parsed_url['path'] : '';
        
        // Check if this is a sitemap request
        // Support both /sitemap-tools.xml and ?sitemap=tools
        if (strpos($path, 'sitemap-tools.xml') !== false || 
            (isset($_GET['sitemap']) && $_GET['sitemap'] === 'tools') ||
            basename($path) === 'sitemap-tools.xml') {
            self::render_sitemap();
            exit;
        }
    }
    
    /**
     * Render sitemap XML
     */
    public static function render_sitemap() {
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
        $last_modified = get_lastpostmodified('gmt');
        if ($last_modified) {
            echo '    <lastmod>' . date('c', strtotime($last_modified)) . '</lastmod>' . "\n";
        }
        echo '    <changefreq>daily</changefreq>' . "\n";
        echo '    <priority>1.0</priority>' . "\n";
        echo '  </url>' . "\n";
        
        // Tools archive
        $archive_url = get_post_type_archive_link('tool');
        if ($archive_url) {
            echo '  <url>' . "\n";
            echo '    <loc>' . esc_url($archive_url) . '</loc>' . "\n";
            if ($last_modified) {
                echo '    <lastmod>' . date('c', strtotime($last_modified)) . '</lastmod>' . "\n";
            }
            echo '    <changefreq>weekly</changefreq>' . "\n";
            echo '    <priority>0.8</priority>' . "\n";
            echo '  </url>' . "\n";
        }
        
        // Individual tools
        foreach ($tools as $tool) {
            $url = get_permalink($tool);
            if (!$url) {
                continue;
            }
            
            $modified = get_post_modified_time('c', false, $tool);
            
            echo '  <url>' . "\n";
            echo '    <loc>' . esc_url($url) . '</loc>' . "\n";
            if ($modified) {
                echo '    <lastmod>' . esc_html($modified) . '</lastmod>' . "\n";
            }
            echo '    <changefreq>monthly</changefreq>' . "\n";
            echo '    <priority>0.9</priority>' . "\n";
            echo '  </url>' . "\n";
        }
        
        echo '</urlset>';
    }
}

// Initialize
Business_Tools_Sitemap_Simple::init();

