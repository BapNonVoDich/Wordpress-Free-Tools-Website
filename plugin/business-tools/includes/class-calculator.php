<?php
/**
 * Calculator Tool Class
 * 
 * Scientific calculator with advanced functions
 *
 * @package BusinessTools
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Business_Tools_Calculator Class
 */
class Business_Tools_Calculator {
    
    /**
     * Tool configuration
     *
     * @return array
     */
    public static function get_config() {
        return array(
            'id'          => 'calculator',
            'name'        => 'Máy Tính',
            'slug'        => 'calculator',
            'description' => 'Máy tính khoa học với đầy đủ các chức năng toán học.',
            'category'    => 'business',
            'version'     => '2.0.0',
        );
    }
    
    /**
     * Calculate expression using JavaScript evaluation
     * This is a simple wrapper - actual calculation happens client-side
     *
     * @param string $expression Mathematical expression
     * @return float|WP_Error Result or error
     */
    public static function calculate($expression) {
        // This method is kept for backward compatibility
        // Actual calculation is done client-side using JavaScript
        return array('expression' => $expression);
    }
    
    /**
     * Render calculator interface
     *
     * @return string HTML output
     */
    public static function render() {
        ob_start();
        ?>
        <div class="business-tool business-tool-calculator">
            <div class="calculator-wrapper">
                <div class="calculator-container">
                    <div class="calculator-display">
                        <div class="calculator-display-content" id="calc-display">0</div>
                    </div>
                    
                    <div class="calculator-buttons">
                        <!-- Row 1: Inv, Deg, x!, (, ), C, ⌫ -->
                        <button class="calc-btn calc-btn-function" data-action="inv">Inv</button>
                        <button class="calc-btn calc-btn-function" data-action="deg">Deg</button>
                        <button class="calc-btn calc-btn-function" data-func="factorial">x!</button>
                        <button class="calc-btn calc-btn-operator" data-value="(">(</button>
                        <button class="calc-btn calc-btn-operator" data-value=")">)</button>
                        <button class="calc-btn calc-btn-clear" data-action="clear">C</button>
                        <button class="calc-btn calc-btn-clear" data-action="backspace">⌫</button>
                        
                        <!-- Row 2: ln, sin, %, 7, 8, 9, ÷ -->
                        <button class="calc-btn calc-btn-function" data-func="ln">ln</button>
                        <button class="calc-btn calc-btn-function" data-func="sin">sin</button>
                        <button class="calc-btn calc-btn-operator" data-value="%">%</button>
                        <button class="calc-btn calc-btn-number" data-value="7">7</button>
                        <button class="calc-btn calc-btn-number" data-value="8">8</button>
                        <button class="calc-btn calc-btn-number" data-value="9">9</button>
                        <button class="calc-btn calc-btn-operator" data-value="/">÷</button>
                        
                        <!-- Row 3: log, cos, √, 4, 5, 6, × -->
                        <button class="calc-btn calc-btn-function" data-func="log">log</button>
                        <button class="calc-btn calc-btn-function" data-func="cos">cos</button>
                        <button class="calc-btn calc-btn-function" data-func="sqrt">√</button>
                        <button class="calc-btn calc-btn-number" data-value="4">4</button>
                        <button class="calc-btn calc-btn-number" data-value="5">5</button>
                        <button class="calc-btn calc-btn-number" data-value="6">6</button>
                        <button class="calc-btn calc-btn-operator" data-value="*">×</button>
                        
                        <!-- Row 4: ^, tan, 1/x, 1, 2, 3, − -->
                        <button class="calc-btn calc-btn-function" data-value="^">^</button>
                        <button class="calc-btn calc-btn-function" data-func="tan">tan</button>
                        <button class="calc-btn calc-btn-function" data-func="reciprocal">1/x</button>
                        <button class="calc-btn calc-btn-number" data-value="1">1</button>
                        <button class="calc-btn calc-btn-number" data-value="2">2</button>
                        <button class="calc-btn calc-btn-number" data-value="3">3</button>
                        <button class="calc-btn calc-btn-operator" data-value="-">−</button>
                        
                        <!-- Row 5: Exp, π, e, 0, ., =, + -->
                        <button class="calc-btn calc-btn-function" data-func="exp">Exp</button>
                        <button class="calc-btn calc-btn-constant" data-value="Math.PI">π</button>
                        <button class="calc-btn calc-btn-constant" data-value="Math.E">e</button>
                        <button class="calc-btn calc-btn-number" data-value="0">0</button>
                        <button class="calc-btn calc-btn-number" data-value=".">.</button>
                        <button class="calc-btn calc-btn-equals" data-action="equals">=</button>
                        <button class="calc-btn calc-btn-operator" data-value="+">+</button>
                    </div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}
