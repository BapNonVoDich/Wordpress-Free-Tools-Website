<?php
/**
 * Single Post Template
 *
 * @package ToolsTheme
 */

get_header();
?>

<main class="site-main">
    <div class="container" style="max-width: 800px;">
        <?php
        while (have_posts()) {
            the_post();
            ?>
            <article id="post-<?php the_ID(); ?>" <?php post_class('card'); ?>>
                <header class="entry-header">
                    <h1><?php the_title(); ?></h1>
                    <div class="entry-meta" style="color: var(--color-text-muted); margin-bottom: var(--spacing-lg);">
                        <span><?php echo get_the_date(); ?></span>
                        <span style="margin: 0 var(--spacing-sm);">•</span>
                        <span><?php the_author(); ?></span>
                    </div>
                </header>
                
                <?php if (has_post_thumbnail()) : ?>
                    <div class="post-thumbnail" style="margin-bottom: var(--spacing-lg);">
                        <?php the_post_thumbnail('large', array('style' => 'width: 100%; height: auto; border-radius: var(--border-radius);')); ?>
                    </div>
                <?php endif; ?>
                
                <div class="entry-content">
                    <?php the_content(); ?>
                </div>
                
                <footer class="entry-footer" style="margin-top: var(--spacing-xl); padding-top: var(--spacing-lg); border-top: 1px solid var(--color-border);">
                    <?php
                    $categories = get_the_category();
                    if (!empty($categories)) {
                        echo '<div class="post-categories" style="margin-bottom: var(--spacing-md);">';
                        echo '<strong>' . esc_html__('Danh mục:', 'tools-theme') . '</strong> ';
                        the_category(', ');
                        echo '</div>';
                    }
                    
                    $tags = get_the_tags();
                    if (!empty($tags)) {
                        echo '<div class="post-tags">';
                        echo '<strong>' . esc_html__('Thẻ:', 'tools-theme') . '</strong> ';
                        the_tags('', ', ', '');
                        echo '</div>';
                    }
                    ?>
                </footer>
            </article>
            
            <?php
            // Related posts
            $related = new WP_Query(array(
                'post_type' => 'post',
                'posts_per_page' => 3,
                'post__not_in' => array(get_the_ID()),
                'category__in' => wp_get_post_categories(get_the_ID()),
            ));
            
            if ($related->have_posts()) {
                ?>
                <section class="related-posts" style="margin-top: var(--spacing-3xl);">
                    <h2><?php esc_html_e('Bài Viết Liên Quan', 'tools-theme'); ?></h2>
                    <div class="tools-grid">
                        <?php
                        while ($related->have_posts()) {
                            $related->the_post();
                            ?>
                            <div class="tool-card">
                                <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
                                <p><?php echo wp_trim_words(get_the_excerpt(), 15); ?></p>
                            </div>
                            <?php
                        }
                        wp_reset_postdata();
                        ?>
                    </div>
                </section>
                <?php
            }
        }
        ?>
    </div>
</main>

<?php
get_footer();

