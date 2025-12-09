<?php
/**
 * Tools Archive Template
 *
 * @package ToolsTheme
 */

get_header();
?>

<main class="site-main">
    <div class="container">
        <header class="page-header">
            <h1><?php esc_html_e('Danh Sách Công Cụ', 'tools-theme'); ?></h1>
            <p><?php esc_html_e('Khám phá tất cả công cụ kinh doanh miễn phí.', 'tools-theme'); ?></p>
        </header>

        <?php
        // Display popular tags filter
        $tags = get_terms(array(
            'taxonomy' => 'tool_tag',
            'hide_empty' => true,
            'orderby' => 'count',
            'order' => 'DESC',
            'number' => 10, // Top 10 popular tags
        ));
        
        if (!empty($tags) && !is_wp_error($tags)) :
        ?>
            <div class="tool-filters" style="margin: var(--spacing-lg) 0;">
                <h3 style="margin-bottom: var(--spacing-md);"><?php esc_html_e('Lọc theo thẻ:', 'tools-theme'); ?></h3>
                <div class="filter-buttons" style="display: flex; flex-wrap: wrap; gap: var(--spacing-sm);">
                    <a href="<?php echo esc_url(get_post_type_archive_link('tool')); ?>" class="btn btn-secondary filter-btn active" data-tag="all">
                        <?php esc_html_e('Tất cả', 'tools-theme'); ?>
                    </a>
                    <?php foreach ($tags as $tag) : ?>
                        <a href="<?php echo esc_url(get_term_link($tag)); ?>" class="btn btn-secondary filter-btn" data-tag="<?php echo esc_attr($tag->slug); ?>">
                            #<?php echo esc_html($tag->name); ?> (<?php echo $tag->count; ?>)
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endif; ?>

        <div class="tools-search" style="margin: var(--spacing-xl) 0;">
            <input
                type="search"
                id="tools-search"
                class="form-input"
                placeholder="<?php esc_attr_e('Tìm kiếm công cụ...', 'tools-theme'); ?>"
                style="max-width: 500px;"
            >
        </div>

        <?php if (have_posts()) : ?>
            <div class="tools-grid" id="tools-grid">
                <?php while (have_posts()) : the_post(); ?>
                    <?php
                    $tool_slug = get_post_field('post_name', get_the_ID());
                    $tool_config = tools_theme_get_tool_config_data($tool_slug);
                    $description = has_excerpt() ? get_the_excerpt() : ($tool_config['description'] ?? '');
                    ?>
                    <div class="tool-card" data-tool-name="<?php echo esc_attr(strtolower(get_the_title())); ?>">
                        <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
                        <?php if (!empty($description)) : ?>
                            <p><?php echo esc_html($description); ?></p>
                        <?php endif; ?>
                        
                        <?php
                        // Display tags
                        $tool_tags = get_the_terms(get_the_ID(), 'tool_tag');
                        if (!empty($tool_tags) && !is_wp_error($tool_tags)) :
                        ?>
                            <div class="tool-tags" style="margin: var(--spacing-sm) 0;">
                                <?php
                                foreach ($tool_tags as $tag) {
                                    echo '<span class="tool-tag"><a href="' . esc_url(get_term_link($tag)) . '">#' . esc_html($tag->name) . '</a></span> ';
                                }
                                ?>
                            </div>
                        <?php endif; ?>
                        
                        <a href="<?php the_permalink(); ?>" class="btn btn-primary">
                            <?php esc_html_e('Sử Dụng Công Cụ', 'tools-theme'); ?>
                        </a>
                    </div>
                <?php endwhile; ?>
            </div>

            <?php the_posts_pagination(array(
                'mid_size'  => 2,
                'prev_text' => __('« Trước', 'tools-theme'),
                'next_text' => __('Tiếp »', 'tools-theme'),
            )); ?>
        <?php else : ?>
            <div class="card">
                <p><?php esc_html_e('Chưa có công cụ nào.', 'tools-theme'); ?></p>
            </div>
        <?php endif; ?>
    </div>
</main>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('tools-search');
    const toolCards = document.querySelectorAll('.tool-card');

    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();

            toolCards.forEach(function(card) {
                const toolName = card.getAttribute('data-tool-name') || '';
                const cardText = card.textContent.toLowerCase();

                if (toolName.includes(searchTerm) || cardText.includes(searchTerm)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
});
</script>

<?php
get_footer();
