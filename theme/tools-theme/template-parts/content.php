<?php
/**
 * Template part for displaying posts
 *
 * @package ToolsTheme
 */
?>

<article id="post-<?php the_ID(); ?>" <?php post_class('card'); ?>>
    <header class="entry-header">
        <?php
        if (is_singular()) {
            the_title('<h1>', '</h1>');
        } else {
            the_title('<h2><a href="' . esc_url(get_permalink()) . '">', '</a></h2>');
        }
        ?>
        
        <div class="entry-meta" style="color: var(--color-text-muted); margin-bottom: var(--spacing-md);">
            <span><?php echo get_the_date(); ?></span>
            <span style="margin: 0 var(--spacing-sm);">•</span>
            <span><?php the_author(); ?></span>
        </div>
    </header>
    
    <?php if (has_post_thumbnail() && !is_singular()) : ?>
        <div class="post-thumbnail">
            <a href="<?php the_permalink(); ?>">
                <?php the_post_thumbnail('medium', array('style' => 'width: 100%; height: auto; border-radius: var(--border-radius); margin-bottom: var(--spacing-md);')); ?>
            </a>
        </div>
    <?php endif; ?>
    
    <div class="entry-content">
        <?php
        if (is_singular()) {
            the_content();
        } else {
            the_excerpt();
            ?>
            <a href="<?php the_permalink(); ?>" class="btn btn-primary">
                <?php esc_html_e('Đọc Thêm', 'tools-theme'); ?>
            </a>
            <?php
        }
        ?>
    </div>
</article>

