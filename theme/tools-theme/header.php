<?php
/**
 * Header Template
 *
 * @package ToolsTheme
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div class="site-wrapper">
    <header class="site-header" role="banner">
        <div class="container">
            <div class="header-container">
                <div class="site-branding">
                    <?php
                    if (has_custom_logo()) {
                        the_custom_logo();
                    } else {
                        ?>
                        <a href="<?php echo esc_url(home_url('/')); ?>" class="site-logo" rel="home">
                            <?php bloginfo('name'); ?>
                        </a>
                        <?php
                    }
                    ?>
                </div>
                
                <nav class="main-navigation" role="navigation" aria-label="<?php esc_attr_e('Primary Menu', 'tools-theme'); ?>">
                    <?php
                    wp_nav_menu(array(
                        'theme_location' => 'primary',
                        'menu_id' => 'primary-menu',
                        'container' => false,
                        'fallback_cb' => 'tools_theme_fallback_menu',
                    ));
                    ?>
                </nav>
                
                <div class="header-search">
                    <form role="search" method="get" class="search-form" action="<?php echo esc_url(home_url('/')); ?>">
                        <label>
                            <span class="screen-reader-text"><?php esc_html_e('Tìm kiếm:', 'tools-theme'); ?></span>
                            <input type="search" class="search-field" placeholder="<?php esc_attr_e('Tìm kiếm công cụ...', 'tools-theme'); ?>" value="<?php echo get_search_query(); ?>" name="s" />
                            <input type="hidden" name="post_type" value="tool" />
                        </label>
                        <button type="submit" class="search-submit" aria-label="<?php esc_attr_e('Tìm kiếm', 'tools-theme'); ?>">
                            <span class="screen-reader-text"><?php esc_html_e('Tìm kiếm', 'tools-theme'); ?></span>
                            🔍
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </header>

