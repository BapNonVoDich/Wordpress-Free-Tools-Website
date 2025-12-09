<?php
/**
 * Footer Template
 *
 * @package ToolsTheme
 */
?>

    <footer class="site-footer" role="contentinfo">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h4><?php esc_html_e('Về Chúng Tôi', 'tools-theme'); ?></h4>
                    <p><?php esc_html_e('Cung cấp các công cụ kinh doanh miễn phí cho người dùng Việt Nam.', 'tools-theme'); ?></p>
                </div>
                
                <div class="footer-section">
                    <h4><?php esc_html_e('Liên Kết', 'tools-theme'); ?></h4>
                    <?php
                    wp_nav_menu(array(
                        'theme_location' => 'footer',
                        'container' => false,
                        'menu_class' => 'footer-menu',
                        'fallback_cb' => false,
                    ));
                    ?>
                </div>
                
                <div class="footer-section">
                    <h4><?php esc_html_e('Công Cụ', 'tools-theme'); ?></h4>
                    <?php
                    $tools = tools_theme_get_tools(array('posts_per_page' => 5));
                    if (!empty($tools)) {
                        echo '<ul>';
                        foreach ($tools as $tool) {
                            echo '<li><a href="' . esc_url(get_permalink($tool)) . '">' . esc_html(get_the_title($tool)) . '</a></li>';
                        }
                        echo '</ul>';
                    } else {
                        echo '<p>' . esc_html__('Chưa có công cụ.', 'tools-theme') . '</p>';
                    }
                    ?>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?>. <?php esc_html_e('Tất cả quyền được bảo lưu.', 'tools-theme'); ?></p>
            </div>
        </div>
    </footer>
</div><!-- .site-wrapper -->

<?php wp_footer(); ?>
</body>
</html>

