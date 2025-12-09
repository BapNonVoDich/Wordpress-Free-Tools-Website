<?php
/**
 * Page Template
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
                </header>
                
                <div class="entry-content">
                    <?php the_content(); ?>
                </div>
            </article>
            <?php
        }
        ?>
    </div>
</main>

<?php
get_footer();

