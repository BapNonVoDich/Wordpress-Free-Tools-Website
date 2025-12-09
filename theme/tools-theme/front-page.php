<?php
/**
 * Front Page Template
 *
 * @package ToolsTheme
 */

get_header();
?>

<main class="site-main">
    <!-- Hero Section -->
    <section class="hero-section" style="background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%); color: var(--color-text-light); padding: var(--spacing-3xl) 0; text-align: center;">
        <div class="container">
            <h1 style="font-size: 3rem; margin-bottom: var(--spacing-lg);"><?php esc_html_e('Công Cụ Kinh Doanh Miễn Phí', 'tools-theme'); ?></h1>
            <p style="font-size: 1.25rem; margin-bottom: var(--spacing-xl); opacity: 0.9;">
                <?php esc_html_e('Bộ sưu tập các công cụ tính toán và quản lý miễn phí dành cho doanh nghiệp Việt Nam', 'tools-theme'); ?>
            </p>
            <a href="#tools" class="btn btn-primary" style="font-size: 1.1rem; padding: var(--spacing-md) var(--spacing-xl);">
                <?php esc_html_e('Khám Phá Công Cụ', 'tools-theme'); ?>
            </a>
        </div>
    </section>
    
    <!-- Tools Grid Section -->
    <section id="tools" class="tools-section" style="padding: var(--spacing-3xl) 0;">
        <div class="container">
            <h2 class="text-center" style="margin-bottom: var(--spacing-xl);">
                <?php esc_html_e('Các Công Cụ Phổ Biến', 'tools-theme'); ?>
            </h2>
            <?php
            // Auto-populated tool grid from CPT
            $tools = tools_theme_get_tools(array(
                'posts_per_page' => 6,
            ));
            if (!empty($tools)) {
                tools_theme_display_tool_grid($tools);
            } else {
                echo '<p class="text-center">' . esc_html__('Chưa có công cụ nào được đăng ký.', 'tools-theme') . '</p>';
            }
            ?>
        </div>
    </section>
    
    <!-- Recent Blog Posts -->
    <section class="blog-preview-section" style="background-color: var(--color-bg-secondary); padding: var(--spacing-3xl) 0;">
        <div class="container">
            <h2 class="text-center" style="margin-bottom: var(--spacing-xl);">
                <?php esc_html_e('Bài Viết Mới Nhất', 'tools-theme'); ?>
            </h2>
            <div class="blog-posts-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-lg);">
                <?php
                $recent_posts = new WP_Query(array(
                    'post_type' => 'post',
                    'posts_per_page' => 3,
                    'post_status' => 'publish',
                ));
                
                if ($recent_posts->have_posts()) {
                    while ($recent_posts->have_posts()) {
                        $recent_posts->the_post();
                        ?>
                        <article class="card">
                            <?php if (has_post_thumbnail()) : ?>
                                <a href="<?php the_permalink(); ?>">
                                    <?php the_post_thumbnail('medium', array('style' => 'width: 100%; height: auto; border-radius: var(--border-radius); margin-bottom: var(--spacing-md);')); ?>
                                </a>
                            <?php endif; ?>
                            <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
                            <p><?php echo wp_trim_words(get_the_excerpt(), 20); ?></p>
                            <a href="<?php the_permalink(); ?>" class="btn btn-secondary">
                                <?php esc_html_e('Đọc Thêm', 'tools-theme'); ?>
                            </a>
                        </article>
                        <?php
                    }
                    wp_reset_postdata();
                } else {
                    echo '<p class="text-center">' . esc_html__('Chưa có bài viết nào.', 'tools-theme') . '</p>';
                }
                ?>
            </div>
            <div class="text-center" style="margin-top: var(--spacing-xl);">
                <a href="<?php echo esc_url(get_permalink(get_option('page_for_posts'))); ?>" class="btn btn-primary">
                    <?php esc_html_e('Xem Tất Cả Bài Viết', 'tools-theme'); ?>
                </a>
            </div>
        </div>
    </section>
</main>

<?php
get_footer();

