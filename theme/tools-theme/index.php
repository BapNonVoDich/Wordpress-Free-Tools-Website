<?php
/**
 * Main Template File
 *
 * @package ToolsTheme
 */

get_header();
?>

<main class="site-main">
    <div class="container">
        <?php
        if (have_posts()) {
            while (have_posts()) {
                the_post();
                get_template_part('template-parts/content', get_post_type());
            }
            
            the_posts_navigation();
        } else {
            get_template_part('template-parts/content', 'none');
        }
        ?>
    </div>
</main>

<?php
get_footer();

