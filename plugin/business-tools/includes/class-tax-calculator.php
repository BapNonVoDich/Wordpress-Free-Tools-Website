<?php
/**
 * Tax Calculator Tool Class
 * 
 * Tax calculations for Vietnam (VAT, Personal Income Tax with progressive rates)
 *
 * @package BusinessTools
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Business_Tools_Tax_Calculator Class
 */
class Business_Tools_Tax_Calculator {
    
    /**
     * Vietnamese VAT rate presets
     */
    private static $vat_rates = array(
        'vat_10' => array(
            'name' => 'VAT 10%',
            'rate' => 10,
            'type' => 'vat',
        ),
        'vat_8' => array(
            'name' => 'VAT 8%',
            'rate' => 8,
            'type' => 'vat',
        ),
        'vat_5' => array(
            'name' => 'VAT 5%',
            'rate' => 5,
            'type' => 'vat',
        ),
    );
    
    /**
     * Personal Income Tax brackets (Thuế thu nhập cá nhân - TNCN)
     * Progressive tax rates for Vietnam (2024)
     */
    private static $pitt_brackets = array(
        array('from' => 0, 'to' => 5000000, 'rate' => 5),      // 0-5 triệu: 5%
        array('from' => 5000000, 'to' => 10000000, 'rate' => 10),  // 5-10 triệu: 10%
        array('from' => 10000000, 'to' => 18000000, 'rate' => 15), // 10-18 triệu: 15%
        array('from' => 18000000, 'to' => 32000000, 'rate' => 20), // 18-32 triệu: 20%
        array('from' => 32000000, 'to' => 52000000, 'rate' => 25), // 32-52 triệu: 25%
        array('from' => 52000000, 'to' => 80000000, 'rate' => 30), // 52-80 triệu: 30%
        array('from' => 80000000, 'to' => PHP_INT_MAX, 'rate' => 35), // Trên 80 triệu: 35%
    );
    
    /**
     * Personal deductions (Giảm trừ)
     */
    private static $personal_deduction = 11000000; // 11 triệu/tháng (2024)
    private static $dependent_deduction = 4400000;  // 4.4 triệu/người phụ thuộc/tháng
    
    /**
     * Social insurance rates (Bảo hiểm bắt buộc)
     * Based on Vietnam regulations 2024
     */
    private static $social_insurance_rate = 8.0;    // BHXH: 8% (employee pays 8%, employer pays 17.5%)
    private static $health_insurance_rate = 1.5;    // BHYT: 1.5% (employee pays 1.5%, employer pays 3%)
    private static $unemployment_insurance_rate = 1.0; // BHTN: 1% (employee pays 1%, employer pays 1%)
    
    /**
     * Maximum salary for insurance calculation (Mức lương tối đa)
     */
    private static $max_insurance_salary = 36000000; // 36 triệu/tháng (2024)
    
    /**
     * Tool configuration
     *
     * @return array
     */
    public static function get_config() {
        return array(
            'id'          => 'tax-calculator',
            'name'        => 'Tính Thuế Thu Nhập Cá Nhân',
            'slug'        => 'tax-calculator',
            'description' => 'Tính toán thuế thu nhập cá nhân (TNCN) theo luật Việt Nam, bao gồm các khoản bảo hiểm bắt buộc và khấu trừ.',
            'category'    => 'business',
            'version'     => '2.0.0',
        );
    }
    
    /**
     * Get VAT preset rates
     *
     * @return array Preset rates
     */
    public static function get_vat_rates() {
        return apply_filters('business_tools_tax_vat_rates', self::$vat_rates);
    }
    
    /**
     * Get PIT brackets
     *
     * @return array Tax brackets
     */
    public static function get_pitt_brackets() {
        return apply_filters('business_tools_tax_pitt_brackets', self::$pitt_brackets);
    }
    
    /**
     * Calculate VAT tax
     *
     * @param float $amount Amount
     * @param float $tax_rate Tax rate percentage
     * @param string $calculation_type 'add' or 'extract'
     * @return array|WP_Error Result array or error
     */
    public static function calculate_vat($amount, $tax_rate, $calculation_type = 'add') {
        // Validate inputs
        if ($amount <= 0) {
            return new WP_Error('invalid_amount', __('Số tiền phải lớn hơn 0.', 'business-tools'));
        }
        
        if ($tax_rate < 0 || $tax_rate > 100) {
            return new WP_Error('invalid_rate', __('Mức thuế suất phải từ 0% đến 100%.', 'business-tools'));
        }
        
        $result = array();
        
        if ($calculation_type === 'add') {
            // Calculate tax amount
            $tax_amount = ($amount * $tax_rate) / 100;
            
            // Calculate total with tax
            $total_with_tax = $amount + $tax_amount;
            
            $result = array(
                'amount_before_tax' => round($amount, 2),
                'tax_rate' => $tax_rate,
                'tax_amount' => round($tax_amount, 2),
                'total_with_tax' => round($total_with_tax, 2),
                'calculation_type' => 'add',
                'tax_type' => 'vat',
            );
        } else {
            // Extract tax from total (reverse calculation)
            $amount_before_tax = ($amount * 100) / (100 + $tax_rate);
            $tax_amount = $amount - $amount_before_tax;
            
            $result = array(
                'total_with_tax' => round($amount, 2),
                'tax_rate' => $tax_rate,
                'tax_amount' => round($tax_amount, 2),
                'amount_before_tax' => round($amount_before_tax, 2),
                'calculation_type' => 'extract',
                'tax_type' => 'vat',
            );
        }
        
        return $result;
    }
    
    /**
     * Calculate Personal Income Tax (Thuế thu nhập cá nhân - TNCN)
     * Progressive tax with deductions and mandatory insurance
     *
     * @param float $monthly_income Monthly income
     * @param int $num_dependents Number of dependents (người phụ thuộc)
     * @return array|WP_Error Result array or error
     */
    public static function calculate_pitt($monthly_income, $num_dependents = 0) {
        // Validate inputs
        if ($monthly_income < 0) {
            return new WP_Error('invalid_income', __('Thu nhập không được âm.', 'business-tools'));
        }
        
        if ($num_dependents < 0) {
            $num_dependents = 0;
        }
        
        // Calculate insurance base (Mức lương tính bảo hiểm)
        // Cannot exceed maximum insurance salary
        $insurance_base = min($monthly_income, self::$max_insurance_salary);
        
        // Calculate mandatory insurance deductions (Bảo hiểm bắt buộc)
        $social_insurance = ($insurance_base * self::$social_insurance_rate) / 100;      // BHXH: 8%
        $health_insurance = ($insurance_base * self::$health_insurance_rate) / 100;      // BHYT: 1.5%
        $unemployment_insurance = ($insurance_base * self::$unemployment_insurance_rate) / 100; // BHTN: 1%
        
        $total_insurance = $social_insurance + $health_insurance + $unemployment_insurance;
        
        // Calculate income after insurance (Thu nhập sau bảo hiểm)
        $income_after_insurance = $monthly_income - $total_insurance;
        
        // Calculate personal deductions (Giảm trừ)
        $personal_deduction = self::$personal_deduction;
        $dependent_deduction = self::$dependent_deduction * $num_dependents;
        $total_deduction = $personal_deduction + $dependent_deduction;
        
        // Calculate taxable income (Thu nhập chịu thuế)
        $taxable_income = $income_after_insurance - $total_deduction;
        
        // If taxable income <= 0, no tax
        if ($taxable_income <= 0) {
            return array(
                'monthly_income' => round($monthly_income, 2),
                'insurance_base' => round($insurance_base, 2),
                'social_insurance' => round($social_insurance, 2),
                'health_insurance' => round($health_insurance, 2),
                'unemployment_insurance' => round($unemployment_insurance, 2),
                'total_insurance' => round($total_insurance, 2),
                'income_after_insurance' => round($income_after_insurance, 2),
                'personal_deduction' => $personal_deduction,
                'dependent_deduction' => $dependent_deduction,
                'num_dependents' => $num_dependents,
                'total_deduction' => $total_deduction,
                'taxable_income' => 0,
                'tax_amount' => 0,
                'net_income' => round($income_after_insurance, 2),
                'tax_type' => 'pitt',
                'brackets' => array(),
            );
        }
        
        // Calculate progressive tax (thuế tích lũy tiến)
        $brackets = self::get_pitt_brackets();
        $total_tax = 0;
        $remaining_income = $taxable_income;
        $bracket_details = array();
        
        foreach ($brackets as $index => $bracket) {
            if ($remaining_income <= 0) break;
            
            $bracket_from = $bracket['from'];
            $bracket_to = $bracket['to'];
            $bracket_rate = $bracket['rate'];
            
            // Calculate how much of remaining income falls in this bracket
            $bracket_range = $bracket_to - $bracket_from;
            
            // If remaining income is less than bracket range, use remaining income
            if ($remaining_income <= $bracket_range) {
                $bracket_taxable = $remaining_income;
            } else {
                $bracket_taxable = $bracket_range;
            }
            
            if ($bracket_taxable > 0) {
                $bracket_tax = ($bracket_taxable * $bracket_rate) / 100;
                $total_tax += $bracket_tax;
                
                $bracket_details[] = array(
                    'from' => $bracket_from,
                    'to' => $bracket_to === PHP_INT_MAX ? 0 : $bracket_to,
                    'rate' => $bracket_rate,
                    'taxable_amount' => round($bracket_taxable, 2),
                    'tax_amount' => round($bracket_tax, 2),
                );
                
                $remaining_income -= $bracket_taxable;
            }
        }
        
        $net_income = $income_after_insurance - $total_tax;
        
        return array(
            'monthly_income' => round($monthly_income, 2),
            'insurance_base' => round($insurance_base, 2),
            'social_insurance' => round($social_insurance, 2),
            'health_insurance' => round($health_insurance, 2),
            'unemployment_insurance' => round($unemployment_insurance, 2),
            'total_insurance' => round($total_insurance, 2),
            'income_after_insurance' => round($income_after_insurance, 2),
            'personal_deduction' => $personal_deduction,
            'dependent_deduction' => $dependent_deduction,
            'num_dependents' => $num_dependents,
            'total_deduction' => $total_deduction,
            'taxable_income' => round($taxable_income, 2),
            'tax_amount' => round($total_tax, 2),
            'net_income' => round($net_income, 2),
            'tax_type' => 'pitt',
            'brackets' => $bracket_details,
        );
    }
    
    /**
     * Calculate tax (legacy method - for backward compatibility)
     *
     * @param float $amount Amount
     * @param float $tax_rate Tax rate percentage
     * @param string $calculation_type 'add' or 'extract'
     * @return array|WP_Error Result array or error
     */
    public static function calculate($amount, $tax_rate, $calculation_type = 'add') {
        return self::calculate_vat($amount, $tax_rate, $calculation_type);
    }
    
    /**
     * Render tax calculator interface
     *
     * @return string HTML output
     */
    public static function render() {
        $vat_rates = self::get_vat_rates();
        
        ob_start();
        ?>
        <div class="business-tool business-tool-tax-calculator">
            <!-- Personal Income Tax Calculator -->
            <div id="pitt-calculator" class="tax-calculator-tab" style="display: block;">
                <form id="pitt-calculator-form" class="tool-form">
                    <div class="form-group">
                        <label for="pitt-monthly-income" class="form-label">
                            <?php esc_html_e('Thu nhập hàng tháng (VNĐ):', 'business-tools'); ?>
                        </label>
                        <input 
                            type="text" 
                            id="pitt-monthly-income" 
                            class="form-input money-input" 
                            required
                            placeholder="<?php esc_attr_e('Nhập thu nhập', 'business-tools'); ?>"
                        >
                        <small style="color: #666; font-size: 0.9em;">
                            <?php esc_html_e('Giảm trừ bản thân: 11.000.000 VNĐ/tháng', 'business-tools'); ?>
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label for="pitt-num-dependents" class="form-label">
                            <?php esc_html_e('Số người phụ thuộc:', 'business-tools'); ?>
                        </label>
                        <input 
                            type="number" 
                            id="pitt-num-dependents" 
                            class="form-input" 
                            min="0" 
                            value="0"
                            required
                        >
                        <small style="color: #666; font-size: 0.9em;">
                            <?php esc_html_e('Giảm trừ mỗi người phụ thuộc: 4.400.000 VNĐ/tháng', 'business-tools'); ?>
                        </small>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">
                        <?php esc_html_e('Tính Thuế TNCN', 'business-tools'); ?>
                    </button>
                </form>
                
                <div class="tax-calculator-result" id="pitt-calculator-result" style="display: none;">
                    <h2 class="section-title"><?php esc_html_e('Kết Quả Thuế TNCN', 'business-tools'); ?></h2>
                    
                    <div class="result-summary">
                        <div class="result-item">
                            <span class="result-label"><?php esc_html_e('Thu nhập hàng tháng:', 'business-tools'); ?></span>
                            <span class="result-value" id="pitt-result-income"></span>
                        </div>
                    </div>
                    
                    <div class="result-section">
                        <h4><?php esc_html_e('Bảo Hiểm Bắt Buộc', 'business-tools'); ?></h4>
                        <div class="result-item">
                            <span class="result-label"><?php esc_html_e('Mức lương tính BH:', 'business-tools'); ?></span>
                            <span class="result-value" id="pitt-result-insurance-base"></span>
                        </div>
                        <div class="result-item">
                            <span class="result-label"><?php esc_html_e('BHXH (8%):', 'business-tools'); ?></span>
                            <span class="result-value" id="pitt-result-social-insurance"></span>
                        </div>
                        <div class="result-item">
                            <span class="result-label"><?php esc_html_e('BHYT (1.5%):', 'business-tools'); ?></span>
                            <span class="result-value" id="pitt-result-health-insurance"></span>
                        </div>
                        <div class="result-item">
                            <span class="result-label"><?php esc_html_e('BHTN (1%):', 'business-tools'); ?></span>
                            <span class="result-value" id="pitt-result-unemployment-insurance"></span>
                        </div>
                        <div class="result-item result-subtotal">
                            <span class="result-label"><?php esc_html_e('Tổng bảo hiểm:', 'business-tools'); ?></span>
                            <span class="result-value" id="pitt-result-total-insurance"></span>
                        </div>
                        <div class="result-item">
                            <span class="result-label"><?php esc_html_e('Thu nhập sau bảo hiểm:', 'business-tools'); ?></span>
                            <span class="result-value result-blue" id="pitt-result-income-after-insurance"></span>
                        </div>
                    </div>
                    
                    <div class="result-section">
                        <h4><?php esc_html_e('Giảm Trừ', 'business-tools'); ?></h4>
                        <div class="result-item">
                            <span class="result-label"><?php esc_html_e('Giảm trừ bản thân:', 'business-tools'); ?></span>
                            <span class="result-value" id="pitt-result-personal-deduction"></span>
                        </div>
                        <div class="result-item">
                            <span class="result-label"><?php esc_html_e('Giảm trừ người phụ thuộc:', 'business-tools'); ?></span>
                            <span class="result-value" id="pitt-result-dependent-deduction"></span>
                        </div>
                        <div class="result-item result-subtotal">
                            <span class="result-label"><?php esc_html_e('Tổng giảm trừ:', 'business-tools'); ?></span>
                            <span class="result-value" id="pitt-result-total-deduction"></span>
                        </div>
                        <div class="result-item">
                            <span class="result-label"><?php esc_html_e('Thu nhập chịu thuế:', 'business-tools'); ?></span>
                            <span class="result-value result-blue result-bold" id="pitt-result-taxable-income"></span>
                        </div>
                    </div>
                    
                    <div class="result-final-total">
                        <span class="result-final-label"><?php esc_html_e('Số thuế phải nộp:', 'business-tools'); ?></span>
                        <span class="result-final-value" id="pitt-result-tax-amount"></span>
                    </div>
                    
                    <div class="result-final-total" style="border-top-color: var(--bt-secondary); margin-top: var(--bt-space-lg);">
                        <span class="result-final-label" style="color: var(--bt-secondary);"><?php esc_html_e('Thu nhập thực nhận:', 'business-tools'); ?></span>
                        <span class="result-final-value" style="color: var(--bt-secondary);" id="pitt-result-net-income"></span>
                    </div>
                    
                    <div id="pitt-brackets-detail" style="margin-top: var(--bt-space-xl);"></div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}

