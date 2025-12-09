<?php
/**
 * Single Tool Template
 *
 * @package ToolsTheme
 */

get_header();
?>

<main class="site-main">
    <div class="container">
        <?php if (have_posts()) : ?>
            <?php while (have_posts()) : the_post(); ?>
                <?php
                $tool_slug = get_post_field('post_name', get_the_ID());
                $tool_config = tools_theme_get_tool_config_data($tool_slug);
                $tool_description = has_excerpt() ? get_the_excerpt() : ($tool_config['description'] ?? '');
                ?>
                <article <?php post_class('tool-page card'); ?>>
                    <header class="tool-header">
                        <h1><?php the_title(); ?></h1>
                        <?php if (!empty($tool_description)) : ?>
                            <p class="tool-description"><?php echo esc_html($tool_description); ?></p>
                        <?php endif; ?>
                        
                        <?php
                        // Display tags
                        $tool_tags = get_the_terms(get_the_ID(), 'tool_tag');
                        if (!empty($tool_tags) && !is_wp_error($tool_tags)) :
                        ?>
                            <div class="tool-tags" style="margin: var(--spacing-md) 0;">
                                <strong><?php esc_html_e('Thẻ:', 'tools-theme'); ?></strong>
                                <?php
                                foreach ($tool_tags as $tag) {
                                    echo '<span class="tool-tag"><a href="' . esc_url(get_term_link($tag)) . '">#' . esc_html($tag->name) . '</a></span> ';
                                }
                                ?>
                            </div>
                        <?php endif; ?>
                    </header>

                    <div class="tool-content">
                        <div class="tool-interface">
                            <?php
                            $interface = tools_theme_render_tool_interface($tool_slug);
                            if (!empty($interface)) {
                                echo $interface; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                            } else {
                                echo '<p class="tool-error">' . esc_html__('Giao diện công cụ chưa sẵn sàng.', 'tools-theme') . '</p>';
                            }
                            ?>
                        </div>

                        <div class="tool-instructions">
                            <h2><?php esc_html_e('Cách Sử Dụng', 'tools-theme'); ?></h2>
                            <?php
                            switch ($tool_slug) {
                                case 'calculator':
                                    ?>
                                    <ol>
                                        <li><?php esc_html_e('Nhấn các số và phép toán trên bàn phím máy tính.', 'tools-theme'); ?></li>
                                        <li><?php esc_html_e('Sử dụng % để tính phần trăm.', 'tools-theme'); ?></li>
                                        <li><?php esc_html_e('Nhấn = để xem kết quả.', 'tools-theme'); ?></li>
                                        <li><?php esc_html_e('Nhấn C để xóa và bắt đầu lại.', 'tools-theme'); ?></li>
                                    </ol>
                                    <?php
                                    break;
                                case 'bill-splitter':
                                    ?>
                                    <ol>
                                        <li><?php esc_html_e('Nhập tổng số tiền hóa đơn.', 'tools-theme'); ?></li>
                                        <li><?php esc_html_e('Nhập số người cần chia.', 'tools-theme'); ?></li>
                                        <li><?php esc_html_e('Nhập phần trăm tip (nếu có).', 'tools-theme'); ?></li>
                                        <li><?php esc_html_e('Chọn tùy chọn làm tròn (nếu muốn).', 'tools-theme'); ?></li>
                                        <li><?php esc_html_e('Nhấn "Tính Toán" để xem kết quả.', 'tools-theme'); ?></li>
                                    </ol>
                                    <?php
                                    break;
                                case 'tax-calculator':
                                    ?>
                                    <ol>
                                        <li><?php esc_html_e('Chọn loại tính toán: thêm thuế hoặc tách thuế.', 'tools-theme'); ?></li>
                                        <li><?php esc_html_e('Nhập số tiền cần tính.', 'tools-theme'); ?></li>
                                        <li><?php esc_html_e('Chọn mức thuế suất có sẵn hoặc nhập tùy chỉnh.', 'tools-theme'); ?></li>
                                        <li><?php esc_html_e('Nhấn "Tính Toán" để xem kết quả.', 'tools-theme'); ?></li>
                                    </ol>
                                    <?php
                                    break;
                                default:
                                    echo '<p>' . esc_html__('Sử dụng biểu mẫu để nhập thông tin và xem kết quả ngay lập tức.', 'tools-theme') . '</p>';
                            }
                            ?>
                        </div>
                    </div>

                    <div class="tool-sidebar">
                        <div class="related-tools card">
                            <h3><?php esc_html_e('Công Cụ Liên Quan', 'tools-theme'); ?></h3>
                            <?php
                            $related = new WP_Query(array(
                                'post_type'      => 'tool',
                                'post_status'    => 'publish',
                                'posts_per_page' => 5,
                                'post__not_in'   => array(get_the_ID()),
                            ));

                            if ($related->have_posts()) {
                                echo '<ul>';
                                while ($related->have_posts()) {
                                    $related->the_post();
                                    echo '<li><a href="' . esc_url(get_permalink()) . '">' . esc_html(get_the_title()) . '</a></li>';
                                }
                                echo '</ul>';
                                wp_reset_postdata();
                            } else {
                                echo '<p>' . esc_html__('Chưa có công cụ liên quan.', 'tools-theme') . '</p>';
                            }
                            ?>
                        </div>

                        <div class="share-buttons card">
                            <h3><?php esc_html_e('Chia Sẻ', 'tools-theme'); ?></h3>
                            <div class="share-links">
                                <?php
                                $current_url = urlencode(get_permalink());
                                $title = urlencode(get_the_title());
                                ?>
                                <a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo $current_url; ?>"
                                   target="_blank"
                                   class="btn btn-secondary"
                                   style="margin: var(--spacing-sm);">
                                    Facebook
                                </a>
                                <a href="https://twitter.com/intent/tweet?url=<?php echo $current_url; ?>&text=<?php echo $title; ?>"
                                   target="_blank"
                                   class="btn btn-secondary"
                                   style="margin: var(--spacing-sm);">
                                    Twitter
                                </a>
                                <a href="https://www.linkedin.com/sharing/share-offsite/?url=<?php echo $current_url; ?>"
                                   target="_blank"
                                   class="btn btn-secondary"
                                   style="margin: var(--spacing-sm);">
                                    LinkedIn
                                </a>
                            </div>
                        </div>
                    </div>
                </article>
            <?php endwhile; ?>
        <?php else : ?>
            <?php get_template_part('template-parts/content', 'none'); ?>
        <?php endif; ?>
    </div>
</main>

<?php
get_footer();
