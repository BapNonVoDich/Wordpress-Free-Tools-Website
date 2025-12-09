<?php
/**
 * Bill Splitter Tool Class
 * 
 * Split bills among people with tip calculation
 *
 * @package BusinessTools
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Business_Tools_Bill_Splitter Class
 */
class Business_Tools_Bill_Splitter {
    
    /**
     * Tool configuration
     *
     * @return array
     */
    public static function get_config() {
        return array(
            'id'          => 'bill-splitter',
            'name'        => 'Chia Hóa Đơn',
            'slug'        => 'bill-splitter',
            'description' => 'Chia hóa đơn theo từng người với phí chung chia đều.',
            'category'    => 'business',
            'version'     => '2.0.0',
        );
    }
    
    /**
     * Calculate bill split
     * 
     * Logic: Mỗi người có số tiền riêng, phần còn lại là phí chung chia đều
     * Ví dụ: Tổng 100k, 3 người order 29k, 30k, 31k (tổng 90k)
     * → Phí chung: 10k chia đều 3 người = 3.33k mỗi người
     * → Người 1: 29k + 3.33k = 32.33k
     * → Người 2: 30k + 3.33k = 33.33k
     * → Người 3: 31k + 3.33k = 34.33k
     *
     * @param float $total_bill Total bill amount
     * @param array $individual_amounts Array of individual amounts for each person
     * @return array|WP_Error Result array or error
     */
    public static function calculate($total_bill, $individual_amounts) {
        // Validate inputs
        $total_bill = floatval($total_bill);
        
        if ($total_bill <= 0) {
            return new WP_Error('invalid_amount', __('Tổng hóa đơn phải lớn hơn 0.', 'business-tools'));
        }
        
        if (empty($individual_amounts) || !is_array($individual_amounts)) {
            return new WP_Error('invalid_amounts', __('Vui lòng nhập số tiền cho ít nhất 1 người.', 'business-tools'));
        }
        
        $num_people = count($individual_amounts);
        
        if ($num_people < 1) {
            return new WP_Error('invalid_people', __('Số người phải lớn hơn hoặc bằng 1.', 'business-tools'));
        }
        
        // Validate individual amounts
        $total_individual = 0;
        $validated_amounts = array();
        
        foreach ($individual_amounts as $index => $amount) {
            $amount = floatval($amount);
            if ($amount < 0) {
                return new WP_Error('invalid_individual_amount', sprintf(__('Số tiền của người %d không được âm.', 'business-tools'), $index + 1));
            }
            $validated_amounts[] = $amount;
            $total_individual += $amount;
        }
        
        // Calculate shared fee (phí chung)
        $shared_fee = $total_bill - $total_individual;
        
        // If shared fee is negative, individual amounts exceed total
        if ($shared_fee < 0) {
            return new WP_Error('amount_exceeds_total', __('Tổng số tiền của từng người không được vượt quá tổng hóa đơn.', 'business-tools'));
        }
        
        // Divide shared fee equally among all people
        $shared_fee_per_person = $shared_fee / $num_people;
        
        // Calculate final amount for each person
        $final_amounts = array();
        $total_final = 0;
        
        foreach ($validated_amounts as $index => $individual_amount) {
            $final_amount = $individual_amount + $shared_fee_per_person;
            $final_amounts[] = array(
                'person_number' => $index + 1,
                'individual_amount' => round($individual_amount, 2),
                'shared_fee' => round($shared_fee_per_person, 2),
                'final_amount' => round($final_amount, 2),
            );
            $total_final += $final_amount;
        }
        
        return array(
            'total_bill' => round($total_bill, 2),
            'num_people' => $num_people,
            'total_individual' => round($total_individual, 2),
            'shared_fee' => round($shared_fee, 2),
            'shared_fee_per_person' => round($shared_fee_per_person, 2),
            'people' => $final_amounts,
            'total_final' => round($total_final, 2),
        );
    }
    
    /**
     * Render bill splitter interface
     *
     * @return string HTML output
     */
    public static function render() {
        ob_start();
        ?>
        <div class="business-tool business-tool-bill-splitter">
            <!-- Input Section -->
            <div id="input-section" class="tool-form">
                <h2 class="section-title"><?php esc_html_e('Thông tin Hóa đơn', 'business-tools'); ?></h2>
                
                <div class="form-group">
                    <label for="bill-amount" class="form-label">
                        <?php esc_html_e('Tổng số tiền hóa đơn (VNĐ):', 'business-tools'); ?>
                    </label>
                    <input 
                        type="text" 
                        id="bill-amount" 
                        class="form-input money-input" 
                        placeholder="<?php esc_attr_e('Ví dụ: 1.000.000', 'business-tools'); ?>"
                    >
                </div>
                
                <div id="individual-amounts-container" class="form-group">
                    <label class="form-label">
                        <?php esc_html_e('Danh sách người:', 'business-tools'); ?>
                    </label>
                    <div id="individual-amounts-list">
                        <!-- Dynamic inputs will be added here -->
                    </div>
                    <button type="button" id="add-person-btn" class="btn btn-secondary btn-full">
                        <?php esc_html_e('+ Thêm người', 'business-tools'); ?>
                    </button>
                </div>
            </div>
            
            <!-- Results Section - Always visible, updates in real-time -->
            <div class="bill-splitter-result" id="bill-splitter-result">
                <h2 class="section-title"><?php esc_html_e('KẾT QUẢ CHIA HÓA ĐƠN', 'business-tools'); ?></h2>
                
                <!-- Summary -->
                <div class="result-summary">
                    <div class="result-item">
                        <span class="result-label"><?php esc_html_e('Tổng hóa đơn:', 'business-tools'); ?></span>
                        <span id="result-total-bill" class="result-value">0 VNĐ</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label"><?php esc_html_e('Tổng chi phí RIÊNG:', 'business-tools'); ?></span>
                        <span id="result-total-individual" class="result-value">0 VNĐ</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label"><?php esc_html_e('Phần còn lại (Phí Chung):', 'business-tools'); ?></span>
                        <span id="result-shared-fee" class="result-value result-blue">0 VNĐ</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label"><?php esc_html_e('Phí chung mỗi người:', 'business-tools'); ?></span>
                        <span id="result-shared-fee-per-person" class="result-value result-blue result-bold">0 VNĐ</span>
                    </div>
                </div>
                
                <!-- Detailed Results -->
                <div class="result-details">
                    <h3 class="result-details-title"><?php esc_html_e('Số tiền từng người cần trả:', 'business-tools'); ?></h3>
                    <div id="result-people-list" class="result-people-list">
                        <!-- Dynamic results will be added here -->
                    </div>
                </div>
                
                <!-- Final Total -->
                <div class="result-final-total">
                    <span class="result-final-label"><?php esc_html_e('TỔNG CỘNG:', 'business-tools'); ?></span>
                    <span id="result-total-final" class="result-final-value">0 VNĐ</span>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}

