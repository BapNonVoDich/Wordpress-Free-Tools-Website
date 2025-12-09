<?php
/**
 * Rate Limiter Class
 * 
 * Implements rate limiting for AJAX endpoints to prevent abuse
 *
 * @package BusinessTools
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Business_Tools_Rate_Limiter Class
 */
class Business_Tools_Rate_Limiter {
    
    /**
     * Rate limit settings
     */
    private static $max_requests = 20; // Max requests per time window
    private static $time_window = 60; // Time window in seconds (1 minute)
    private static $transient_prefix = 'bt_rate_limit_';
    
    /**
     * Check if request is within rate limit
     *
     * @param string $identifier Unique identifier (IP address or user ID)
     * @return bool|WP_Error True if allowed, WP_Error if rate limited
     */
    public static function check_rate_limit($identifier = null) {
        if (null === $identifier) {
            $identifier = self::get_identifier();
        }
        
        $key = self::$transient_prefix . md5($identifier);
        $count = get_transient($key);
        
        if ($count === false) {
            // First request in this time window
            set_transient($key, 1, self::$time_window);
            return true;
        }
        
        if ($count >= self::$max_requests) {
            // Rate limit exceeded
            $remaining_time = get_option('_transient_timeout_' . $key) - time();
            return new WP_Error(
                'rate_limit_exceeded',
                sprintf(
                    __('Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau %d giây.', 'business-tools'),
                    $remaining_time
                ),
                array('retry_after' => $remaining_time)
            );
        }
        
        // Increment counter
        set_transient($key, $count + 1, self::$time_window);
        return true;
    }
    
    /**
     * Get unique identifier for rate limiting
     *
     * @return string
     */
    private static function get_identifier() {
        // Use user ID if logged in, otherwise IP address
        if (is_user_logged_in()) {
            return 'user_' . get_current_user_id();
        }
        
        // Get IP address
        $ip = self::get_client_ip();
        return 'ip_' . $ip;
    }
    
    /**
     * Get client IP address
     *
     * @return string
     */
    private static function get_client_ip() {
        $ip_keys = array(
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_REAL_IP',
            'HTTP_X_FORWARDED_FOR',
            'REMOTE_ADDR',
        );
        
        foreach ($ip_keys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                // Handle comma-separated IPs (from proxies)
                if (strpos($ip, ',') !== false) {
                    $ip = explode(',', $ip)[0];
                }
                return trim($ip);
            }
        }
        
        return '0.0.0.0';
    }
    
    /**
     * Get remaining requests for identifier
     *
     * @param string $identifier
     * @return int
     */
    public static function get_remaining_requests($identifier = null) {
        if (null === $identifier) {
            $identifier = self::get_identifier();
        }
        
        $key = self::$transient_prefix . md5($identifier);
        $count = get_transient($key);
        
        if ($count === false) {
            return self::$max_requests;
        }
        
        return max(0, self::$max_requests - $count);
    }
}

