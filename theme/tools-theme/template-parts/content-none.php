<?php
/**
 * Template part for displaying a message that posts cannot be found
 *
 * @package ToolsTheme
 */
?>

<section class="no-results not-found">
    <div class="container">
        <div class="card">
            <header class="page-header">
                <h1><?php esc_html_e('Không tìm thấy', 'tools-theme'); ?></h1>
            </header>
            
            <div class="page-content">
                <p><?php esc_html_e('Xin lỗi, không tìm thấy nội dung bạn đang tìm kiếm.', 'tools-theme'); ?></p>
                <a href="<?php echo esc_url(home_url('/')); ?>" class="btn btn-primary">
                    <?php esc_html_e('Về Trang Chủ', 'tools-theme'); ?>
                </a>
            </div>
        </div>
    </div>
</section>

