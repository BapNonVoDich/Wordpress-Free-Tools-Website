/**
 * Business Tools Plugin JavaScript
 */

(function($) {
    'use strict';
    
    /**
     * Debug utility - only log in development
     */
    const Debug = {
        enabled: false, // Set to true for debugging
        log: function() {
            if (this.enabled && console && console.log) {
                console.log.apply(console, arguments);
            }
        },
        error: function() {
            if (this.enabled && console && console.error) {
                console.error.apply(console, arguments);
            }
        },
        warn: function() {
            if (this.enabled && console && console.warn) {
                console.warn.apply(console, arguments);
            }
        }
    };
    
    /**
     * HTML escaping utility to prevent XSS attacks
     */
    const HTMLUtils = {
        /**
         * Escape HTML special characters
         * @param {string} text - Text to escape
         * @return {string} Escaped text
         */
        escape: function(text) {
            if (typeof text !== 'string') {
                return String(text);
            }
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        /**
         * Safely set HTML content (escapes user input)
         * @param {jQuery} $element - jQuery element
         * @param {string} html - HTML string (will escape user data)
         * @param {boolean} isTrusted - If true, allows HTML (use with caution)
         */
        safeHtml: function($element, html, isTrusted) {
            if (isTrusted) {
                $element.html(html);
            } else {
                $element.text(html);
            }
        }
    };
    
    /**
     * Number formatting utility
     */
    const NumberFormatter = {
        format: function(num) {
            if (isNaN(num)) return '0';
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        },
        
        parse: function(str) {
            return parseFloat(str.replace(/\./g, '')) || 0;
        },
        
        formatCurrency: function(num) {
            return this.format(Math.round(num)) + ' VNĐ';
        }
    };
    
    /**
     * Scientific Calculator Handler
     */
    const CalculatorHandler = {
        display: '0',
        expression: '',
        isInverse: false,
        isDegree: true,
        
        init: function() {
            const $calculator = $('.business-tool-calculator');
            if ($calculator.length === 0) return;
            
            const $display = $('#calc-display');
            
            // Button click handler
            $calculator.on('click', '.calc-btn', function(e) {
                e.preventDefault();
                const $btn = $(this);
                const value = $btn.data('value');
                const action = $btn.data('action');
                const func = $btn.data('func');
                
                if (action === 'clear') {
                    CalculatorHandler.clear();
                } else if (action === 'backspace') {
                    CalculatorHandler.backspace();
                } else if (action === 'equals') {
                    CalculatorHandler.calculate();
                } else if (action === 'inv') {
                    CalculatorHandler.toggleInverse();
                } else if (action === 'deg') {
                    CalculatorHandler.toggleDegree();
                } else if (func) {
                    CalculatorHandler.applyFunction(func);
                } else if (value !== undefined) {
                    CalculatorHandler.appendValue(value);
                }
                
                CalculatorHandler.updateDisplay();
            });
            
            // Keyboard support
            $(document).on('keydown', function(e) {
                if ($calculator.is(':visible')) {
                    const key = e.key;
                    
                    if (key === 'Enter' || key === '=') {
                        e.preventDefault();
                        CalculatorHandler.calculate();
                    } else if (key === 'Escape' || key === 'c' || key === 'C') {
                        e.preventDefault();
                        CalculatorHandler.clear();
                    } else if (key === 'Backspace') {
                        e.preventDefault();
                        CalculatorHandler.backspace();
                    } else if (/[0-9+\-*/().%]/.test(key)) {
                        CalculatorHandler.appendValue(key);
                        CalculatorHandler.updateDisplay();
                    }
                }
            });
        },
        
        appendValue: function(value) {
            if (this.display === '0' && value !== '.') {
                this.display = '';
            }
            
            // Handle constants
            if (value === 'Math.PI') {
                this.display += Math.PI;
            } else if (value === 'Math.E') {
                this.display += Math.E;
            } else {
                this.display += value;
            }
        },
        
        applyFunction: function(func) {
            try {
                let result;
                const current = parseFloat(this.display) || 0;
                
                switch(func) {
                    case 'sin':
                        result = Math.sin(this.isDegree ? current * Math.PI / 180 : current);
                        break;
                    case 'cos':
                        result = Math.cos(this.isDegree ? current * Math.PI / 180 : current);
                        break;
                    case 'tan':
                        result = Math.tan(this.isDegree ? current * Math.PI / 180 : current);
                        break;
                    case 'ln':
                        result = Math.log(current);
                        break;
                    case 'log':
                        result = Math.log10(current);
                        break;
                    case 'sqrt':
                        result = Math.sqrt(current);
                        break;
                    case 'factorial':
                        result = CalculatorHandler.factorial(Math.floor(current));
                        break;
                    case 'reciprocal':
                        result = 1 / current;
                        break;
                    case 'exp':
                        result = Math.exp(current);
                        break;
                    default:
                        return;
                }
                
                this.display = result.toString();
            } catch (e) {
                this.display = 'Error';
            }
        },
        
        factorial: function(n) {
            if (n < 0 || n > 170) return NaN;
            if (n === 0 || n === 1) return 1;
            let result = 1;
            for (let i = 2; i <= n; i++) {
                result *= i;
            }
            return result;
        },
        
        toggleInverse: function() {
            this.isInverse = !this.isInverse;
            $('.calc-btn[data-action="inv"]').toggleClass('active', this.isInverse);
        },
        
        toggleDegree: function() {
            this.isDegree = !this.isDegree;
            $('.calc-btn[data-action="deg"]').text(this.isDegree ? 'Deg' : 'Rad');
        },
        
        clear: function() {
            this.display = '0';
            this.expression = '';
        },
        
        backspace: function() {
            if (this.display.length > 1) {
                this.display = this.display.slice(0, -1);
            } else {
                this.display = '0';
            }
        },
        
        calculate: function() {
            try {
                // Replace display symbols with JavaScript operators
                let expr = this.display
                    .replace(/×/g, '*')
                    .replace(/÷/g, '/')
                    .replace(/π/g, Math.PI)
                    .replace(/e/g, Math.E)
                    .replace(/\^/g, '**')
                    .replace(/%/g, '/100');
                
                // Evaluate safely
                const result = Function('"use strict"; return (' + expr + ')')();
                
                if (isNaN(result) || !isFinite(result)) {
                    this.display = 'Error';
                } else {
                    this.display = result.toString();
                }
            } catch (e) {
                this.display = 'Error';
            }
        },
        
        updateDisplay: function() {
            $('#calc-display').text(this.display || '0');
        }
    };
    
    /**
     * Bill Splitter Handler - Real-time calculation
     */
    const BillSplitterHandler = {
        personCount: 1,
        persons: [],
        
        init: function() {
            const $container = $('.business-tool-bill-splitter');
            if ($container.length === 0) return;
            
            // Initialize with 1 person
            this.persons = [{ name: 'Người 1', amount: 0 }];
            this.updatePeopleInputs();
            this.updateResults(); // Show initial results
            
            // Add person button
            $('#add-person-btn').on('click', function(e) {
                e.preventDefault();
                if (BillSplitterHandler.personCount < 20) {
                    BillSplitterHandler.personCount++;
                    const newPerson = {
                        name: 'Người ' + BillSplitterHandler.personCount,
                        amount: 0
                    };
                    BillSplitterHandler.persons.push(newPerson);
                    BillSplitterHandler.updatePeopleInputs();
                    BillSplitterHandler.updateResults();
                }
            });
            
            // Remove person button (delegated)
            $(document).on('click', '.remove-person-btn', function(e) {
                e.preventDefault();
                const index = parseInt($(this).data('index'));
                if (BillSplitterHandler.persons.length > 1) {
                    BillSplitterHandler.persons.splice(index, 1);
                    BillSplitterHandler.personCount = BillSplitterHandler.persons.length;
                    // Renumber remaining persons if needed
                    BillSplitterHandler.persons.forEach((person, idx) => {
                        if (!person.name || person.name.startsWith('Người ')) {
                            person.name = 'Người ' + (idx + 1);
                        }
                    });
                    BillSplitterHandler.updatePeopleInputs();
                    BillSplitterHandler.updateResults();
                }
            });
            
            // Format number inputs and update results in real-time
            $(document).on('input', '.money-input', function() {
                const $input = $(this);
                let value = $input.val().replace(/\./g, '');
                if (value) {
                    const formatted = NumberFormatter.format(parseFloat(value));
                    $input.val(formatted);
                }
                BillSplitterHandler.updateResults();
            });
            
            // Update person name in real-time
            $(document).on('input', '.person-name-input', function() {
                const index = $(this).data('index');
                BillSplitterHandler.persons[index].name = $(this).val() || 'Người ' + (index + 1);
                BillSplitterHandler.updateResults();
            });
            
            // Update person amount in real-time
            $(document).on('input', '.person-amount-input', function() {
                const index = $(this).data('index');
                const amountStr = $(this).val().replace(/\./g, '');
                BillSplitterHandler.persons[index].amount = parseFloat(amountStr) || 0;
                BillSplitterHandler.updateResults();
            });
        },
        
        updatePeopleInputs: function() {
            const $container = $('#individual-amounts-list');
            $container.empty();
            
            this.persons.forEach((person, index) => {
                const $personItem = $('<div class="person-item"></div>');
                
                // Header with label and remove button
                const $header = $('<div class="person-item-header"></div>');
                const $label = $('<label class="person-item-label">Người ' + (index + 1) + '</label>');
                const $removeBtn = $('<button type="button" class="remove-person-btn" data-index="' + index + '" title="Xóa người này">Xóa</button>');
                
                // Hide remove button if only 1 person
                if (this.persons.length === 1) {
                    $removeBtn.hide();
                }
                
                $header.append($label).append($removeBtn);
                
                // Name and amount inputs side by side
                const $inputsRow = $('<div class="person-inputs-row"></div>');
                const $nameGroup = $('<div class="person-input-group-inline"></div>');
                const $nameLabel = $('<label class="person-input-label">Tên:</label>');
                const $nameInput = $('<input type="text" class="form-input person-name-input" data-index="' + index + '" value="' + (person.name || 'Người ' + (index + 1)) + '" placeholder="Nhập tên">');
                $nameGroup.append($nameLabel).append($nameInput);
                
                const $amountGroup = $('<div class="person-input-group-inline"></div>');
                const $amountLabel = $('<label class="person-input-label">Chi phí RIÊNG (VNĐ):</label>');
                const amountValue = person.amount > 0 ? NumberFormatter.format(person.amount) : '';
                const $amountInput = $('<input type="text" class="form-input money-input person-amount-input" data-index="' + index + '" value="' + amountValue + '" placeholder="0">');
                $amountGroup.append($amountLabel).append($amountInput);
                
                $inputsRow.append($nameGroup).append($amountGroup);
                
                $personItem.append($header).append($inputsRow);
                $container.append($personItem);
            });
        },
        
        updateResults: function() {
            // Get total bill
            const totalBillStr = $('#bill-amount').val().replace(/\./g, '');
            const totalBill = parseFloat(totalBillStr) || 0;
            
            // Update amounts from inputs
            $('.person-amount-input').each(function() {
                const index = $(this).data('index');
                const amountStr = $(this).val().replace(/\./g, '');
                if (BillSplitterHandler.persons[index]) {
                    BillSplitterHandler.persons[index].amount = parseFloat(amountStr) || 0;
                }
            });
            
            // Calculate locally (no AJAX needed for real-time)
            let totalIndividual = 0;
            this.persons.forEach(person => {
                totalIndividual += person.amount || 0;
            });
            
            const sharedFee = Math.max(0, totalBill - totalIndividual);
            const sharedFeePerPerson = this.persons.length > 0 ? sharedFee / this.persons.length : 0;
            
            // Update summary
            $('#result-total-bill').text(NumberFormatter.formatCurrency(totalBill));
            $('#result-total-individual').text(NumberFormatter.formatCurrency(totalIndividual));
            $('#result-shared-fee').text(NumberFormatter.formatCurrency(sharedFee));
            $('#result-shared-fee-per-person').text(NumberFormatter.formatCurrency(sharedFeePerPerson));
            
            // Update detailed results
            const $peopleList = $('#result-people-list');
            $peopleList.empty();
            
            this.persons.forEach((person, index) => {
                const personName = person.name || 'Người ' + (index + 1);
                const individualAmount = person.amount || 0;
                const finalAmount = individualAmount + sharedFeePerPerson;
                
                const $item = $('<div class="result-person-detail"></div>');
                $item.html(
                    '<span class="result-person-name">' + personName + ':</span>' +
                    '<div class="result-person-breakdown">' +
                        '<span class="result-breakdown-item">' + NumberFormatter.formatCurrency(individualAmount) + ' (riêng)</span>' +
                        '<span class="result-breakdown-separator">+</span>' +
                        '<span class="result-breakdown-item result-breakdown-blue">' + NumberFormatter.formatCurrency(sharedFeePerPerson) + ' (chung)</span>' +
                        '<span class="result-breakdown-separator">=</span>' +
                        '<span class="result-breakdown-final">' + NumberFormatter.formatCurrency(finalAmount) + '</span>' +
                    '</div>'
                );
                $peopleList.append($item);
            });
            
            // Update final total
            const finalTotal = totalIndividual + sharedFee;
            $('#result-total-final').text(NumberFormatter.formatCurrency(finalTotal));
        }
    };
    
    /**
     * Tax Calculator Handler (PIT only)
     */
    const TaxCalculatorHandler = {
        init: function() {
            const $form = $('#pitt-calculator-form');
            if ($form.length === 0) return;
            
            // Format number inputs
            $(document).on('input', '.money-input', function() {
                const $input = $(this);
                let value = $input.val().replace(/\./g, '');
                if (value) {
                    value = NumberFormatter.format(parseFloat(value));
                    $input.val(value);
                }
            });
            
            $form.on('submit', function(e) {
                e.preventDefault();
                TaxCalculatorHandler.calculatePIT();
            });
        },
        
        calculatePIT: function() {
            const monthlyIncomeStr = $('#pitt-monthly-income').val().replace(/\./g, '');
            const monthlyIncome = parseFloat(monthlyIncomeStr) || 0;
            const numDependents = parseInt($('#pitt-num-dependents').val()) || 0;
            
            const $form = $('#pitt-calculator-form');
            const $submitBtn = $form.find('button[type="submit"]');
            const $result = $('#pitt-calculator-result');
            
            // Validation
            if (monthlyIncome <= 0) {
                TaxCalculatorHandler.showError('Vui lòng nhập thu nhập hàng tháng lớn hơn 0.');
                return;
            }
            
            if (numDependents < 0) {
                TaxCalculatorHandler.showError('Số người phụ thuộc không thể âm.');
                return;
            }
            
            // Show loading state
            TaxCalculatorHandler.setLoading(true, $form, $submitBtn);
            $result.hide();
            TaxCalculatorHandler.hideError();
            
            $.ajax({
                url: businessTools.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'business_tools_calculate_tax',
                    tax_type: 'pitt',
                    monthly_income: monthlyIncome,
                    num_dependents: numDependents,
                    nonce: businessTools.nonce
                },
                success: function(response) {
                    TaxCalculatorHandler.setLoading(false, $form, $submitBtn);
                    
                    if (response.success) {
                        const data = response.data;
                        
                        $('#pitt-result-income').text(NumberFormatter.formatCurrency(data.monthly_income));
                        $('#pitt-result-insurance-base').text(NumberFormatter.formatCurrency(data.insurance_base));
                        $('#pitt-result-social-insurance').text(NumberFormatter.formatCurrency(data.social_insurance));
                        $('#pitt-result-health-insurance').text(NumberFormatter.formatCurrency(data.health_insurance));
                        $('#pitt-result-unemployment-insurance').text(NumberFormatter.formatCurrency(data.unemployment_insurance));
                        $('#pitt-result-total-insurance').text(NumberFormatter.formatCurrency(data.total_insurance));
                        $('#pitt-result-income-after-insurance').text(NumberFormatter.formatCurrency(data.income_after_insurance));
                        $('#pitt-result-personal-deduction').text(NumberFormatter.formatCurrency(data.personal_deduction));
                        $('#pitt-result-dependent-deduction').text(NumberFormatter.formatCurrency(data.dependent_deduction));
                        $('#pitt-result-total-deduction').text(NumberFormatter.formatCurrency(data.total_deduction));
                        $('#pitt-result-taxable-income').text(NumberFormatter.formatCurrency(data.taxable_income));
                        $('#pitt-result-tax-amount').text(NumberFormatter.formatCurrency(data.tax_amount));
                        $('#pitt-result-net-income').text(NumberFormatter.formatCurrency(data.net_income));
                        
                        // Display brackets detail
                        const $bracketsDetail = $('#pitt-brackets-detail');
                        $bracketsDetail.empty();
                        
                        if (data.brackets && data.brackets.length > 0) {
                            $bracketsDetail.append('<h4 style="margin-top: 1em;">Chi tiết theo bậc thuế:</h4>');
                            data.brackets.forEach(function(bracket, index) {
                                const $item = $('<div class="bracket-item"></div>');
                                const toText = bracket.to === 0 || bracket.to >= 2147483647 ? 'Trên' : NumberFormatter.format(bracket.to);
                                $item.html(
                                    '<strong>Bậc ' + (index + 1) + ':</strong> ' + bracket.rate + '% (' +
                                    NumberFormatter.format(bracket.from) + ' - ' + toText + ' VNĐ)<br>' +
                                    'Thu nhập chịu thuế: ' + NumberFormatter.formatCurrency(bracket.taxable_amount) + '<br>' +
                                    '<strong>Thuế: ' + NumberFormatter.formatCurrency(bracket.tax_amount) + '</strong>'
                                );
                                $bracketsDetail.append($item);
                            });
                        }
                        
                        $result.show();
                        $result[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    } else {
                        const errorMsg = response.data && response.data.message ? response.data.message : businessTools.strings.error;
                        TaxCalculatorHandler.showError(errorMsg);
                        
                        // Handle rate limiting
                        if (response.data && response.data.code === 'rate_limit_exceeded') {
                            const retryAfter = response.data.retry_after || 60;
                            TaxCalculatorHandler.showToast('Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi ' + retryAfter + ' giây.', 'warning');
                        }
                    }
                },
                error: function(xhr, status, error) {
                    TaxCalculatorHandler.setLoading(false, $form, $submitBtn);
                    
                    let errorMsg = businessTools.strings.error;
                    if (xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message) {
                        errorMsg = xhr.responseJSON.data.message;
                    } else if (status === 'timeout') {
                        errorMsg = 'Yêu cầu quá thời gian. Vui lòng thử lại.';
                    } else if (status === 'abort') {
                        errorMsg = 'Yêu cầu đã bị hủy.';
                    }
                    
                    TaxCalculatorHandler.showError(errorMsg);
                    TaxCalculatorHandler.showToast(errorMsg, 'error');
                }
            });
        },
        
        setLoading: function(isLoading, $form, $submitBtn) {
            if (isLoading) {
                $form.addClass('bt-loading');
                $submitBtn.prop('disabled', true);
                const originalText = $submitBtn.data('original-text') || $submitBtn.text();
                $submitBtn.data('original-text', originalText);
                $submitBtn.html('<span class="bt-loading-spinner"></span>' + originalText);
            } else {
                $form.removeClass('bt-loading');
                $submitBtn.prop('disabled', false);
                const originalText = $submitBtn.data('original-text') || 'Tính Thuế TNCN';
                $submitBtn.text(originalText);
            }
        },
        
        showError: function(message) {
            let $errorDiv = $('#pitt-error-message');
            if ($errorDiv.length === 0) {
                $errorDiv = $('<div id="pitt-error-message" class="bt-error-message"></div>');
                $('#pitt-calculator-form').after($errorDiv);
            }
            $errorDiv.html('<span class="bt-error-icon">⚠</span>' + message).addClass('show');
        },
        
        hideError: function() {
            $('#pitt-error-message').removeClass('show');
        },
        
        showToast: function(message, type) {
            type = type || 'error';
            const icon = type === 'error' ? '⚠' : type === 'success' ? '✓' : 'ℹ';
            
            const $toast = $('<div class="bt-toast ' + type + '"></div>');
            $toast.html(
                '<span class="bt-toast-icon">' + icon + '</span>' +
                '<span class="bt-toast-message">' + message + '</span>'
            );
            
            $('body').append($toast);
            
            setTimeout(function() {
                $toast.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 5000);
        }
    };
    
    /**
     * SEO Checker Constants
     */
    const SEO_CONSTANTS = {
        MAX_CONTENT_SIZE: 10 * 1024 * 1024, // 10MB
        REQUEST_TIMEOUT: 30000, // 30 seconds
        CACHE_DURATION: 3600000, // 1 hour
        SENTENCE_REGEX: /[.!?。！？]+/g,
        DEPRECATED_TAGS: ['center', 'font', 'marquee', 'blink', 'applet', 'basefont', 'big', 'dir', 'frame', 'frameset', 'isindex', 'noframes', 'strike', 'tt', 'u', 'acronym', 'bgsound', 'keygen', 'listing', 'nextid', 'spacer', 'xmp'],
        STOP_WORDS: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'don', 'should', 'now', 'và', 'của', 'cho', 'với', 'trong', 'từ', 'đến', 'có', 'là', 'được', 'một', 'những', 'các', 'về', 'này', 'đó', 'sẽ', 'đã', 'cũng', 'như', 'khi', 'nếu', 'thì', 'mà', 'để', 'vì', 'nên', 'hoặc', 'nhưng']
    };
    
    // Cache for analysis results
    const analysisCache = new Map();
    
    /**
     * SEO Checker Handler
     */
    const SEOCheckerHandler = {
        init: function() {
            const $form = $('#seo-checker-form');
            if ($form.length === 0) return;
            
            // Remove any existing handlers to prevent duplicates
            $form.off('submit');
            $(document).off('click', '#seo-analyze-btn');
            
            // Form submit - prevent default
            $form.on('submit', function(e) {
                e.preventDefault();
                e.stopPropagation();
                SEOCheckerHandler.analyze();
                return false;
            });
            
            // Handle button click - use delegated event (works for dynamically added elements)
            $(document).on('click', '#seo-analyze-btn', function(e) {
                e.preventDefault();
                e.stopPropagation();
                SEOCheckerHandler.analyze();
                return false;
            });
            
            // Also try direct binding as fallback (works for existing elements)
            const $analyzeBtn = $('#seo-analyze-btn');
            if ($analyzeBtn.length > 0) {
                $analyzeBtn.off('click.seo').on('click.seo', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    SEOCheckerHandler.analyze();
                    return false;
                });
            }
            
            // Handle Enter key on URL input
            $('#seo-url').off('keypress.seo').on('keypress.seo', function(e) {
                if (e.which === 13) { // Enter key
                    e.preventDefault();
                    SEOCheckerHandler.analyze();
                }
            });
            
            // Initialize action buttons
            SEOCheckerHandler.initActionButtons();
            
            // Initialize back to top button
            SEOCheckerHandler.initBackToTop();
            
            // Initialize tooltips
            SEOCheckerHandler.initTooltips();
        },
        
        /**
         * Initialize action buttons
         */
        initActionButtons: function() {
            // Copy URL button
            $(document).on('click', '#seo-copy-url-btn', function() {
                const url = $('#seo-current-url').text();
                if (url && url !== 'N/A') {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(url).then(function() {
                            const $btn = $('#seo-copy-url-btn');
                            const originalText = $btn.html();
                            $btn.html('<span class="seo-btn-icon" aria-hidden="true">✓</span> Đã Copy!');
                            setTimeout(function() {
                                $btn.html(originalText);
                            }, 2000);
                        }).catch(function() {
                            SEOCheckerHandler.fallbackCopyText(url);
                        });
                    } else {
                        SEOCheckerHandler.fallbackCopyText(url);
                    }
                }
            });
            
            // Analyze another URL button
            $(document).on('click', '#seo-analyze-another-btn', function() {
                $('#seo-url').val('').focus();
                $('#seo-checker-result').hide();
                $('#seo-action-buttons').hide();
                $('#seo-url-info').hide();
                $('#seo-back-to-top').hide();
                $('html, body').animate({ scrollTop: 0 }, 500);
            });
        },
        
        /**
         * Fallback copy text for older browsers
         */
        fallbackCopyText: function(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                const $btn = $('#seo-copy-url-btn');
                const originalText = $btn.html();
                $btn.html('<span class="seo-btn-icon" aria-hidden="true">✓</span> Đã Copy!');
                setTimeout(function() {
                    $btn.html(originalText);
                }, 2000);
            } catch (err) {
                Debug.error('Fallback: Could not copy text', err);
            }
            document.body.removeChild(textArea);
        },
        
        /**
         * Initialize back to top button
         */
        initBackToTop: function() {
            const $backToTop = $('#seo-back-to-top');
            
            // Show/hide button on scroll
            $(window).on('scroll', function() {
                if ($(window).scrollTop() > 300) {
                    $backToTop.fadeIn();
                } else {
                    $backToTop.fadeOut();
                }
            });
            
            // Scroll to top on click
            $backToTop.on('click', function() {
                $('html, body').animate({ scrollTop: 0 }, 500);
                $(this).focus(); // Maintain focus for accessibility
            });
        },
        
        /**
         * Initialize tooltips
         */
        initTooltips: function() {
            // Add tooltips to various elements
            $('[data-tooltip]').each(function() {
                const $el = $(this);
                const tooltipText = $el.attr('data-tooltip');
                if (!$el.attr('title')) {
                    $el.attr('title', tooltipText);
                }
                if (!$el.attr('aria-label')) {
                    $el.attr('aria-label', tooltipText);
                }
            });
        },
        
        analyze: function() {
            // Prevent multiple clicks
            const $submitBtn = $('#seo-analyze-btn');
            if ($submitBtn.prop('disabled')) {
                return;
            }
            
            // Hide previous error
            $('#seo-error-message').removeClass('show');
            
            const url = $('#seo-url').val();
            
            if (!url || !url.trim()) {
                SEOCheckerHandler.showError('Vui lòng nhập URL để phân tích.', 'E001');
                return;
            }
            
            // Validate URL format
            let urlObj;
            try {
                urlObj = new URL(url);
            } catch(e) {
                SEOCheckerHandler.showError('URL không hợp lệ. Vui lòng nhập URL đầy đủ (ví dụ: https://example.com)', 'E001');
                return;
            }
            
            // Check protocol
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                SEOCheckerHandler.showError('Chỉ hỗ trợ URL http và https.', 'E001');
                return;
            }
            
            const urlTrimmed = url.trim();
            
            // Check if URL is already cached
            const cacheKey = urlTrimmed.toLowerCase();
            if (analysisCache.has(cacheKey)) {
                const cached = analysisCache.get(cacheKey);
                const cacheAge = Date.now() - cached.timestamp;
                if (cacheAge < SEO_CONSTANTS.CACHE_DURATION) {
                    if (confirm('Tìm thấy kết quả phân tích đã lưu. Bạn có muốn sử dụng kết quả đã lưu không?')) {
                        // Use cached analysis but still load PageSpeed (cached analysis may not include it)
                        SEOCheckerHandler.currentAnalysis = cached.analysis;
                        SEOCheckerHandler.displayResults(cached.analysis);
                        // Trigger PageSpeed load separately
                        const pageSpeedUrl = cached.analysis.url || urlTrimmed;
                        if (pageSpeedUrl) {
                            setTimeout(function() {
                                SEOCheckerHandler.loadPageSpeedInsights(pageSpeedUrl);
                            }, 300);
                        }
                        return;
                    }
                } else {
                    // Remove expired cache
                    analysisCache.delete(cacheKey);
                }
            }
            
            SEOCheckerHandler.setLoading(true, 'fetching');
            SEOCheckerHandler.fetchURLContent(urlTrimmed);
        },
        
        fetchURLContent: function(url) {
            let timeoutId;
            
            // Set timeout
            timeoutId = setTimeout(function() {
                SEOCheckerHandler.showError('Yêu cầu quá thời gian. Vui lòng thử lại với URL khác hoặc kiểm tra kết nối mạng.', 'E007');
                SEOCheckerHandler.setLoading(false);
            }, SEO_CONSTANTS.REQUEST_TIMEOUT);
            
            // Use server-side AJAX to fetch URL (avoids CORS issues)
            $.ajax({
                url: businessTools.ajaxUrl,
                type: 'POST',
                timeout: SEO_CONSTANTS.REQUEST_TIMEOUT,
                data: {
                    action: 'business_tools_fetch_url',
                    url: url,
                    nonce: businessTools.nonce
                },
                success: function(response) {
                    clearTimeout(timeoutId);
                    if (response.success && response.data && response.data.content) {
                        // Validate content size
                        if (response.data.content.length > SEO_CONSTANTS.MAX_CONTENT_SIZE) {
                            SEOCheckerHandler.showError('Nội dung trang web quá lớn (vượt quá 10MB). Vui lòng thử với URL khác.', 'E004');
                            SEOCheckerHandler.setLoading(false);
                            return;
                        }
                        
                        // Update progress to parsing
                        SEOCheckerHandler.setLoading(true, 'parsing');
                        
                        // Parse HTML from response
                        const htmlContent = response.data.content;
                        // Get robots.txt, sitemap, and www issue from server response
                        const urlTests = {
                            robotsTxt: {
                                exists: response.data.robots_txt_exists || false,
                                status: response.data.robots_txt_exists ? 'good' : 'warning',
                                message: response.data.robots_txt_exists ? 'Robots.txt tồn tại' : 'Không tìm thấy robots.txt'
                            },
                            sitemap: {
                                exists: response.data.sitemap_exists || false,
                                status: response.data.sitemap_exists ? 'good' : 'warning',
                                message: response.data.sitemap_exists ? 'Sitemap.xml tồn tại' : 'Không tìm thấy sitemap.xml'
                            },
                            wwwIssue: response.data.www_issue || { has_issue: false }
                        };
                        
                        try {
                            // Update progress to analyzing
                            SEOCheckerHandler.setLoading(true, 'analyzing');
                            SEOCheckerHandler.processContent(htmlContent, url, urlTests);
                        } catch (error) {
                            Debug.error('Error processing content:', error);
                            SEOCheckerHandler.showError('Lỗi khi xử lý nội dung. Vui lòng thử lại với URL khác hoặc liên hệ hỗ trợ nếu vấn đề tiếp tục.', 'E005');
                            SEOCheckerHandler.setLoading(false);
                        }
                    } else {
                        clearTimeout(timeoutId);
                        const errorMsg = response.data && response.data.message 
                            ? response.data.message 
                            : 'Không thể lấy nội dung từ URL. Vui lòng thử lại.';
                        
                        // Determine error code from response
                        let errorCode = 'E003';
                        if (errorMsg.includes('403')) errorCode = 'E010';
                        else if (errorMsg.includes('404')) errorCode = 'E009';
                        else if (errorMsg.includes('SSL') || errorMsg.includes('certificate')) errorCode = 'E008';
                        else if (errorMsg.includes('timeout') || errorMsg.includes('thời gian')) errorCode = 'E007';
                        
                        SEOCheckerHandler.showError(errorMsg, errorCode);
                        SEOCheckerHandler.setLoading(false);
                    }
                },
                error: function(xhr, status, error) {
                    clearTimeout(timeoutId);
                    let errorMsg = 'Không thể kết nối đến server. ';
                    let errorCode = 'E006';
                    
                    // Check if server returned a JSON error response first
                    if (xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message) {
                        errorMsg = xhr.responseJSON.data.message;
                    } else if (status === 'timeout') {
                        errorMsg = 'Yêu cầu quá thời gian. Trang web có thể đang tải chậm hoặc không phản hồi. Vui lòng thử lại sau.';
                    } else if (xhr.status === 0) {
                        errorMsg = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.';
                    } else if (xhr.status >= 500) {
                        errorMsg = 'Lỗi server (mã ' + xhr.status + '). Vui lòng thử lại sau.';
                    } else if (xhr.status === 403) {
                        errorMsg = 'Truy cập bị từ chối (403). Có thể trang web chặn truy cập từ server.';
                    } else if (xhr.status === 404) {
                        errorMsg = 'Không tìm thấy endpoint (404). Vui lòng liên hệ hỗ trợ.';
                    } else if (xhr.status === 400) {
                        errorMsg = 'Yêu cầu không hợp lệ (400). Vui lòng kiểm tra lại URL.';
                    } else {
                        errorMsg = 'Lỗi không xác định. Vui lòng thử lại hoặc liên hệ hỗ trợ.';
                    }
                    
                    SEOCheckerHandler.showError(errorMsg);
                    SEOCheckerHandler.setLoading(false);
                }
            });
        },
        
        processContent: function(content, url, urlTestsFromServer) {
            try {
                // Validate content
                if (!content || typeof content !== 'string') {
                    throw new Error('Nội dung không hợp lệ: Không có dữ liệu hoặc định dạng không đúng.');
                }
                
                // Check content size before parsing (prevent browser freeze)
                const MAX_CONTENT_SIZE = 10 * 1024 * 1024; // 10MB
                if (content.length > MAX_CONTENT_SIZE) {
                    SEOCheckerHandler.showError('Nội dung trang web quá lớn (vượt quá 10MB). Vui lòng thử với URL khác.');
                    SEOCheckerHandler.setLoading(false);
                    return;
                }
                
                // Check if content looks like HTML
                const trimmedContent = content.trim();
                if (trimmedContent.length === 0) {
                    throw new Error('Nội dung trang web trống. Vui lòng kiểm tra lại URL.');
                }
                
                // Basic HTML validation - check for HTML tags
                if (!/<html/i.test(trimmedContent) && 
                    !/<!DOCTYPE/i.test(trimmedContent) && 
                    !/<head/i.test(trimmedContent) && 
                    !/<body/i.test(trimmedContent)) {
                    // Might be a redirect page or error page, but still try to parse
                    Debug.warn('Content may not be valid HTML, but attempting to parse anyway');
                }
                
                // Perform comprehensive analysis (pass url as focusKeyword parameter for URL checking)
                let analysis;
                try {
                    analysis = SEOCheckerHandler.performAnalysis(content, null, url);
                } catch (analysisError) {
                    Debug.error('Error in performAnalysis:', analysisError);
                    throw new Error('Lỗi khi phân tích nội dung HTML: ' + (analysisError.message || 'Lỗi không xác định'));
                }
                
                // Validate analysis result
                if (!analysis || typeof analysis !== 'object') {
                    throw new Error('Kết quả phân tích không hợp lệ. Vui lòng thử lại.');
                }
                
                // Perform additional URL-based tests (SSL, etc.)
                SEOCheckerHandler.performURLTests(url, function(urlTests) {
                    // Merge URL tests from server (robots.txt, sitemap, www issue) with client-side tests
                    if (urlTestsFromServer) {
                        urlTests.robotsTxt = urlTestsFromServer.robotsTxt;
                        urlTests.sitemap = urlTestsFromServer.sitemap;
                        urlTests.wwwIssue = urlTestsFromServer.wwwIssue;
                    }
                    analysis.urlTests = urlTests;
                    
                    // Update scoring based on actual URL tests
                    // SSL/HTTPS - adjust score if different from initial check
                    const currentSslPoints = analysis.scoreBreakdown.ssl ? analysis.scoreBreakdown.ssl.points : 0;
                    if (urlTests.ssl && urlTests.ssl.valid) {
                        if (currentSslPoints === 0) {
                            // Was not HTTPS, now confirmed HTTPS - add points
                            analysis.score += 4;
                            analysis.scoreBreakdown.ssl = { points: 4, max: 4, status: 'good' };
                        }
                        // If already had points, keep them
                    } else {
                        if (currentSslPoints > 0) {
                            // Was HTTPS, but now confirmed not HTTPS - remove points
                            analysis.score -= currentSslPoints;
                        }
                        analysis.scoreBreakdown.ssl = { points: 0, max: 4, status: 'error' };
                    }
                    
                    // Robots.txt
                    if (urlTests.robotsTxt && urlTests.robotsTxt.exists) {
                        analysis.score += 2;
                        analysis.scoreBreakdown.robotsTxt = { points: 2, max: 2, status: 'good' };
                    } else {
                        analysis.scoreBreakdown.robotsTxt = { points: 0, max: 2, status: 'warning' };
                    }
                    
                    // Sitemap
                    if (urlTests.sitemap && urlTests.sitemap.exists) {
                        analysis.score += 2;
                        analysis.scoreBreakdown.sitemap = { points: 2, max: 2, status: 'good' };
                    } else {
                        analysis.scoreBreakdown.sitemap = { points: 0, max: 2, status: 'warning' };
                    }
                    
                    // WWW/Non-WWW Issue
                    if (urlTests.wwwIssue && urlTests.wwwIssue.has_issue) {
                        // Penalty: subtract 2 points if issue exists
                        if (analysis.scoreBreakdown.wwwIssue.points > 0) {
                            analysis.score -= 2;
                        }
                        analysis.scoreBreakdown.wwwIssue = { points: 0, max: 2, status: 'error' };
                        
                        // Add recommendation
                        if (analysis.recommendations) {
                            analysis.recommendations.push({
                                text: 'Có vấn đề WWW/Non-WWW: Cả hai phiên bản đều hoạt động. Nên chọn một và redirect phiên bản còn lại để tránh duplicate content',
                                priority: 'critical'
                            });
                        }
                    } else {
                        analysis.score += 2;
                        analysis.scoreBreakdown.wwwIssue = { points: 2, max: 2, status: 'good' };
                    }
                    
                    // Add recommendations for robots.txt and sitemap
                    if (analysis.recommendations) {
                        if (!urlTests.robotsTxt || !urlTests.robotsTxt.exists) {
                            analysis.recommendations.push({
                                text: 'Thêm robots.txt để điều khiển cách search engines crawl trang web',
                                priority: 'important'
                            });
                        }
                        
                        if (!urlTests.sitemap || !urlTests.sitemap.exists) {
                            analysis.recommendations.push({
                                text: 'Thêm sitemap.xml để giúp Google tìm và index tất cả các trang',
                                priority: 'important'
                            });
                        }
                    }
                    
                    // Cache the analysis result
                    analysisCache.set(url.toLowerCase(), {
                        analysis: analysis,
                        timestamp: Date.now()
                    });
                    
                    // Display all results EXCEPT PageSpeed Insights first (faster)
                    analysis.pagespeed = null; // Don't include PageSpeed yet
                    
                    // Ensure result container is visible
                    const $result = $('#seo-checker-result');
                    if ($result.length > 0) {
                        $result.show().css('display', 'block');
                    }
                    
                    // Store analysis object for PageSpeed callback
                    SEOCheckerHandler.currentAnalysis = analysis;
                    
                    SEOCheckerHandler.displayResults(analysis);
                    
                    // Scroll to results after a short delay to ensure DOM is updated
                    setTimeout(function() {
                        $('html, body').animate({ 
                            scrollTop: $result.offset().top - 100 
                        }, 500);
                    }, 100);
                    
                    SEOCheckerHandler.setLoading(false); // Main loading done
                    
                    // Then load PageSpeed Insights separately (slower, loads after other results)
                    // Use setTimeout to ensure main results are displayed first
                    // Ensure URL is available
                    const pageSpeedUrl = url || analysis.url || $('#seo-url').val();
                    if (pageSpeedUrl) {
                        setTimeout(function() {
                            Debug.log('Loading PageSpeed Insights for URL:', pageSpeedUrl);
                            SEOCheckerHandler.loadPageSpeedInsights(pageSpeedUrl);
                        }, 500);
                        
                        // Fallback: ensure PageSpeed is triggered even if first timeout is skipped
                        setTimeout(function() {
                            const hasRequest = ($('#seo-pagespeed-insights').children().length > 0);
                            if (!hasRequest && pageSpeedUrl) {
                                Debug.log('Retry loading PageSpeed Insights (fallback) for URL:', pageSpeedUrl);
                                SEOCheckerHandler.loadPageSpeedInsights(pageSpeedUrl);
                            }
                        }, 1500);
                    } else {
                        Debug.warn('Cannot load PageSpeed Insights - URL not available');
                    }
                });
            } catch (error) {
                Debug.error('Error in processContent:', error);
                
                // Provide more specific error messages with error codes
                let errorMessage = 'Lỗi khi xử lý nội dung. ';
                let errorCode = 'E005';
                
                if (error && error.message) {
                    // Use the specific error message if available
                    errorMessage = error.message;
                    
                    // Determine error code from message
                    if (errorMessage.includes('quá lớn') || errorMessage.includes('quá ngắn')) {
                        errorCode = 'E004';
                    } else if (errorMessage.includes('HTML') || errorMessage.includes('parse')) {
                        errorCode = 'E005';
                    }
                } else if (error && typeof error === 'string') {
                    errorMessage = error;
                } else {
                    errorMessage += 'Vui lòng thử lại với URL khác hoặc liên hệ hỗ trợ nếu vấn đề tiếp tục.';
                }
                
                SEOCheckerHandler.showError(errorMessage, errorCode);
                SEOCheckerHandler.setLoading(false);
            }
        },
        
        /**
         * Load PageSpeed Insights separately (after other results are displayed)
         */
        loadPageSpeedInsights: function(url) {
            Debug.log('loadPageSpeedInsights called with URL:', url);
            
            if (!url) {
                Debug.error('loadPageSpeedInsights: URL is required');
                let $pagespeed = $('#seo-pagespeed-insights');
                if ($pagespeed.length > 0) {
                    $pagespeed.empty();
                    $pagespeed.append($('<h3 class="seo-section-title">').text('⚡ Google PageSpeed Insights'));
                    $pagespeed.append($('<div class="seo-stat-item seo-error">').text('Lỗi: URL không hợp lệ'));
                }
                SEOCheckerHandler.setLoading(false);
                return;
            }
            
            let $pagespeed = $('#seo-pagespeed-insights');
            
            // Ensure PageSpeed section exists
            if ($pagespeed.length === 0) {
                Debug.warn('PageSpeed section not found, creating it');
                const $result = $('#seo-checker-result');
                if ($result.length > 0) {
                    const $newSection = $('<div class="seo-section" id="seo-pagespeed-insights"></div>');
                    // Insert before summary section
                    const $summary = $result.find('#seo-basic-factors').closest('.seo-section');
                    if ($summary.length > 0) {
                        $summary.before($newSection);
                    } else {
                        $result.append($newSection);
                    }
                    // Re-select after creation to avoid operating on empty jQuery object
                    $pagespeed = $('#seo-pagespeed-insights');
                }
            }

            // If still not found, abort gracefully
            if ($pagespeed.length === 0) {
                Debug.error('PageSpeed section could not be created/found');
                SEOCheckerHandler.setLoading(false);
                return;
            }
            
            // Update progress to pagespeed
            SEOCheckerHandler.setLoading(true, 'pagespeed');
            
            // Show loading indicator
            $pagespeed.empty();
            $pagespeed.append($('<h3 class="seo-section-title">').text('⚡ Google PageSpeed Insights'));
            $pagespeed.append($('<div class="seo-loading-pagespeed">').html(
                '<div class="bt-loading-spinner"></div> Đang phân tích PageSpeed Insights, vui lòng đợi...'
            ));
            
            // Fetch PageSpeed data
            Debug.log('Fetching PageSpeed data for:', url);
            SEOCheckerHandler.fetchPageSpeed(url, function(pagespeedData) {
                Debug.log('PageSpeed callback received data:', pagespeedData);
                
                // Always hide loading first
                SEOCheckerHandler.setLoading(false);
                
                // Check for errors first - if error, just display error message and return
                if (!pagespeedData || pagespeedData.error) {
                    Debug.warn('PageSpeed error:', pagespeedData ? pagespeedData.error : 'No data received');
                    try {
                        SEOCheckerHandler.displayPageSpeedResults(pagespeedData || { error: 'Không thể lấy dữ liệu PageSpeed Insights' });
                    } catch (error) {
                        Debug.error('Error displaying PageSpeed error:', error);
                        const $pagespeed = $('#seo-pagespeed-insights');
                        if ($pagespeed.length > 0) {
                            $pagespeed.empty();
                            $pagespeed.append($('<h3 class="seo-section-title">').text('⚡ Google PageSpeed Insights'));
                            $pagespeed.append($('<div class="seo-stat-item seo-warning">').html(
                                '<strong>Lưu ý:</strong> ' + (pagespeedData && pagespeedData.error ? pagespeedData.error : 'Không thể lấy dữ liệu PageSpeed Insights') +
                                ' <a href="' + (window.location.origin + '/wp-admin/edit.php?post_type=tool&page=business-tools-settings') + '" target="_blank">Cấu hình API key tại đây</a>'
                            ));
                        }
                    }
                    return; // Exit early if error
                }
                
                // Only proceed if we have valid metrics data
                if (!pagespeedData.metrics || Object.keys(pagespeedData.metrics).length === 0) {
                    Debug.warn('PageSpeed: No metrics data available');
                    try {
                        SEOCheckerHandler.displayPageSpeedResults({ error: 'Không có dữ liệu metrics từ PageSpeed Insights' });
                    } catch (error) {
                        Debug.error('Error displaying PageSpeed no-data message:', error);
                    }
                    return; // Exit early if no metrics
                }
                
                try {
                    // Calculate PageSpeed score (8 points) based on Core Web Vitals
                    let pagespeedScore = 0;
                    const pagespeedMax = 8;
                    
                    // LCP (Largest Contentful Paint) - 3 points
                    if (pagespeedData.metrics.lcp !== undefined && pagespeedData.metrics.lcp !== null) {
                        const lcp = pagespeedData.metrics.lcp;
                        if (lcp <= 2.5) pagespeedScore += 3;
                        else if (lcp <= 4.0) pagespeedScore += 1.5;
                    }
                    
                    // CLS (Cumulative Layout Shift) - 3 points
                    if (pagespeedData.metrics.cls !== undefined && pagespeedData.metrics.cls !== null) {
                        const cls = pagespeedData.metrics.cls;
                        if (cls <= 0.1) pagespeedScore += 3;
                        else if (cls <= 0.25) pagespeedScore += 1.5;
                    }
                    
                    // INP (Interaction to Next Paint) or FID - 2 points
                    if (pagespeedData.metrics.inp !== undefined && pagespeedData.metrics.inp !== null) {
                        const inp = pagespeedData.metrics.inp;
                        if (inp <= 200) pagespeedScore += 2;
                        else if (inp <= 500) pagespeedScore += 1;
                    } else if (pagespeedData.metrics.fid !== undefined && pagespeedData.metrics.fid !== null) {
                        const fid = pagespeedData.metrics.fid;
                        if (fid <= 100) pagespeedScore += 2;
                        else if (fid <= 300) pagespeedScore += 1;
                    }
                    
                    // Update analysis object with PageSpeed score (only if we have valid analysis object)
                    if (SEOCheckerHandler.currentAnalysis && SEOCheckerHandler.currentAnalysis.scoreBreakdown) {
                        // Add PageSpeed to score breakdown
                        const pagespeedStatus = pagespeedScore >= 6 ? 'good' : (pagespeedScore >= 3 ? 'warning' : 'error');
                        SEOCheckerHandler.currentAnalysis.scoreBreakdown.pagespeed = {
                            points: pagespeedScore,
                            max: pagespeedMax,
                            status: pagespeedStatus
                        };
                        
                        // Update total score (base score + PageSpeed)
                        const baseScore = SEOCheckerHandler.currentAnalysis.score || 0;
                        SEOCheckerHandler.currentAnalysis.score = baseScore + pagespeedScore;
                        SEOCheckerHandler.currentAnalysis.maxScore = 100; // Always 100 including PageSpeed
                        
                        // Update overall score display
                        const $overallScore = $('#seo-overall-score');
                        if ($overallScore.length > 0) {
                            const totalScore = SEOCheckerHandler.currentAnalysis.score;
                            
                            // Update display: always show totalScore/100 (including PageSpeed)
                            $overallScore.text(totalScore + '/100');
                            
                            // Remove note since PageSpeed is now loaded
                            $('#seo-score-note').remove();
                            
                            // Update score circle color
                            const scorePercentage = Math.round((totalScore / 100) * 100);
                            const $scoreCircle = $('.seo-score-circle');
                            $scoreCircle.removeClass('seo-score-excellent seo-score-good seo-score-fair seo-score-poor');
                            if (scorePercentage >= 80) {
                                $scoreCircle.addClass('seo-score-excellent');
                            } else if (scorePercentage >= 60) {
                                $scoreCircle.addClass('seo-score-good');
                            } else if (scorePercentage >= 40) {
                                $scoreCircle.addClass('seo-score-fair');
                            } else {
                                $scoreCircle.addClass('seo-score-poor');
                            }
                            
                            // Update PageSpeed in summary (Nhận Xét Chung) - re-render summary section
                            const $basicFactors = $('#seo-basic-factors');
                            if ($basicFactors.length > 0) {
                                // Re-render summary with updated analysis (including PageSpeed)
                                // Use the same display logic as displayResults
                                SEOCheckerHandler.displaySummaryFactors(SEOCheckerHandler.currentAnalysis);
                            }
                        }
                    }
                    
                    // Store PageSpeed score in pagespeedData for display
                    pagespeedData.score = pagespeedScore;
                    pagespeedData.maxScore = pagespeedMax;
                    
                    // Update PageSpeed section with results
                    SEOCheckerHandler.displayPageSpeedResults(pagespeedData);
                    
                    // Ensure result container is still visible
                    const $result = $('#seo-checker-result');
                    if ($result.length > 0) {
                        $result.show().css('display', 'block');
                    }

                    // Scroll to PageSpeed section so user can see it
                    setTimeout(function() {
                        const $ps = $('#seo-pagespeed-insights');
                        if ($ps.length > 0 && $ps.is(':visible')) {
                            const offset = $ps.offset();
                            if (offset) {
                                $('html, body').animate({
                                    scrollTop: offset.top - 80
                                }, 400);
                            }
                        }
                    }, 200);
                    
                } catch (error) {
                    Debug.error('Error processing PageSpeed data:', error);
                    const $pagespeed = $('#seo-pagespeed-insights');
                    if ($pagespeed.length > 0) {
                        $pagespeed.empty();
                        $pagespeed.append($('<h3 class="seo-section-title">').text('⚡ Google PageSpeed Insights'));
                        $pagespeed.append($('<div class="seo-stat-item seo-error">').text('Lỗi khi xử lý PageSpeed Insights: ' + (error.message || 'Unknown error')));
                    }
                }
            });
        },
        
        /**
         * Display PageSpeed Insights results with benchmarks and explanations
         */
        displayPageSpeedResults: function(pagespeedData) {
            const $pagespeed = $('#seo-pagespeed-insights');
            
            // Ensure PageSpeed section exists and is visible
            if ($pagespeed.length === 0) {
                Debug.error('PageSpeed Insights section not found in DOM!');
                // Try to find result container and append PageSpeed section
                const $result = $('#seo-checker-result');
                if ($result.length > 0) {
                    const $newSection = $('<div class="seo-section" id="seo-pagespeed-insights"></div>');
                    // Insert before summary section
                    const $summary = $result.find('.seo-section').last();
                    if ($summary.length > 0) {
                        $summary.before($newSection);
                        $pagespeed = $newSection;
                    } else {
                        $result.append($newSection);
                        $pagespeed = $newSection;
                    }
                } else {
                    Debug.error('Cannot add PageSpeed section - result container not found');
                    return;
                }
            }
            
            $pagespeed.empty();
            $pagespeed.show().css('display', 'block'); // Ensure visible
            
            $pagespeed.append($('<h3 class="seo-section-title">').text('⚡ Google PageSpeed Insights'));
            
            if (pagespeedData && pagespeedData.error) {
                $pagespeed.append($('<div class="seo-stat-item seo-warning">').html(
                    '<strong>Lưu ý:</strong> ' + pagespeedData.error + 
                    ' <a href="' + (window.location.origin + '/wp-admin/edit.php?post_type=tool&page=business-tools-settings') + '" target="_blank">Cấu hình API key tại đây</a>'
                ));
            } else if (pagespeedData.metrics && Object.keys(pagespeedData.metrics).length > 0) {
                // Add explanation header
                $pagespeed.append($('<div class="seo-explanation-box">').html(
                    '<strong>⚡ Giải thích:</strong> Google PageSpeed Insights đo lường hiệu suất trang web dựa trên dữ liệu thực tế từ Chrome User Experience Report và Lighthouse. ' +
                    'Các chỉ số này ảnh hưởng trực tiếp đến trải nghiệm người dùng và xếp hạng SEO. Tốc độ tải nhanh giúp giảm tỷ lệ thoát và tăng tỷ lệ chuyển đổi.'
                ));
                
                // Chrome User Experience Report Results
                const $chromeUX = $('<div>').css('margin-bottom', '1.5rem');
                $chromeUX.append($('<h4>').css('font-weight', 'bold', 'margin-bottom', '0.75rem').text('Chrome User Experience Report Results'));
                
                // First Contentful Paint (FCP)
                if (pagespeedData.metrics.fcp !== undefined && pagespeedData.metrics.fcp !== null) {
                    const fcp = pagespeedData.metrics.fcp;
                    let fcpStatus = '';
                    let fcpStatusClass = '';
                    let fcpBenchmark = '';
                    if (fcp <= 1.8) {
                        fcpStatus = '✅ FAST';
                        fcpStatusClass = 'seo-good';
                        fcpBenchmark = 'Chuẩn: ≤1.8s';
                    } else if (fcp <= 3.0) {
                        fcpStatus = '⚠️ AVERAGE';
                        fcpStatusClass = 'seo-warning';
                        fcpBenchmark = 'Chuẩn: ≤1.8s (hiện tại: 1.8-3.0s)';
                    } else {
                        fcpStatus = '❌ SLOW';
                        fcpStatusClass = 'seo-error';
                        fcpBenchmark = 'Chuẩn: ≤1.8s (hiện tại: >3.0s)';
                    }
                    $chromeUX.append($('<div class="seo-stat-item ' + fcpStatusClass + '">').html(
                        '<strong>First Contentful Paint (FCP):</strong> ' + fcpStatus + ' | ' + fcp.toFixed(1) + 's | ' +
                        '<span class="seo-benchmark">' + fcpBenchmark + '</span> | ' +
                        '<span class="seo-tip">Giải thích: Thời gian từ khi người dùng điều hướng đến khi trình duyệt hiển thị nội dung đầu tiên</span>'
                    ));
                }
                
                // Largest Contentful Paint (LCP)
                if (pagespeedData.metrics.lcp !== undefined && pagespeedData.metrics.lcp !== null) {
                    const lcp = pagespeedData.metrics.lcp;
                    let lcpStatus = '';
                    let lcpStatusClass = '';
                    let lcpBenchmark = '';
                    if (lcp <= 2.5) {
                        lcpStatus = '✅ FAST';
                        lcpStatusClass = 'seo-good';
                        lcpBenchmark = 'Chuẩn: ≤2.5s';
                    } else if (lcp <= 4.0) {
                        lcpStatus = '⚠️ AVERAGE';
                        lcpStatusClass = 'seo-warning';
                        lcpBenchmark = 'Chuẩn: ≤2.5s (hiện tại: 2.5-4.0s)';
                    } else {
                        lcpStatus = '❌ SLOW';
                        lcpStatusClass = 'seo-error';
                        lcpBenchmark = 'Chuẩn: ≤2.5s (hiện tại: >4.0s)';
                    }
                    $chromeUX.append($('<div class="seo-stat-item ' + lcpStatusClass + '">').html(
                        '<strong>Largest Contentful Paint (LCP):</strong> ' + lcpStatus + ' | ' + lcp.toFixed(1) + 's | ' +
                        '<span class="seo-benchmark">' + lcpBenchmark + '</span> | ' +
                        '<span class="seo-tip">Giải thích: Thời gian để phần tử lớn nhất trong viewport được render. Core Web Vital quan trọng</span>'
                    ));
                }
                
                // First Input Delay (FID) - based on TBT
                if (pagespeedData.metrics.tbt !== undefined && pagespeedData.metrics.tbt !== null) {
                    const tbt = pagespeedData.metrics.tbt;
                    let fidStatus = '';
                    let fidStatusClass = '';
                    let fidBenchmark = '';
                    // TBT <= 200ms corresponds to FID <= 100ms (good)
                    // TBT <= 600ms corresponds to FID <= 300ms (needs improvement)
                    if (tbt <= 200) {
                        fidStatus = '✅ FAST';
                        fidStatusClass = 'seo-good';
                        fidBenchmark = 'Chuẩn: ≤200ms';
                    } else if (tbt <= 600) {
                        fidStatus = '⚠️ AVERAGE';
                        fidStatusClass = 'seo-warning';
                        fidBenchmark = 'Chuẩn: ≤200ms (hiện tại: 200-600ms)';
                    } else {
                        fidStatus = '❌ SLOW';
                        fidStatusClass = 'seo-error';
                        fidBenchmark = 'Chuẩn: ≤200ms (hiện tại: >600ms)';
                    }
                    $chromeUX.append($('<div class="seo-stat-item ' + fidStatusClass + '">').html(
                        '<strong>Total Blocking Time (TBT):</strong> ' + fidStatus + ' | ' + tbt + ' ms | ' +
                        '<span class="seo-benchmark">' + fidBenchmark + '</span> | ' +
                        '<span class="seo-tip">Giải thích: Tổng thời gian JavaScript chặn main thread. Ảnh hưởng đến First Input Delay (FID)</span>'
                    ));
                }
                
                $pagespeed.append($chromeUX);
                
                // Lighthouse Results
                const $lighthouse = $('<div>');
                $lighthouse.append($('<h4>').css('font-weight', 'bold', 'margin-bottom', '0.75rem').text('Lighthouse Performance Metrics'));
                
                // First Contentful Paint
                if (pagespeedData.metrics.fcp !== undefined && pagespeedData.metrics.fcp !== null) {
                    const fcp = pagespeedData.metrics.fcp;
                    let fcpStatus = fcp <= 1.8 ? '✅' : (fcp <= 3.0 ? '⚠️' : '❌');
                    $lighthouse.append($('<div class="seo-stat-item">').html(
                        '<strong>First Contentful Paint (FCP):</strong> ' + fcp.toFixed(1) + 's | ' + fcpStatus + 
                        ' | <span class="seo-benchmark">Chuẩn: ≤1.8s</span>'
                    ));
                }
                
                // Speed Index
                if (pagespeedData.metrics.speed_index !== undefined && pagespeedData.metrics.speed_index !== null) {
                    const si = pagespeedData.metrics.speed_index;
                    let siStatus = si <= 3.4 ? '✅' : (si <= 5.8 ? '⚠️' : '❌');
                    $lighthouse.append($('<div class="seo-stat-item">').html(
                        '<strong>Speed Index:</strong> ' + si.toFixed(1) + 's | ' + siStatus + 
                        ' | <span class="seo-benchmark">Chuẩn: ≤3.4s</span> | ' +
                        '<span class="seo-tip">Đo tốc độ hiển thị nội dung trong quá trình tải trang</span>'
                    ));
                }
                
                // Time To Interactive
                if (pagespeedData.metrics.tti !== undefined && pagespeedData.metrics.tti !== null) {
                    const tti = pagespeedData.metrics.tti;
                    let ttiStatus = tti <= 3.8 ? '✅' : (tti <= 7.3 ? '⚠️' : '❌');
                    $lighthouse.append($('<div class="seo-stat-item">').html(
                        '<strong>Time To Interactive (TTI):</strong> ' + tti.toFixed(1) + 's | ' + ttiStatus + 
                        ' | <span class="seo-benchmark">Chuẩn: ≤3.8s</span> | ' +
                        '<span class="seo-tip">Thời gian để trang có thể tương tác đầy đủ</span>'
                    ));
                }
                
                // First Meaningful Paint
                if (pagespeedData.metrics.fmp !== undefined && pagespeedData.metrics.fmp !== null) {
                    const fmp = pagespeedData.metrics.fmp;
                    let fmpStatus = fmp <= 1.8 ? '✅' : (fmp <= 3.0 ? '⚠️' : '❌');
                    $lighthouse.append($('<div class="seo-stat-item">').html(
                        '<strong>First Meaningful Paint (FMP):</strong> ' + fmp.toFixed(1) + 's | ' + fmpStatus + 
                        ' | <span class="seo-benchmark">Chuẩn: ≤1.8s</span> | ' +
                        '<span class="seo-tip">Thời gian để nội dung chính được hiển thị</span>'
                    ));
                }
                
                // First CPU Idle
                if (pagespeedData.metrics.fci !== undefined && pagespeedData.metrics.fci !== null) {
                    const fci = pagespeedData.metrics.fci;
                    let fciStatus = fci <= 3.8 ? '✅' : (fci <= 7.3 ? '⚠️' : '❌');
                    $lighthouse.append($('<div class="seo-stat-item">').html(
                        '<strong>First CPU Idle (FCI):</strong> ' + fci.toFixed(1) + 's | ' + fciStatus + 
                        ' | <span class="seo-benchmark">Chuẩn: ≤3.8s</span> | ' +
                        '<span class="seo-tip">Thời điểm CPU có thể xử lý input của người dùng</span>'
                    ));
                }
                
                // Estimated Input Latency
                if (pagespeedData.metrics.eil !== undefined && pagespeedData.metrics.eil !== null) {
                    const eil = pagespeedData.metrics.eil;
                    let eilStatus = eil <= 50 ? '✅' : (eil <= 100 ? '⚠️' : '❌');
                    $lighthouse.append($('<div class="seo-stat-item">').html(
                        '<strong>Estimated Input Latency (EIL):</strong> ' + eil + ' ms | ' + eilStatus + 
                        ' | <span class="seo-benchmark">Chuẩn: ≤50ms</span> | ' +
                        '<span class="seo-tip">Độ trễ ước tính khi người dùng tương tác với trang</span>'
                    ));
                }
                
                $pagespeed.append($lighthouse);
                
                // Core Web Vitals Section (NEW - Enhanced)
                const $coreWebVitals = $('<div>').css({
                    'margin-top': '2rem',
                    'padding-top': '1.5rem',
                    'border-top': '2px solid #e5e7eb'
                });
                $coreWebVitals.append($('<h4>').css({
                    'font-weight': 'bold',
                    'margin-bottom': '1rem',
                    'color': '#1f2937'
                }).text('🎯 Core Web Vitals (Chỉ số quan trọng nhất)'));
                
                $coreWebVitals.append($('<div class="seo-explanation-box">').html(
                    '<strong>🎯 Giải thích:</strong> Core Web Vitals là 3 chỉ số quan trọng nhất mà Google sử dụng để đánh giá trải nghiệm người dùng. ' +
                    'Các chỉ số này ảnh hưởng trực tiếp đến xếp hạng SEO và được Google ưu tiên trong thuật toán ranking.'
                ));
                
                // LCP (Largest Contentful Paint) - Already displayed, but add to Core Web Vitals section
                if (pagespeedData.metrics.lcp !== undefined && pagespeedData.metrics.lcp !== null) {
                    const lcp = pagespeedData.metrics.lcp;
                    let lcpStatus = '';
                    let lcpStatusClass = '';
                    let lcpLabel = '';
                    if (lcp <= 2.5) {
                        lcpStatus = '✅ GOOD';
                        lcpStatusClass = 'seo-good';
                        lcpLabel = 'Tốt';
                    } else if (lcp <= 4.0) {
                        lcpStatus = '⚠️ NEEDS IMPROVEMENT';
                        lcpStatusClass = 'seo-warning';
                        lcpLabel = 'Cần cải thiện';
                    } else {
                        lcpStatus = '❌ POOR';
                        lcpStatusClass = 'seo-error';
                        lcpLabel = 'Kém';
                    }
                    $coreWebVitals.append($('<div class="seo-stat-item ' + lcpStatusClass + '" style="font-size: 1.1em; padding: 1rem; background: #f9fafb; border-left: 4px solid ' + (lcpStatusClass === 'seo-good' ? '#10b981' : (lcpStatusClass === 'seo-warning' ? '#f59e0b' : '#ef4444')) + ';">').html(
                        '<strong style="font-size: 1.2em;">LCP (Largest Contentful Paint):</strong> ' + lcpStatus + ' | ' + lcp.toFixed(1) + 's | ' +
                        '<span class="seo-benchmark">Chuẩn: ≤2.5s</span> | ' +
                        '<span class="seo-tip">Đo thời gian tải phần tử lớn nhất trong viewport. Chỉ số quan trọng nhất cho Core Web Vitals.</span>'
                    ));
                }
                
                // CLS (Cumulative Layout Shift) - NEW
                if (pagespeedData.metrics.cls !== undefined && pagespeedData.metrics.cls !== null) {
                    const cls = pagespeedData.metrics.cls;
                    let clsStatus = '';
                    let clsStatusClass = '';
                    if (cls <= 0.1) {
                        clsStatus = '✅ GOOD';
                        clsStatusClass = 'seo-good';
                    } else if (cls <= 0.25) {
                        clsStatus = '⚠️ NEEDS IMPROVEMENT';
                        clsStatusClass = 'seo-warning';
                    } else {
                        clsStatus = '❌ POOR';
                        clsStatusClass = 'seo-error';
                    }
                    $coreWebVitals.append($('<div class="seo-stat-item ' + clsStatusClass + '" style="font-size: 1.1em; padding: 1rem; background: #f9fafb; border-left: 4px solid ' + (clsStatusClass === 'seo-good' ? '#10b981' : (clsStatusClass === 'seo-warning' ? '#f59e0b' : '#ef4444')) + ';">').html(
                        '<strong style="font-size: 1.2em;">CLS (Cumulative Layout Shift):</strong> ' + clsStatus + ' | ' + cls.toFixed(3) + ' | ' +
                        '<span class="seo-benchmark">Chuẩn: ≤0.1</span> | ' +
                        '<span class="seo-tip">Đo độ ổn định hình ảnh của trang. Giá trị thấp = ít layout shift = trải nghiệm tốt hơn.</span>'
                    ));
                }
                
                // INP (Interaction to Next Paint) - NEW Core Web Vital
                if (pagespeedData.metrics.inp !== undefined && pagespeedData.metrics.inp !== null) {
                    const inp = pagespeedData.metrics.inp;
                    let inpStatus = '';
                    let inpStatusClass = '';
                    if (inp <= 200) {
                        inpStatus = '✅ GOOD';
                        inpStatusClass = 'seo-good';
                    } else if (inp <= 500) {
                        inpStatus = '⚠️ NEEDS IMPROVEMENT';
                        inpStatusClass = 'seo-warning';
                    } else {
                        inpStatus = '❌ POOR';
                        inpStatusClass = 'seo-error';
                    }
                    $coreWebVitals.append($('<div class="seo-stat-item ' + inpStatusClass + '" style="font-size: 1.1em; padding: 1rem; background: #f9fafb; border-left: 4px solid ' + (inpStatusClass === 'seo-good' ? '#10b981' : (inpStatusClass === 'seo-warning' ? '#f59e0b' : '#ef4444')) + ';">').html(
                        '<strong style="font-size: 1.2em;">INP (Interaction to Next Paint):</strong> ' + inpStatus + ' | ' + inp + ' ms | ' +
                        '<span class="seo-benchmark">Chuẩn: ≤200ms</span> | ' +
                        '<span class="seo-tip">Đo độ phản hồi của trang khi người dùng tương tác (click, tap, keypress). Thay thế FID từ 2024.</span>'
                    ));
                } else if (pagespeedData.metrics.fid !== undefined && pagespeedData.metrics.fid !== null) {
                    // Fallback to FID if INP not available
                    const fid = pagespeedData.metrics.fid;
                    let fidStatus = '';
                    let fidStatusClass = '';
                    if (fid <= 100) {
                        fidStatus = '✅ GOOD';
                        fidStatusClass = 'seo-good';
                    } else if (fid <= 300) {
                        fidStatus = '⚠️ NEEDS IMPROVEMENT';
                        fidStatusClass = 'seo-warning';
                    } else {
                        fidStatus = '❌ POOR';
                        fidStatusClass = 'seo-error';
                    }
                    $coreWebVitals.append($('<div class="seo-stat-item ' + fidStatusClass + '" style="font-size: 1.1em; padding: 1rem; background: #f9fafb; border-left: 4px solid ' + (fidStatusClass === 'seo-good' ? '#10b981' : (fidStatusClass === 'seo-warning' ? '#f59e0b' : '#ef4444')) + ';">').html(
                        '<strong style="font-size: 1.2em;">FID (First Input Delay):</strong> ' + fidStatus + ' | ' + fid + ' ms | ' +
                        '<span class="seo-benchmark">Chuẩn: ≤100ms</span> | ' +
                        '<span class="seo-tip">Đo độ trễ từ khi người dùng tương tác đến khi trình duyệt phản hồi. (Legacy - sẽ được thay thế bởi INP)</span>'
                    ));
                }
                
                // TBT (Total Blocking Time) - Related to INP/FID
                if (pagespeedData.metrics.tbt !== undefined && pagespeedData.metrics.tbt !== null) {
                    const tbt = pagespeedData.metrics.tbt;
                    let tbtStatus = '';
                    let tbtStatusClass = '';
                    if (tbt <= 200) {
                        tbtStatus = '✅ GOOD';
                        tbtStatusClass = 'seo-good';
                    } else if (tbt <= 600) {
                        tbtStatus = '⚠️ NEEDS IMPROVEMENT';
                        tbtStatusClass = 'seo-warning';
                    } else {
                        tbtStatus = '❌ POOR';
                        tbtStatusClass = 'seo-error';
                    }
                    $coreWebVitals.append($('<div class="seo-stat-item ' + tbtStatusClass + '" style="padding: 0.75rem; background: #f3f4f6;">').html(
                        '<strong>Total Blocking Time (TBT):</strong> ' + tbtStatus + ' | ' + tbt + ' ms | ' +
                        '<span class="seo-benchmark">Chuẩn: ≤200ms</span> | ' +
                        '<span class="seo-tip">Tổng thời gian JavaScript chặn main thread. Ảnh hưởng trực tiếp đến INP/FID.</span>'
                    ));
                }
                
                $pagespeed.append($coreWebVitals);
            }
        },
        
        /**
         * Fetch PageSpeed Insights data
         */
        fetchPageSpeed: function(url, callback) {
            $.ajax({
                url: businessTools.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'business_tools_pagespeed',
                    url: url,
                    nonce: businessTools.nonce
                },
                success: function(response) {
                    Debug.log('PageSpeed API response:', response);
                    if (response && response.success && response.data) {
                        callback(response.data);
                    } else {
                        // If API key not configured or error, return empty data
                        const errorMsg = (response && response.data && response.data.message) 
                            ? response.data.message 
                            : 'Không thể lấy dữ liệu PageSpeed Insights';
                        Debug.warn('PageSpeed API error:', errorMsg);
                        callback({
                            error: errorMsg
                        });
                    }
                },
                error: function(xhr, status, error) {
                    // Return empty data on error
                    Debug.error('PageSpeed API request failed:', status, error);
                    callback({
                        error: 'Không thể kết nối đến PageSpeed Insights API. Vui lòng kiểm tra kết nối mạng hoặc cấu hình API key.'
                    });
                }
            });
        },
        
        performAnalysis: function(content, focusKeyword, url) {
            // Prevent browser from loading images and other resources from parsed HTML
            // Replace image src with data URI to prevent 404 errors
            // This prevents browser from making requests for images that don't exist on our domain
            content = content.replace(/<img([^>]*)\s+src=["']([^"']+)["']([^>]*)>/gi, function(match, before, src, after) {
                // Keep the image tag but replace src with empty data URI to prevent browser from loading it
                // We still need the tag for analysis (alt, width, height, etc.)
                return '<img' + before + ' src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-original-src="' + src + '"' + after + '>';
            });
            
            // Also prevent loading of other resources that might cause 404s
            // Replace link href for stylesheets, scripts, etc. (but keep for analysis)
            // Only replace non-critical links (stylesheet, prefetch, preload, etc.) to avoid breaking canonical/favicon/hreflang
            content = content.replace(/<link([^>]*)\s+href=["']([^"']+)["']([^>]*)>/gi, function(match, before, href, after) {
                // Check if this is a critical link that we need to keep (canonical, icon, hreflang, etc.)
                const rel = (before + after).match(/rel=["']([^"']+)["']/i);
                const relValue = rel ? rel[1].toLowerCase() : '';
                
                // Keep canonical, icon, alternate (hreflang) links as-is - they don't cause 404s
                if (relValue.includes('canonical') || relValue.includes('icon') || relValue.includes('alternate')) {
                    return match; // Keep original
                }
                
                // For other links (stylesheet, prefetch, preload, etc.), prevent browser from loading
                return '<link' + before + ' href="about:blank" data-original-href="' + href + '"' + after + '>';
            });
            
            // Replace script src to prevent execution and 404s
            content = content.replace(/<script([^>]*)\s+src=["']([^"']+)["']([^>]*)>/gi, function(match, before, src, after) {
                // Remove script src to prevent loading and execution
                return '<script' + before + ' data-original-src="' + src + '"' + after + '>';
            });
            
            // Prevent CSS @import and background images from loading
            // Replace @import in style tags
            content = content.replace(/@import\s+["']([^"']+)["']/gi, function(match, url) {
                // Comment out @import to prevent loading
                return '/* @import disabled: ' + url + ' */';
            });
            
            // Replace background-image URLs in inline styles (but keep for analysis)
            content = content.replace(/background-image\s*:\s*url\(["']?([^"')]+)["']?\)/gi, function(match, url) {
                // Replace with data URI to prevent loading
                return 'background-image: url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7); /* original: ' + url + ' */';
            });
            
            // Create a temporary DOM element to parse HTML
            // Note: Images, scripts, and stylesheets won't load, but we can still analyze their attributes
            const $temp = $('<div>').html(content);
            
            // Remove script, style, noscript, and other non-content elements BEFORE extracting text
            // This prevents any remaining resources from being loaded
            $temp.find('script, style, noscript, iframe, embed, object, applet, audio, video, canvas, svg').remove();
            
            // IMPROVED: Detect and extract main content area (separate from sidebar/footer/header)
            let $mainContent = null;
            let mainContentSelector = null;
            
            // Try to find main content using semantic HTML5 elements (priority order)
            const mainContentSelectors = [
                'main',
                'article',
                '[role="main"]',
                '.main-content',
                '.content',
                '#main-content',
                '#content',
                '.post-content',
                '.entry-content',
                '.article-content',
                'main article',
                'article .content'
            ];
            
            for (let i = 0; i < mainContentSelectors.length; i++) {
                const selector = mainContentSelectors[i];
                const $found = $temp.find(selector).first();
                if ($found.length > 0 && $found.text().trim().length > 100) {
                    // Found a main content area with substantial text
                    $mainContent = $found;
                    mainContentSelector = selector;
                    break;
                }
            }
            
            // If no semantic main content found, try to find the largest text container
            if (!$mainContent) {
                // Remove common non-content areas
                const $cloned = $temp.clone();
                $cloned.find('header, footer, nav, aside, .sidebar, .footer, .header, .navigation, .menu, .widget, .advertisement, .ads, [class*="ad-"], [id*="ad-"]').remove();
                
                // Find the largest text container (likely main content)
                let maxTextLength = 0;
                $cloned.find('div, section').each(function() {
                    const $el = $(this);
                    const textLength = $el.text().trim().length;
                    // Skip if too small or likely a wrapper
                    if (textLength > maxTextLength && textLength > 200 && !$el.hasClass('wrapper') && !$el.hasClass('container')) {
                        maxTextLength = textLength;
                        $mainContent = $el;
                        mainContentSelector = 'auto-detected';
                    }
                });
            }
            
            // Fallback: use body content if no main content detected
            if (!$mainContent) {
                // Remove header, footer, nav, aside from body
                const $bodyContent = $temp.clone();
                $bodyContent.find('header, footer, nav, aside, .sidebar, .footer, .header, .navigation').remove();
                $mainContent = $bodyContent;
                mainContentSelector = 'body-fallback';
            }
            
            // Extract text content from main content area
            let textContent = $mainContent.text() || '';
            
            // Fallback: if jQuery text() doesn't work, use regex but be more careful
            if (!textContent || textContent.trim().length < 10) {
                // Remove all HTML tags and decode HTML entities
                textContent = content
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ') // Remove scripts
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ') // Remove styles
                    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, ' ') // Remove noscript
                    .replace(/<[^>]+>/g, ' ') // Remove all remaining HTML tags
                    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
                    .replace(/&[a-z]+;/gi, ' ') // Remove HTML entities
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .trim();
            }
            
            // Basic SEO factors (page-level)
            const title = $temp.find('title').first().text() || '';
            const metaDesc = $temp.find('meta[name="description"]').attr('content') || '';
            const metaKeywords = $temp.find('meta[name="keywords"]').attr('content') || '';
            // Use original href if available (from data-original-href), otherwise use current href
            const canonicalLink = $temp.find('link[rel="canonical"]').first();
            const canonical = canonicalLink.attr('data-original-href') || canonicalLink.attr('href') || '';
            const metaRobots = $temp.find('meta[name="robots"]').attr('content') || '';
            
            // Open Graph tags
            const ogTitle = $temp.find('meta[property="og:title"]').attr('content') || '';
            const ogDesc = $temp.find('meta[property="og:description"]').attr('content') || '';
            const ogImage = $temp.find('meta[property="og:image"]').attr('content') || '';
            const ogUrl = $temp.find('meta[property="og:url"]').attr('content') || '';
            
            // Twitter Cards tags
            const twitterCard = $temp.find('meta[name="twitter:card"]').attr('content') || '';
            const twitterTitle = $temp.find('meta[name="twitter:title"]').attr('content') || '';
            const twitterDesc = $temp.find('meta[name="twitter:description"]').attr('content') || '';
            const twitterImage = $temp.find('meta[name="twitter:image"]').attr('content') || '';
            const twitterSite = $temp.find('meta[name="twitter:site"]').attr('content') || '';
            const twitterCreator = $temp.find('meta[name="twitter:creator"]').attr('content') || '';
            
            // Schema markup - Enhanced validation
            const schemaScripts = $temp.find('script[type="application/ld+json"]');
            const hasSchema = schemaScripts.length > 0;
            const schemaValidation = SEOCheckerHandler.validateStructuredData(schemaScripts);
            
            // Use main content for headings, images, and links analysis (more accurate)
            const $contentForAnalysis = $mainContent || $temp;
            
            const h1Tags = $contentForAnalysis.find('h1');
            const h2Tags = $contentForAnalysis.find('h2');
            const h3Tags = $contentForAnalysis.find('h3');
            const h4Tags = $contentForAnalysis.find('h4');
            const images = $contentForAnalysis.find('img');
            const links = $contentForAnalysis.find('a');
            
            // Word count
            const words = textContent.trim().split(/\s+/).filter(w => w.length > 0);
            const wordCount = words.length;
            const charCount = textContent.length;
            const charCountNoSpaces = textContent.replace(/\s/g, '').length;
            
            // Additional SEO checks: viewport, charset, lang, favicon
            const viewport = $temp.find('meta[name="viewport"]').attr('content') || '';
            const charset = $temp.find('meta[charset]').attr('charset') || $temp.find('meta[http-equiv="Content-Type"]').attr('content') || '';
            const lang = $temp.find('html').attr('lang') || '';
            // Use original href if available (from data-original-href), otherwise use current href
            const faviconLink = $temp.find('link[rel="icon"], link[rel="shortcut icon"]').first();
            const favicon = faviconLink.attr('data-original-href') || faviconLink.attr('href') || '';
            
            // Readability calculation (improved Flesch Reading Ease)
            // Better sentence detection - handle Vietnamese punctuation and abbreviations
            const sentenceRegex = SEO_CONSTANTS.SENTENCE_REGEX;
            let sentences = textContent.split(sentenceRegex).filter(s => s.trim().length > 0);
            
            // Filter out very short "sentences" that are likely abbreviations or numbers
            sentences = sentences.filter(s => {
                const trimmed = s.trim();
                // Skip if too short or looks like abbreviation/number
                if (trimmed.length < 3) return false;
                // Skip if it's just numbers/punctuation
                if (/^[\d\s\.,;:]+$/.test(trimmed)) return false;
                return true;
            });
            
            const sentenceCount = sentences.length;
            const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
            
            // Improved syllable estimation for Vietnamese and English
            const avgSyllablesPerWord = SEOCheckerHandler.estimateSyllables(words);
            
            // Calculate Flesch Reading Ease score
            const readabilityScore = SEOCheckerHandler.calculateReadability(wordCount, sentenceCount, avgSyllablesPerWord);
            
            // Additional readability metrics
            const avgCharsPerWord = wordCount > 0 ? charCountNoSpaces / wordCount : 0;
            const avgWordsPerSentenceRounded = Math.round(avgWordsPerSentence * 10) / 10;
            
            // Keyword analysis (enhanced)
            let keywordAnalysis = null;
            if (focusKeyword) {
                const keywordLower = focusKeyword.toLowerCase();
                const textLower = textContent.toLowerCase();
                const keywordRegex = new RegExp(keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                const keywordCount = (textLower.match(keywordRegex) || []).length;
                const keywordDensity = wordCount > 0 ? ((keywordCount / wordCount) * 100).toFixed(2) : 0;
                
                // Check keyword placement
                const first100Words = words.slice(0, 100).join(' ').toLowerCase();
                const lastParagraph = words.slice(-50).join(' ').toLowerCase();
                const firstSentence = sentences.length > 0 ? sentences[0].toLowerCase() : '';
                
                keywordAnalysis = {
                    keyword: focusKeyword,
                    count: keywordCount,
                    density: parseFloat(keywordDensity),
                    inTitle: title.toLowerCase().includes(keywordLower),
                    inTitleStart: title.toLowerCase().indexOf(keywordLower) < 60, // In first 60 chars
                    inMetaDesc: metaDesc.toLowerCase().includes(keywordLower),
                    inH1: h1Tags.length > 0 && h1Tags.first().text().toLowerCase().includes(keywordLower),
                    inFirstParagraph: first100Words.includes(keywordLower),
                    inFirstSentence: firstSentence.includes(keywordLower),
                    inLastParagraph: lastParagraph.includes(keywordLower),
                    inUrl: url ? url.toLowerCase().includes(keywordLower) : false,
                };
            }
            
            // Most Common Keywords Test - Fixed to preserve Vietnamese diacritics
            // Enhanced with N-gram analysis (bigrams and trigrams)
            const wordFreq = {};
            const bigramFreq = {};
            const trigramFreq = {};
            
            // Filter words - preserve Vietnamese diacritics
            // Only remove punctuation, keep Vietnamese characters
            const cleanWords = words.filter(w => {
                // Remove only punctuation marks, keep letters (including Vietnamese) and numbers
                const cleaned = w.replace(/[^\p{L}\p{N}]/gu, ''); // \p{L} = any letter (including Vietnamese), \p{N} = any number
                return cleaned.length > 2 && !SEO_CONSTANTS.STOP_WORDS.includes(cleaned.toLowerCase());
            });
            
            // Single word frequency (unigrams)
            cleanWords.forEach(word => {
                // Use original word (with diacritics) for key, but normalize for comparison
                // Remove only punctuation, keep Vietnamese diacritics
                const cleaned = word.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
                if (cleaned.length > 2) {
                    // Use cleaned version as key for frequency counting
                    // But store original word for display
                    if (!wordFreq[cleaned]) {
                        wordFreq[cleaned] = { count: 0, original: word };
                    }
                    wordFreq[cleaned].count++;
                }
            });
            
            // Bigram analysis (2-word phrases)
            for (let i = 0; i < cleanWords.length - 1; i++) {
                const word1 = cleanWords[i].replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
                const word2 = cleanWords[i + 1].replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
                if (word1.length > 2 && word2.length > 2 && 
                    !SEO_CONSTANTS.STOP_WORDS.includes(word1) && 
                    !SEO_CONSTANTS.STOP_WORDS.includes(word2)) {
                    const bigram = word1 + ' ' + word2;
                    const originalBigram = cleanWords[i] + ' ' + cleanWords[i + 1];
                    if (!bigramFreq[bigram]) {
                        bigramFreq[bigram] = { count: 0, original: originalBigram };
                    }
                    bigramFreq[bigram].count++;
                }
            }
            
            // Trigram analysis (3-word phrases)
            for (let i = 0; i < cleanWords.length - 2; i++) {
                const word1 = cleanWords[i].replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
                const word2 = cleanWords[i + 1].replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
                const word3 = cleanWords[i + 2].replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
                if (word1.length > 2 && word2.length > 2 && word3.length > 2 &&
                    !SEO_CONSTANTS.STOP_WORDS.includes(word1) && 
                    !SEO_CONSTANTS.STOP_WORDS.includes(word2) &&
                    !SEO_CONSTANTS.STOP_WORDS.includes(word3)) {
                    const trigram = word1 + ' ' + word2 + ' ' + word3;
                    const originalTrigram = cleanWords[i] + ' ' + cleanWords[i + 1] + ' ' + cleanWords[i + 2];
                    if (!trigramFreq[trigram]) {
                        trigramFreq[trigram] = { count: 0, original: originalTrigram };
                    }
                    trigramFreq[trigram].count++;
                }
            }
            
            // Combine unigrams, bigrams, and trigrams, prioritizing longer phrases
            const allKeywords = [];
            
            // Add trigrams (highest priority - most specific)
            Object.keys(trigramFreq).forEach(key => {
                if (trigramFreq[key].count >= 2) { // Only include if appears at least 2 times
                    allKeywords.push({
                        word: trigramFreq[key].original,
                        count: trigramFreq[key].count,
                        type: 'trigram',
                        density: wordCount > 0 ? ((trigramFreq[key].count / wordCount) * 100).toFixed(2) : 0
                    });
                }
            });
            
            // Add bigrams (medium priority)
            Object.keys(bigramFreq).forEach(key => {
                if (bigramFreq[key].count >= 2) { // Only include if appears at least 2 times
                    allKeywords.push({
                        word: bigramFreq[key].original,
                        count: bigramFreq[key].count,
                        type: 'bigram',
                        density: wordCount > 0 ? ((bigramFreq[key].count / wordCount) * 100).toFixed(2) : 0
                    });
                }
            });
            
            // Add unigrams (lowest priority - but still important)
            Object.keys(wordFreq).forEach(key => {
                allKeywords.push({
                    word: wordFreq[key].original,
                    count: wordFreq[key].count,
                    type: 'unigram',
                    density: wordCount > 0 ? ((wordFreq[key].count / wordCount) * 100).toFixed(2) : 0
                });
            });
            
            // Sort by count (descending), then by type priority (trigram > bigram > unigram)
            allKeywords.sort((a, b) => {
                if (b.count !== a.count) return b.count - a.count;
                const typePriority = { 'trigram': 3, 'bigram': 2, 'unigram': 1 };
                return typePriority[b.type] - typePriority[a.type];
            });
            
            const mostCommonKeywords = allKeywords.slice(0, 15); // Show top 15 (including phrases)
            
            // Keywords Usage Test - Enhanced with prominence and proximity analysis
            const keywordsUsage = mostCommonKeywords.slice(0, 5).map(kw => {
                // Use original word with diacritics for comparison
                const kwLower = kw.word.toLowerCase();
                const titleLower = title.toLowerCase();
                const metaDescLower = metaDesc.toLowerCase();
                const h1Text = h1Tags.length > 0 ? h1Tags.first().text().toLowerCase() : '';
                const firstParagraph = words.slice(0, 100).join(' ').toLowerCase();
                const urlLower = (url || '').toLowerCase();
                
                // Keyword Prominence Analysis (position in content)
                let prominenceScore = 0;
                const kwIndexInContent = textContent.toLowerCase().indexOf(kwLower);
                if (kwIndexInContent >= 0) {
                    // Keywords in first 10% of content get higher prominence
                    const contentLength = textContent.length;
                    const prominenceRatio = kwIndexInContent / contentLength;
                    if (prominenceRatio <= 0.1) prominenceScore = 3; // First 10%
                    else if (prominenceRatio <= 0.25) prominenceScore = 2; // First 25%
                    else if (prominenceRatio <= 0.5) prominenceScore = 1; // First 50%
                }
                
                // Keyword Proximity Analysis (keywords appearing close together)
                let proximityScore = 0;
                const kwWords = kw.word.toLowerCase().split(/\s+/);
                if (kwWords.length > 1) {
                    // For multi-word keywords, check if words appear close together
                    const firstWordIndex = textContent.toLowerCase().indexOf(kwWords[0]);
                    if (firstWordIndex >= 0) {
                        const nextWordIndex = textContent.toLowerCase().indexOf(kwWords[1], firstWordIndex);
                        if (nextWordIndex >= 0 && (nextWordIndex - firstWordIndex) <= 50) {
                            proximityScore = 2; // Words appear within 50 characters
                        } else if (nextWordIndex >= 0 && (nextWordIndex - firstWordIndex) <= 100) {
                            proximityScore = 1; // Words appear within 100 characters
                        }
                    }
                }
                
                let usageScore = 0;
                if (titleLower.includes(kwLower)) usageScore += 3; // Increased from 2
                if (titleLower.indexOf(kwLower) < 60) usageScore += 1; // Bonus for early position in title
                if (metaDescLower.includes(kwLower)) usageScore += 2;
                if (h1Text.includes(kwLower)) usageScore += 2;
                if (urlLower.includes(kwLower)) usageScore += 1;
                if (firstParagraph.includes(kwLower)) usageScore += 2; // Increased from 1
                usageScore += prominenceScore; // Add prominence score
                usageScore += proximityScore; // Add proximity score
                
                return {
                    keyword: kw.word, // Original word with diacritics
                    count: kw.count,
                    density: parseFloat(kw.density),
                    inTitle: titleLower.includes(kwLower),
                    inTitleStart: titleLower.indexOf(kwLower) < 60,
                    inMetaDesc: metaDescLower.includes(kwLower),
                    inH1: h1Text.includes(kwLower),
                    inUrl: urlLower.includes(kwLower),
                    inFirstParagraph: firstParagraph.includes(kwLower),
                    prominenceScore: prominenceScore,
                    proximityScore: proximityScore,
                    usageScore: usageScore
                };
            }).sort((a, b) => b.usageScore - a.usageScore);
            
            // Deprecated HTML Tags Test
            const deprecatedTags = [];
            SEO_CONSTANTS.DEPRECATED_TAGS.forEach(tagName => {
                const tags = $temp.find(tagName);
                if (tags.length > 0) {
                    deprecatedTags.push({
                        tag: tagName,
                        count: tags.length
                    });
                }
            });
            
            // Images analysis (enhanced with optimization checks)
            let imagesWithAlt = 0;
            let imagesWithoutAlt = 0;
            let imagesWithTitle = 0;
            let imagesOptimized = 0;
            let responsiveImages = 0;
            let imagesWithLazyLoading = 0;
            let imagesWithModernFormat = 0;
            let oversizedImages = 0;
            const imageDetails = [];
            
            images.each(function() {
                const $img = $(this);
                const alt = $img.attr('alt') || '';
                const title = $img.attr('title') || '';
                // Use original src if available (from data-original-src), otherwise use current src
                // This prevents 404 errors while still allowing analysis
                const src = $img.attr('data-original-src') || $img.attr('src') || '';
                const srcset = $img.attr('srcset') || '';
                const sizes = $img.attr('sizes') || '';
                const width = parseInt($img.attr('width')) || parseInt($img.css('width')) || 0;
                const height = parseInt($img.attr('height')) || parseInt($img.css('height')) || 0;
                const loading = $img.attr('loading') || '';
                const decoding = $img.attr('decoding') || '';
                
                if (alt) {
                    imagesWithAlt++;
                } else {
                    imagesWithoutAlt++;
                }
                
                if (title) imagesWithTitle++;
                
                // Check if image is responsive (has srcset or sizes attribute)
                if (srcset || sizes) {
                    responsiveImages++;
                }
                
                // Check lazy loading
                if (loading === 'lazy' || $img.attr('data-src')) {
                    imagesWithLazyLoading++;
                }
                
                // Check for modern image formats (WebP, AVIF)
                const srcLower = src.toLowerCase();
                if (srcLower.includes('.webp') || srcLower.includes('.avif') || 
                    (srcset && (srcset.includes('.webp') || srcset.includes('.avif')))) {
                    imagesWithModernFormat++;
                }
                
                // Check if image dimensions are reasonable
                // Flag images that are likely too large (width > 2000px or height > 2000px)
                if (width > 2000 || height > 2000) {
                    oversizedImages++;
                }
                
                // Check if image filename is descriptive
                const filename = src.split('/').pop().split('?')[0];
                const isDescriptive = filename && /[a-z0-9-]+/i.test(filename) && !/^(image|img|photo|pic|untitled)/i.test(filename);
                if (isDescriptive && alt) imagesOptimized++;
                
                imageDetails.push({
                    src: src,
                    alt: alt,
                    title: title,
                    width: width,
                    height: height,
                    hasAlt: !!alt,
                    hasTitle: !!title,
                    isResponsive: !!(srcset || sizes),
                    hasLazyLoading: loading === 'lazy' || !!$img.attr('data-src'),
                    isModernFormat: srcLower.includes('.webp') || srcLower.includes('.avif'),
                    isOptimized: isDescriptive && !!alt,
                    isOversized: width > 2000 || height > 2000
                });
            });
            
            // Links analysis (enhanced with internal linking structure)
            let internalLinks = 0;
            let externalLinks = 0;
            let noFollowLinks = 0;
            let noOpenerLinks = 0;
            let linksWithTitle = 0;
            let emptyLinks = 0;
            let internalLinksWithParams = 0;
            let unsafeCrossOriginLinks = 0;
            const linkDetails = [];
            const internalLinksWithDynamicParams = [];
            const unsafeLinks = [];
            const internalLinkAnchors = [];
            const anchorTextAnalysis = {
                exactMatch: 0,
                partialMatch: 0,
                generic: 0,
                overOptimized: []
            };
            
            // Get current page hostname for comparison
            let currentHostname = '';
            try {
                currentHostname = new URL(url || window.location.href).hostname;
            } catch(e) {
                currentHostname = window.location.hostname;
            }
            
            links.each(function() {
                const $link = $(this);
                const href = $link.attr('href') || '';
                const rel = $link.attr('rel') || '';
                const title = $link.attr('title') || '';
                const text = $link.text().trim();
                
                if (!href || href === '#' || href === 'javascript:void(0)') {
                    emptyLinks++;
                }
                
                if (rel.includes('nofollow')) noFollowLinks++;
                if (rel.includes('noopener') || rel.includes('noreferrer')) noOpenerLinks++;
                if (title) linksWithTitle++;
                
                // Check for unsafe cross-origin links (target="_blank" without noopener/noreferrer)
                const target = $link.attr('target');
                if (target === '_blank' && !rel.includes('noopener') && !rel.includes('noreferrer')) {
                    unsafeCrossOriginLinks++;
                    unsafeLinks.push({
                        href: href,
                        text: text || href,
                        issue: 'Thiếu rel="noopener" hoặc rel="noreferrer"'
                    });
                }
                
                let linkType = 'internal';
                let isInternal = false;
                
                if (href.startsWith('http://') || href.startsWith('https://')) {
                    try {
                        const linkUrl = new URL(href);
                        if (linkUrl.hostname === currentHostname || linkUrl.hostname.replace(/^www\./, '') === currentHostname.replace(/^www\./, '')) {
                            linkType = 'internal';
                            isInternal = true;
                            internalLinks++;
                            
                            // Analyze anchor text for internal links
                            if (text && text.trim()) {
                                const anchorText = text.trim().toLowerCase();
                                internalLinkAnchors.push({
                                    href: href,
                                    anchor: anchorText,
                                    length: anchorText.length
                                });
                                
                                // Check for over-optimization (exact keyword match)
                                const topKeyword = keywordsUsage && keywordsUsage.length > 0 ? keywordsUsage[0].keyword.toLowerCase() : '';
                                if (topKeyword && anchorText === topKeyword) {
                                    anchorTextAnalysis.exactMatch++;
                                    if (anchorTextAnalysis.exactMatch > 3) {
                                        anchorTextAnalysis.overOptimized.push({
                                            href: href,
                                            anchor: anchorText,
                                            issue: 'Exact keyword match (may look like keyword stuffing)'
                                        });
                                    }
                                } else if (topKeyword && anchorText.includes(topKeyword)) {
                                    anchorTextAnalysis.partialMatch++;
                                } else if (/^(click here|read more|here|link|this|page)/i.test(anchorText)) {
                                    anchorTextAnalysis.generic++;
                                }
                            }
                            
                            // Check for dynamic parameters (query strings) in internal links
                            // Only flag if not nofollow (nofollow links can have params)
                            if (linkUrl.search && !rel.includes('nofollow')) {
                                // Check if URL has query parameters (dynamic params)
                                const hasParams = linkUrl.search.length > 1; // More than just '?'
                                if (hasParams) {
                                    internalLinksWithParams++;
                                    internalLinksWithDynamicParams.push({
                                        href: href,
                                        text: text || href,
                                        params: linkUrl.search
                                    });
                                }
                            }
                        } else {
                            linkType = 'external';
                            externalLinks++;
                        }
                    } catch(e) {
                        // Invalid URL
                    }
                } else if (href.startsWith('/') || href.startsWith('#')) {
                    isInternal = true;
                    internalLinks++;
                    
                    // Check for dynamic parameters in relative URLs
                    if (href.includes('?') && !rel.includes('nofollow')) {
                        const paramIndex = href.indexOf('?');
                        if (paramIndex > 0 && href.substring(paramIndex + 1).length > 0) {
                            internalLinksWithParams++;
                            internalLinksWithDynamicParams.push({
                                href: href,
                                text: text || href,
                                params: href.substring(paramIndex)
                            });
                        }
                    }
                }
                
                linkDetails.push({
                    href: href,
                    text: text,
                    title: title,
                    rel: rel,
                    type: linkType
                });
            });
            
            // Calculate SEO score (weighted, TOTAL 100 points INCLUDING PageSpeed)
            // ⚠️ QUAN TRỌNG: Tổng điểm PHẢI luôn là 100 điểm (BAO GỒM cả PageSpeed)
            // Khi thêm/bớt tính năng, PHẢI điều chỉnh lại các điểm số để tổng = 100
            // PageSpeed score (8 points) is part of the total 100 points
            // 
            // Phân bổ điểm hiện tại (tổng = 100, bao gồm PageSpeed):
            // Title: 9 | Meta Desc: 6 | H1: 5 | Content Length: 4 | Images: 4 | Image File Size: 3
            // Keyword: 11 | Headings: 4 | Internal Links: 4 | External Links: 3 | Open Graph: 3
            // Schema: 4 | Mobile Usability: 4 | Canonical: 2 | Readability: 3 | SSL: 4
            // Robots.txt: 2 | Sitemap: 2 | Viewport: 2 | Language: 1 | WWW Issue: 2
            // E-E-A-T: 6 | Breadcrumbs: 2 | Hreflang: 2 | Pagination: 1 | PageSpeed: 8
            // Tổng: 9+6+5+4+4+3+11+4+4+3+3+4+4+2+3+4+2+2+2+1+2+6+2+2+1+8 = 100 điểm
            let score = 0;
            const PAGESPEED_MAX = 8; // PageSpeed is 8 points out of 100
            let maxScore = 100; // Total score is always 100 (including PageSpeed)
            const scoreBreakdown = {};
            
            // 1. Title Tag (9 points) - Critical (reduced from 10 to make total 100 including PageSpeed)
            if (title.length >= 30 && title.length <= 60) {
                score += 9;
                scoreBreakdown.title = { points: 9, max: 9, status: 'good' };
            } else if (title.length > 0 && title.length < 30) {
                score += 4;
                scoreBreakdown.title = { points: 4, max: 9, status: 'warning' };
            } else {
                scoreBreakdown.title = { points: 0, max: 9, status: 'error' };
            }
            
            // 2. Meta Description (6 points) - Critical (reduced from 7 to make total 100 including PageSpeed)
            if (metaDesc.length >= 120 && metaDesc.length <= 160) {
                score += 6;
                scoreBreakdown.metaDesc = { points: 6, max: 6, status: 'good' };
            } else if (metaDesc.length > 0) {
                score += 3;
                scoreBreakdown.metaDesc = { points: 3, max: 6, status: 'warning' };
            } else {
                scoreBreakdown.metaDesc = { points: 0, max: 6, status: 'error' };
            }
            
            // 3. H1 Tag (5 points) - Important (reduced from 6 to balance to 100)
            if (h1Tags.length === 1) {
                score += 5;
                scoreBreakdown.h1 = { points: 5, max: 5, status: 'good' };
            } else if (h1Tags.length > 1) {
                score += 2;
                scoreBreakdown.h1 = { points: 2, max: 5, status: 'warning' };
            } else {
                scoreBreakdown.h1 = { points: 0, max: 5, status: 'error' };
            }
            
            // 4. Content Length (4 points) - Important (reduced from 5 to make total 100 including PageSpeed)
            if (wordCount >= 300 && wordCount <= 2500) {
                score += 4;
                scoreBreakdown.contentLength = { points: 4, max: 4, status: 'good' };
            } else if (wordCount >= 200) {
                score += 2;
                scoreBreakdown.contentLength = { points: 2, max: 4, status: 'warning' };
            } else {
                scoreBreakdown.contentLength = { points: 0, max: 4, status: 'error' };
            }
            
            // 5. Images Optimization (4 points) - Alt text, lazy loading, modern formats (reduced from 5)
            if (images.length > 0) {
                const altPercentage = (imagesWithAlt / images.length) * 100;
                let imageScore = 0;
                if (altPercentage >= 90) imageScore += 3; // Alt text (3 points)
                else if (altPercentage >= 50) imageScore += 1;
                
                // Lazy loading (1 point)
                const lazyLoadingPercent = (imagesWithLazyLoading / images.length) * 100;
                if (lazyLoadingPercent >= 50) imageScore += 1;
                
                // Modern formats (1 point)
                const modernFormatPercent = (imagesWithModernFormat / images.length) * 100;
                if (modernFormatPercent >= 30) imageScore += 1;
                
                score += imageScore;
                scoreBreakdown.images = { points: imageScore, max: 4, status: imageScore >= 3 ? 'good' : (imageScore >= 2 ? 'warning' : 'error') };
            } else {
                scoreBreakdown.images = { points: 0, max: 4, status: 'warning' };
            }
            
            // 5b. Image File Size Optimization (3 points) - NEW
            // Note: Actual file size requires server-side fetch, but we can estimate based on dimensions
            let imageFileSizeScore = 0;
            if (images.length > 0) {
                let optimizedSizeCount = 0;
                let totalImagesChecked = 0;
                
                imageDetails.forEach(function(img) {
                    // Estimate file size based on dimensions and format
                    // Rough estimation: width * height * bytes per pixel
                    const estimatedPixels = img.width * img.height;
                    let estimatedBytes = 0;
                    
                    if (img.isModernFormat) {
                        // WebP/AVIF: ~0.5-1 bytes per pixel
                        estimatedBytes = estimatedPixels * 0.75;
                    } else {
                        // JPEG: ~1-2 bytes per pixel, PNG: ~2-4 bytes per pixel
                        const srcLower = (img.src || '').toLowerCase();
                        if (srcLower.includes('.png')) {
                            estimatedBytes = estimatedPixels * 3; // PNG is larger
                        } else {
                            estimatedBytes = estimatedPixels * 1.5; // JPEG
                        }
                    }
                    
                    // Convert to KB
                    const estimatedKB = estimatedBytes / 1024;
                    
                    // Consider optimized if:
                    // - Under 200KB for small images (< 800px)
                    // - Under 500KB for medium images (800-1500px)
                    // - Under 1MB for large images (> 1500px)
                    const maxDimension = Math.max(img.width, img.height);
                    let isOptimized = false;
                    
                    if (maxDimension < 800) {
                        isOptimized = estimatedKB < 200;
                    } else if (maxDimension < 1500) {
                        isOptimized = estimatedKB < 500;
                    } else {
                        isOptimized = estimatedKB < 1000; // 1MB
                    }
                    
                    // Also check if using modern format (bonus)
                    if (img.isModernFormat && estimatedKB < 500) {
                        isOptimized = true;
                    }
                    
                    // Check if oversized (dimensions > 2000px)
                    if (img.isOversized) {
                        isOptimized = false; // Oversized images are not optimized
                    }
                    
                    totalImagesChecked++;
                    if (isOptimized) optimizedSizeCount++;
                });
                
                if (totalImagesChecked > 0) {
                    const optimizedPercent = (optimizedSizeCount / totalImagesChecked) * 100;
                    if (optimizedPercent >= 70) imageFileSizeScore = 3;
                    else if (optimizedPercent >= 50) imageFileSizeScore = 2;
                    else if (optimizedPercent >= 30) imageFileSizeScore = 1;
                }
            }
            score += imageFileSizeScore;
            scoreBreakdown.imageFileSize = { points: imageFileSizeScore, max: 3, status: imageFileSizeScore >= 2 ? 'good' : (imageFileSizeScore >= 1 ? 'warning' : 'error') };
            
            // 6. Keyword Optimization (11 points) - Enhanced with prominence and proximity (reduced from 12 to make total 100)
            let keywordScore = 0;
            if (keywordAnalysis) {
                // Use explicit focus keyword if provided
                if (keywordAnalysis.inTitle) keywordScore += 3;
                if (keywordAnalysis.inTitleStart) keywordScore += 2;
                if (keywordAnalysis.inMetaDesc) keywordScore += 2;
                if (keywordAnalysis.inH1) keywordScore += 2;
                if (keywordAnalysis.inFirstParagraph) keywordScore += 2;
                // Density check removed to fit max 11 points
            } else if (keywordsUsage && keywordsUsage.length > 0) {
                // Use top keyword from most common keywords (enhanced with prominence/proximity)
                const topKw = keywordsUsage[0];
                if (topKw.inTitle) keywordScore += 3;
                if (topKw.inTitleStart) keywordScore += 1; // Bonus for early position
                if (topKw.inMetaDesc) keywordScore += 2;
                if (topKw.inH1) keywordScore += 2;
                if (topKw.inFirstParagraph) keywordScore += 2;
                if (topKw.density >= 0.5 && topKw.density <= 2.5) keywordScore += 1;
                // inUrl, prominenceScore, proximityScore removed to fit max 11 points
            }
            score += keywordScore;
            scoreBreakdown.keyword = { points: keywordScore, max: 11, status: keywordScore >= 9 ? 'good' : (keywordScore >= 6 ? 'warning' : 'error') };
            
            // 7. Headings Structure (4 points) - Reduced from 5 to make total 100
            let headingScore = 0;
            if (h1Tags.length === 1) headingScore += 2;
            if (h2Tags.length >= 2) headingScore += 2;
            if (h3Tags.length > 0) headingScore += 0; // Removed to fit max 4
            score += headingScore;
            scoreBreakdown.headings = { points: headingScore, max: 4, status: headingScore >= 3 ? 'good' : (headingScore >= 2 ? 'warning' : 'error') };
            
            // 8. Internal Linking (4 points) - Reduced from 5 to make total 100
            if (internalLinks >= 3) {
                score += 4;
                scoreBreakdown.internalLinks = { points: 4, max: 4, status: 'good' };
            } else if (internalLinks > 0) {
                score += 2;
                scoreBreakdown.internalLinks = { points: 2, max: 4, status: 'warning' };
            } else {
                scoreBreakdown.internalLinks = { points: 0, max: 4, status: 'error' };
            }
            
            // 9. External Links (3 points) - Reduced from 4 to 3 to balance scoring
            if (externalLinks > 0 && externalLinks <= 10) {
                score += 3;
                scoreBreakdown.externalLinks = { points: 3, max: 3, status: 'good' };
            } else if (externalLinks > 10) {
                score += 1;
                scoreBreakdown.externalLinks = { points: 1, max: 3, status: 'warning' };
            } else {
                scoreBreakdown.externalLinks = { points: 0, max: 3, status: 'warning' };
            }
            
            // 10. Open Graph Tags (3 points) - Important for social sharing
            let ogScore = 0;
            if (ogTitle) ogScore += 1;
            if (ogDesc) ogScore += 1;
            if (ogImage) ogScore += 1;
            score += ogScore;
            scoreBreakdown.openGraph = { points: ogScore, max: 3, status: ogScore >= 2 ? 'good' : (ogScore >= 1 ? 'warning' : 'error') };
            
            // 10b. Twitter Cards (0 points) - REMOVED from scoring (not a Google ranking factor)
            // Still tracked and displayed for social sharing optimization, but not scored
            const twitterCount = (twitterCard ? 1 : 0) + (twitterTitle || twitterDesc ? 1 : 0);
            scoreBreakdown.twitterCards = { points: 0, max: 0, status: twitterCount >= 2 ? 'good' : (twitterCount >= 1 ? 'warning' : 'error'), niceToHave: true };
            
            // 11. Schema Markup (4 points) - Enhanced with validation (reduced from 5 to make total 100)
            if (schemaValidation && schemaValidation.hasSchema) {
                // Base score for having schema
                let schemaScore = 3;
                if (schemaValidation.validSchemas.length > 0) {
                    schemaScore = schemaValidation.score; // Use validation score (max 10, but we cap at 4)
                    if (schemaScore > 4) schemaScore = 4;
                }
                score += schemaScore;
                scoreBreakdown.schema = { points: schemaScore, max: 4, status: schemaScore >= 3 ? 'good' : (schemaScore >= 2 ? 'warning' : 'error') };
            } else {
                scoreBreakdown.schema = { points: 0, max: 4, status: 'warning' };
            }
            
            // 12. Mobile Usability (4 points)
            const mobileUsability = SEOCheckerHandler.validateMobileUsability($temp);
            let mobileScore = 0;
            if (mobileUsability.viewport.valid) mobileScore += 1;
            if (mobileUsability.touchTargets.valid) mobileScore += 1;
            if (mobileUsability.fontSizes.valid) mobileScore += 1;
            if (mobileUsability.contentWidth.valid) mobileScore += 1;
            score += mobileScore;
            scoreBreakdown.mobileUsability = { points: mobileScore, max: 4, status: mobileScore >= 3 ? 'good' : (mobileScore >= 2 ? 'warning' : 'error') };
            
            // 13. Canonical URL (2 points)
            if (canonical) {
                score += 2;
                scoreBreakdown.canonical = { points: 2, max: 2, status: 'good' };
            } else {
                scoreBreakdown.canonical = { points: 0, max: 2, status: 'warning' };
            }
            
            // 14. Readability (3 points)
            if (readabilityScore >= 60) {
                score += 3;
                scoreBreakdown.readability = { points: 3, max: 3, status: 'good' };
            } else if (readabilityScore >= 40) {
                score += 1;
                scoreBreakdown.readability = { points: 1, max: 3, status: 'warning' };
            } else {
                scoreBreakdown.readability = { points: 0, max: 3, status: 'error' };
            }
            
            // 15. SSL/HTTPS (4 points) - Critical for SEO and security
            // This will be updated in processContent based on actual URL tests
            // For now, check if URL starts with https
            const isHttps = url && url.toLowerCase().startsWith('https://');
            if (isHttps) {
                score += 4;
                scoreBreakdown.ssl = { points: 4, max: 4, status: 'good' };
            } else {
                scoreBreakdown.ssl = { points: 0, max: 4, status: 'error' };
            }
            
            // 16. Robots.txt (2 points) - Important for SEO
            // Will be updated in processContent based on actual check
            scoreBreakdown.robotsTxt = { points: 0, max: 2, status: 'warning' };
            
            // 17. Sitemap (2 points) - Important for SEO
            // Will be updated in processContent based on actual check
            scoreBreakdown.sitemap = { points: 0, max: 2, status: 'warning' };
            
            // 18. Viewport Meta Tag (2 points) - Critical for mobile SEO
            if (viewport) {
                score += 2;
                scoreBreakdown.viewport = { points: 2, max: 2, status: 'good' };
            } else {
                scoreBreakdown.viewport = { points: 0, max: 2, status: 'error' };
            }
            
            // 19. Charset Declaration (0 points) - Nice to have, not a ranking factor
            // Still tracked for recommendations but not scored
            scoreBreakdown.charset = { points: 0, max: 0, status: charset ? 'good' : 'warning', niceToHave: true };
            
            // 20. Language Attribute (1 point) - Important for SEO (KEEP)
            if (lang) {
                score += 1;
                scoreBreakdown.lang = { points: 1, max: 1, status: 'good' };
            } else {
                scoreBreakdown.lang = { points: 0, max: 1, status: 'warning' };
            }
            
            // 21. Favicon (0 points) - Nice to have, not a ranking factor
            // Still tracked for recommendations but not scored
            scoreBreakdown.favicon = { points: 0, max: 0, status: favicon ? 'good' : 'warning', niceToHave: true };
            
            // 22. WWW/Non-WWW Issue (2 points penalty if issue exists)
            // Will be updated in processContent based on actual check
            scoreBreakdown.wwwIssue = { points: 2, max: 2, status: 'good' }; // Default: no issue
            
            // 23. E-E-A-T Signals (6 points) - Critical for SEO (reduced from 8 to balance to 100)
            let eeatScore = 0;
            
            // Check for author information
            const authorSchema = $temp.find('script[type="application/ld+json"]').filter(function() {
                try {
                    const schema = JSON.parse($(this).html());
                    return schema['@type'] === 'Person' || schema['@type'] === 'Author' || 
                           (schema.author && (schema.author['@type'] === 'Person' || schema.author['@type'] === 'Author'));
                } catch(e) {
                    return false;
                }
            });
            if (authorSchema.length > 0) eeatScore += 2; // Author schema found
            
            // Check for publication date and last modified date
            const pubDate = $temp.find('meta[property="article:published_time"], time[datetime], [itemprop="datePublished"]').first();
            const modDate = $temp.find('meta[property="article:modified_time"], time[datetime], [itemprop="dateModified"]').first();
            if (pubDate.length > 0) eeatScore += 1; // Publication date found
            if (modDate.length > 0) eeatScore += 0.5; // Last modified date found (reduced from 1)
            
            // Check for about/contact pages (via links)
            const aboutLinks = links.filter(function() {
                const href = $(this).attr('href') || '';
                const text = $(this).text().toLowerCase();
                return href.toLowerCase().includes('about') || text.includes('về chúng tôi') || text.includes('about us') ||
                       href.toLowerCase().includes('contact') || text.includes('liên hệ') || text.includes('contact us');
            });
            if (aboutLinks.length > 0) eeatScore += 0.5; // About/Contact links found (reduced from 1)
            
            // Check for citations/references (links to authoritative sources)
            const citationLinks = links.filter(function() {
                const href = $(this).attr('href') || '';
                // Check if link points to authoritative domains (edu, gov, org, or well-known sites)
                try {
                    const url = new URL(href, url || window.location.href);
                    const hostname = url.hostname.toLowerCase();
                    return hostname.endsWith('.edu') || hostname.endsWith('.gov') || 
                           hostname.endsWith('.org') || hostname.includes('wikipedia') ||
                           hostname.includes('research') || hostname.includes('study');
                } catch(e) {
                    return false;
                }
            });
            if (citationLinks.length >= 2) eeatScore += 1.5; // Multiple citations found (reduced from 2)
            else if (citationLinks.length === 1) eeatScore += 0.5; // At least one citation (reduced from 1)
            
            // Check for author bio or author information in content
            const authorBio = $temp.find('.author-bio, .author-info, [class*="author"], [id*="author"]');
            if (authorBio.length > 0 && authorBio.text().trim().length > 50) eeatScore += 0.5; // Author bio found (reduced from 1)
            
            // Round to nearest integer for scoring
            eeatScore = Math.round(eeatScore);
            score += eeatScore;
            scoreBreakdown.eeat = { points: eeatScore, max: 6, status: eeatScore >= 5 ? 'good' : (eeatScore >= 3 ? 'warning' : 'error') };
            
            // 24. Breadcrumbs Schema (2 points)
            const breadcrumbSchema = $temp.find('script[type="application/ld+json"]').filter(function() {
                try {
                    const schema = JSON.parse($(this).html());
                    return schema['@type'] === 'BreadcrumbList' || 
                           (Array.isArray(schema) && schema.some(s => s['@type'] === 'BreadcrumbList'));
                } catch(e) {
                    return false;
                }
            });
            const breadcrumbNav = $temp.find('nav[aria-label*="breadcrumb"], .breadcrumb, .breadcrumbs, [class*="breadcrumb"]');
            
            let breadcrumbScore = 0;
            if (breadcrumbSchema.length > 0) {
                breadcrumbScore = 2; // Schema breadcrumbs found
            } else if (breadcrumbNav.length > 0) {
                breadcrumbScore = 1; // HTML breadcrumbs found but no schema
            }
            score += breadcrumbScore;
            scoreBreakdown.breadcrumbs = { points: breadcrumbScore, max: 2, status: breadcrumbScore >= 2 ? 'good' : (breadcrumbScore >= 1 ? 'warning' : 'error') };
            
            // 25. Hreflang Tags (2 points) - Important for multi-language sites
            const hreflangTags = $temp.find('link[rel="alternate"][hreflang]');
            // Check if hreflang includes x-default (best practice) - declare outside if block for use in recommendations
            const hasXDefault = hreflangTags.filter(function() {
                return $(this).attr('hreflang') === 'x-default';
            }).length > 0;
            
            let hreflangScore = 0;
            if (hreflangTags.length > 0) {
                if (hreflangTags.length >= 2 && hasXDefault) {
                    hreflangScore = 2; // Multiple languages with x-default
                } else if (hreflangTags.length >= 2) {
                    hreflangScore = 1; // Multiple languages but no x-default
                } else {
                    hreflangScore = 0.5; // Only one hreflang (might be incomplete)
                }
            }
            score += hreflangScore;
            scoreBreakdown.hreflang = { points: hreflangScore, max: 2, status: hreflangScore >= 1.5 ? 'good' : (hreflangScore >= 0.5 ? 'warning' : 'error') };
            
            // 26. Pagination (rel="next/prev") (1 point)
            const paginationNext = $temp.find('link[rel="next"]');
            const paginationPrev = $temp.find('link[rel="prev"]');
            let paginationScore = 0;
            if (paginationNext.length > 0 || paginationPrev.length > 0) {
                paginationScore = 1; // Pagination found
            }
            score += paginationScore;
            scoreBreakdown.pagination = { points: paginationScore, max: 1, status: paginationScore >= 1 ? 'good' : 'error' };
            
            // Generate prioritized recommendations
            // Format: 
            // - "Đề Xuất Cải Thiện" (critical) - Tăng mạnh xếp hạng Google
            // - "Nên Cải Thiện" (important) - Tăng ít xếp hạng Google  
            // - "Tùy Chọn (Cải thiện thêm)" (optional) - Không tăng xếp hạng Google
            const recommendations = [];
            const critical = []; // Đề Xuất Cải Thiện
            const important = []; // Nên Cải Thiện
            const optional = []; // Tùy Chọn (Cải thiện thêm)
            
            // Critical issues (high priority)
            if (!title || title.length < 30) {
                critical.push({ text: 'Thêm hoặc cải thiện thẻ title (khuyến nghị: 30-60 ký tự)', priority: 'critical' });
            } else if (title.length > 60) {
                critical.push({ text: 'Rút ngắn thẻ title (khuyến nghị: 30-60 ký tự)', priority: 'critical' });
            }
            
            if (!metaDesc || metaDesc.length < 120) {
                critical.push({ text: 'Thêm hoặc cải thiện meta description (khuyến nghị: 120-160 ký tự)', priority: 'critical' });
            } else if (metaDesc.length > 160) {
                critical.push({ text: 'Rút ngắn meta description (khuyến nghị: 120-160 ký tự)', priority: 'critical' });
            }
            
            if (h1Tags.length === 0) {
                critical.push({ text: 'Thêm một thẻ H1 cho bài viết', priority: 'critical' });
            } else if (h1Tags.length > 1) {
                critical.push({ text: 'Chỉ nên có một thẻ H1 trong bài viết (hiện có ' + h1Tags.length + ')', priority: 'critical' });
            }
            
            // Keyword recommendations
            const topKeyword = keywordAnalysis ? keywordAnalysis.keyword : (keywordsUsage && keywordsUsage.length > 0 ? keywordsUsage[0].keyword : null);
            const currentKwAnalysis = keywordAnalysis || (keywordsUsage && keywordsUsage.length > 0 ? keywordsUsage[0] : null);
            
            if (currentKwAnalysis && topKeyword) {
                if (!currentKwAnalysis.inTitle) {
                    critical.push({ text: 'Thêm từ khóa chính "' + topKeyword + '" vào thẻ title', priority: 'critical' });
                }
                
                if (currentKwAnalysis.density < 0.5) {
                    critical.push({ text: 'Tăng mật độ từ khóa (hiện tại: ' + currentKwAnalysis.density + '%, khuyến nghị: 0.5-2.5%)', priority: 'critical' });
                } else if (currentKwAnalysis.density > 2.5) {
                    critical.push({ text: 'Giảm mật độ từ khóa (hiện tại: ' + currentKwAnalysis.density + '%, khuyến nghị: 0.5-2.5%)', priority: 'critical' });
                }
                
                if (!currentKwAnalysis.inMetaDesc) {
                    critical.push({ text: 'Thêm từ khóa chính "' + topKeyword + '" vào meta description', priority: 'critical' });
                }
                
                if (!currentKwAnalysis.inH1) {
                    critical.push({ text: 'Thêm từ khóa chính "' + topKeyword + '" vào thẻ H1', priority: 'critical' });
                }
                
                if (!currentKwAnalysis.inFirstParagraph) {
                    important.push({ text: 'Thêm từ khóa chính "' + topKeyword + '" vào đoạn đầu tiên của bài viết', priority: 'important' });
                }
            }
            
            // Critical issues (tăng mạnh xếp hạng Google)
            if (wordCount < 300) {
                critical.push({ text: 'Tăng độ dài bài viết (hiện tại: ' + wordCount + ' từ, khuyến nghị: tối thiểu 300 từ)', priority: 'critical' });
            } else if (wordCount > 2500) {
                important.push({ text: 'Cân nhắc chia nhỏ bài viết (hiện tại: ' + wordCount + ' từ, khuyến nghị: dưới 2500 từ)', priority: 'important' });
            }
            
            if (internalLinks < 3) {
                critical.push({ text: 'Thêm liên kết nội bộ (hiện có ' + internalLinks + ', khuyến nghị: ít nhất 3)', priority: 'critical' });
            }
            
            // Important issues (tăng ít xếp hạng Google)
            if (imagesWithoutAlt > 0) {
                important.push({ text: 'Thêm thuộc tính alt cho ' + imagesWithoutAlt + ' hình ảnh', priority: 'important' });
            }
            
            if (h2Tags.length === 0) {
                important.push({ text: 'Thêm các thẻ H2 để cấu trúc bài viết tốt hơn', priority: 'important' });
            } else if (h2Tags.length < 2) {
                important.push({ text: 'Nên có ít nhất 2-3 thẻ H2 để cấu trúc tốt hơn', priority: 'important' });
            }
            
            if (readabilityScore < 60) {
                important.push({ text: 'Cải thiện độ dễ đọc (điểm: ' + readabilityScore.toFixed(1) + '/100, khuyến nghị: trên 60)', priority: 'important' });
            }
            
            if (!hasSchema) {
                important.push({ text: 'Thêm Schema.org structured data để cải thiện rich snippets', priority: 'important' });
            }
            
            if (!canonical) {
                important.push({ text: 'Thêm canonical URL để tránh duplicate content', priority: 'important' });
            }
            
            // Optional improvements (không tăng xếp hạng Google)
            if (!ogTitle || !ogDesc) {
                optional.push({ text: 'Thêm Open Graph tags (og:title, og:description) để tối ưu chia sẻ mạng xã hội', priority: 'optional' });
            }
            
            if (!ogImage) {
                optional.push({ text: 'Thêm og:image để có hình ảnh khi chia sẻ trên mạng xã hội', priority: 'optional' });
            }
            
            if (externalLinks === 0) {
                optional.push({ text: 'Cân nhắc thêm liên kết ngoài đến các nguồn uy tín', priority: 'optional' });
            }
            
            if (imagesOptimized < images.length * 0.8) {
                optional.push({ text: 'Tối ưu tên file và alt text cho hình ảnh', priority: 'optional' });
            }
            
            // URL Tests recommendations
            // SSL/HTTPS - Critical
            if (!isHttps) {
                critical.push({ text: 'Chuyển sang HTTPS - Đây là yêu cầu bắt buộc cho SEO và bảo mật', priority: 'critical' });
            }
            
            // Viewport - Critical for mobile
            if (!viewport) {
                critical.push({ text: 'Thêm meta viewport tag - Quan trọng cho mobile SEO', priority: 'critical' });
            }
            
            // Robots.txt - Important
            // Note: This will be updated in processContent based on actual check
            // We'll add recommendation there
            
            // Sitemap - Important
            // Note: This will be updated in processContent based on actual check
            
            // Charset - Optional (không tăng xếp hạng)
            if (!charset) {
                optional.push({ text: 'Thêm charset declaration (UTF-8) để đảm bảo hiển thị đúng ký tự', priority: 'optional' });
            }
            
            // Language attribute - Important (tăng ít xếp hạng)
            if (!lang) {
                important.push({ text: 'Thêm lang attribute vào thẻ <html> để Google hiểu ngôn ngữ trang', priority: 'important' });
            }
            
            // Favicon - Optional (không tăng xếp hạng)
            if (!favicon) {
                optional.push({ text: 'Thêm favicon để cải thiện branding và user experience', priority: 'optional' });
            }
            
            // Structured Data Validation recommendations
            if (schemaValidation && schemaValidation.hasSchema) {
                if (schemaValidation.errors.length > 0) {
                    critical.push({ text: 'Sửa lỗi Structured Data: ' + schemaValidation.errors.join(', '), priority: 'critical' });
                }
                if (schemaValidation.conflicts.length > 0) {
                    important.push({ text: 'Giải quyết xung đột Structured Data: ' + schemaValidation.conflicts.map(c => c.message).join(', '), priority: 'important' });
                }
                if (schemaValidation.warnings.length > 0) {
                    important.push({ text: 'Cải thiện Structured Data: ' + schemaValidation.warnings.slice(0, 2).join(', '), priority: 'important' });
                }
            }
            
            // Mobile Usability recommendations (use validation from earlier)
            const mobileUsabilityValidation = SEOCheckerHandler.validateMobileUsability($temp);
            if (mobileUsabilityValidation) {
                if (!mobileUsabilityValidation.viewport.valid) {
                    critical.push({ text: 'Sửa viewport meta tag: ' + mobileUsabilityValidation.viewport.issues.join(', '), priority: 'critical' });
                }
                if (!mobileUsabilityValidation.touchTargets.valid) {
                    important.push({ text: 'Tăng kích thước touch targets (tối thiểu 48x48px) - ' + mobileUsabilityValidation.touchTargets.issues.join(', '), priority: 'important' });
                }
                if (!mobileUsabilityValidation.fontSizes.valid) {
                    important.push({ text: 'Tăng font size (tối thiểu 12px) - ' + mobileUsabilityValidation.fontSizes.issues.join(', '), priority: 'important' });
                }
            }
            
            // Image Optimization recommendations
            if (images.length > 0) {
                if (imagesWithLazyLoading < images.length * 0.5) {
                    optional.push({ text: 'Thêm lazy loading cho hình ảnh để cải thiện tốc độ tải trang', priority: 'optional' });
                }
                if (imagesWithModernFormat < images.length * 0.3) {
                    optional.push({ text: 'Cân nhắc sử dụng định dạng hình ảnh hiện đại (WebP/AVIF) để giảm kích thước file', priority: 'optional' });
                }
                if (oversizedImages > 0) {
                    important.push({ text: 'Tối ưu kích thước hình ảnh: ' + oversizedImages + ' hình có kích thước > 2000px', priority: 'important' });
                }
            }
            
            // Anchor Text Analysis recommendations
            if (anchorTextAnalysis.overOptimized.length > 0) {
                important.push({ text: 'Giảm số lượng anchor text trùng khớp chính xác với từ khóa (có thể bị coi là keyword stuffing)', priority: 'important' });
            }
            if (anchorTextAnalysis.generic > internalLinks * 0.3) {
                optional.push({ text: 'Giảm số lượng anchor text generic (click here, read more) - nên sử dụng anchor text mô tả', priority: 'optional' });
            }
            
            // E-E-A-T recommendations (use local variables, not analysis object)
            const hasAuthorSchema = authorSchema.length > 0;
            const hasAuthorBio = authorBio.length > 0 && authorBio.text().trim().length > 50;
            const hasPubDate = pubDate.length > 0;
            const hasModDate = modDate.length > 0;
            const hasAboutContactLinks = aboutLinks.length > 0;
            const citationLinksCount = citationLinks.length;
            
            if (!hasAuthorSchema && !hasAuthorBio) {
                important.push({ text: 'Thêm thông tin tác giả (Author Schema hoặc Author Bio) để tăng E-E-A-T', priority: 'important' });
            }
            if (!hasPubDate) {
                important.push({ text: 'Thêm ngày xuất bản (publication date) để tăng độ tin cậy nội dung', priority: 'important' });
            }
            if (citationLinksCount < 2) {
                optional.push({ text: 'Thêm citations đến các nguồn uy tín để tăng độ tin cậy (E-E-A-T)', priority: 'optional' });
            }
            
            // Breadcrumbs recommendations (use local variables)
            const hasBreadcrumbSchema = breadcrumbSchema.length > 0;
            const hasBreadcrumbNav = breadcrumbNav.length > 0;
            
            if (!hasBreadcrumbSchema && !hasBreadcrumbNav) {
                optional.push({ text: 'Thêm breadcrumbs với Schema để cải thiện UX và rich snippets', priority: 'optional' });
            } else if (!hasBreadcrumbSchema && hasBreadcrumbNav) {
                important.push({ text: 'Thêm BreadcrumbList Schema cho breadcrumbs hiện có', priority: 'important' });
            }
            
            // Hreflang recommendations (use local variables)
            const hreflangTagsCount = hreflangTags.length;
            
            if (hreflangTagsCount > 0 && !hasXDefault) {
                important.push({ text: 'Thêm hreflang x-default cho trang mặc định', priority: 'important' });
            }
            
            // Pagination recommendations (use local variables)
            const hasPaginationNext = paginationNext.length > 0;
            const hasPaginationPrev = paginationPrev.length > 0;
            
            if (hasPaginationNext && !hasPaginationPrev) {
                optional.push({ text: 'Thêm rel="prev" để hoàn thiện pagination', priority: 'optional' });
            }
            
            // Combine recommendations by priority
            recommendations.push(...critical, ...important, ...optional);
            
            // Record analysis time
            const analysisTime = Date.now();
            
            return {
                score: score,
                maxScore: maxScore, // Total 100 points (including PageSpeed)
                pagespeedMax: PAGESPEED_MAX, // PageSpeed max points (8 out of 100)
                scoreBreakdown: scoreBreakdown,
                title: title,
                metaDesc: metaDesc,
                metaKeywords: metaKeywords,
                canonical: canonical,
                metaRobots: metaRobots,
                viewport: viewport,
                charset: charset,
                lang: lang,
                favicon: favicon,
                ogTitle: ogTitle,
                ogDesc: ogDesc,
                ogImage: ogImage,
                ogUrl: ogUrl,
                twitterCard: twitterCard,
                twitterTitle: twitterTitle,
                twitterDesc: twitterDesc,
                twitterImage: twitterImage,
                twitterSite: twitterSite,
                twitterCreator: twitterCreator,
                hasSchema: hasSchema,
                schemaValidation: schemaValidation,
                mobileUsability: SEOCheckerHandler.validateMobileUsability($temp),
                wordCount: wordCount,
                charCount: charCount,
                charCountNoSpaces: charCountNoSpaces,
                readabilityScore: readabilityScore,
                h1Count: h1Tags.length,
                h2Count: h2Tags.length,
                h3Count: h3Tags.length,
                h4Count: h4Tags.length,
                h1Text: h1Tags.length > 0 ? h1Tags.first().text() : '',
                h2Texts: h2Tags.map(function() { return $(this).text(); }).get(),
                h3Texts: h3Tags.map(function() { return $(this).text(); }).get(),
                imagesCount: images.length,
                imagesWithAlt: imagesWithAlt,
                imagesWithoutAlt: imagesWithoutAlt,
                imagesWithTitle: imagesWithTitle,
                imagesOptimized: imagesOptimized,
                responsiveImages: responsiveImages,
                imagesWithLazyLoading: imagesWithLazyLoading,
                imagesWithModernFormat: imagesWithModernFormat,
                oversizedImages: oversizedImages,
                imageDetails: imageDetails,
                linksCount: links.length,
                internalLinks: internalLinks,
                externalLinks: externalLinks,
                noFollowLinks: noFollowLinks,
                noOpenerLinks: noOpenerLinks,
                linksWithTitle: linksWithTitle,
                emptyLinks: emptyLinks,
                linkDetails: linkDetails,
                internalLinksWithParams: internalLinksWithParams,
                internalLinksWithDynamicParams: internalLinksWithDynamicParams,
                unsafeCrossOriginLinks: unsafeCrossOriginLinks,
                unsafeLinks: unsafeLinks,
                internalLinkAnchors: internalLinkAnchors,
                anchorTextAnalysis: anchorTextAnalysis,
                analysisTime: analysisTime,
                url: url,
                deprecatedTags: deprecatedTags,
                mostCommonKeywords: mostCommonKeywords,
                keywordsUsage: keywordsUsage,
                recommendations: recommendations,
                mainContentSelector: mainContentSelector, // For debugging/info
                // E-E-A-T data
                hasAuthorSchema: authorSchema.length > 0,
                hasPubDate: pubDate.length > 0,
                hasModDate: modDate.length > 0,
                hasAboutContactLinks: aboutLinks.length > 0,
                citationLinksCount: citationLinks.length,
                hasAuthorBio: authorBio.length > 0 && authorBio.text().trim().length > 50,
                // Breadcrumbs data
                hasBreadcrumbSchema: breadcrumbSchema.length > 0,
                hasBreadcrumbNav: breadcrumbNav.length > 0,
                // Hreflang data
                hreflangTagsCount: hreflangTags.length,
                hasXDefault: hreflangTags.filter(function() { return $(this).attr('hreflang') === 'x-default'; }).length > 0,
                // Pagination data
                hasPaginationNext: paginationNext.length > 0,
                hasPaginationPrev: paginationPrev.length > 0,
            };
        },
        
        /**
         * Validate Structured Data (Schema.org JSON-LD)
         * 
         * @param {jQuery} schemaScripts - jQuery collection of schema script tags
         * @return {object} Validation results
         */
        validateStructuredData: function(schemaScripts) {
            const validation = {
                hasSchema: schemaScripts.length > 0,
                validSchemas: [],
                invalidSchemas: [],
                schemaTypes: [],
                conflicts: [],
                errors: [],
                warnings: [],
                score: 0
            };
            
            if (schemaScripts.length === 0) {
                return validation;
            }
            
            const schemaTypeCounts = {};
            
            schemaScripts.each(function() {
                const $script = $(this);
                const content = $script.html();
                
                if (!content || !content.trim()) {
                    validation.invalidSchemas.push({
                        error: 'Empty schema content',
                        content: ''
                    });
                    return;
                }
                
                try {
                    // Parse JSON-LD
                    const schema = JSON.parse(content);
                    
                    // Check for @context
                    if (!schema['@context']) {
                        validation.errors.push('Missing @context in schema');
                        validation.invalidSchemas.push({
                            error: 'Missing @context',
                            content: content.substring(0, 100)
                        });
                        return;
                    }
                    
                    // Check for @type
                    if (!schema['@type']) {
                        validation.errors.push('Missing @type in schema');
                        validation.invalidSchemas.push({
                            error: 'Missing @type',
                            content: content.substring(0, 100)
                        });
                        return;
                    }
                    
                    const schemaType = schema['@type'];
                    validation.schemaTypes.push(schemaType);
                    
                    // Count schema types for conflict detection
                    if (!schemaTypeCounts[schemaType]) {
                        schemaTypeCounts[schemaType] = 0;
                    }
                    schemaTypeCounts[schemaType]++;
                    
                    // Validate required properties based on schema type
                    const requiredProps = SEOCheckerHandler.getSchemaRequiredProperties(schemaType);
                    const missingProps = [];
                    
                    requiredProps.forEach(prop => {
                        if (!schema[prop] && !schema[prop.toLowerCase()]) {
                            missingProps.push(prop);
                        }
                    });
                    
                    if (missingProps.length > 0) {
                        validation.warnings.push(`Schema type "${schemaType}" missing recommended properties: ${missingProps.join(', ')}`);
                    }
                    
                    validation.validSchemas.push({
                        type: schemaType,
                        context: schema['@context'],
                        hasRequiredProps: missingProps.length === 0,
                        missingProps: missingProps
                    });
                    
                } catch (e) {
                    validation.errors.push('Invalid JSON syntax: ' + e.message);
                    validation.invalidSchemas.push({
                        error: 'JSON parse error: ' + e.message,
                        content: content.substring(0, 100)
                    });
                }
            });
            
            // Detect conflicts (multiple schemas of same type)
            Object.keys(schemaTypeCounts).forEach(type => {
                if (schemaTypeCounts[type] > 1) {
                    validation.conflicts.push({
                        type: type,
                        count: schemaTypeCounts[type],
                        message: `Multiple ${type} schemas found (${schemaTypeCounts[type]}). Google recommends one per page.`
                    });
                }
            });
            
            // Calculate score
            if (validation.validSchemas.length > 0) {
                validation.score = 5; // Base score for having schema
                if (validation.errors.length === 0) validation.score += 2; // No errors
                if (validation.warnings.length === 0) validation.score += 2; // No warnings
                if (validation.conflicts.length === 0) validation.score += 1; // No conflicts
            }
            
            return validation;
        },
        
        /**
         * Get required properties for a schema type
         * 
         * @param {string} schemaType - Schema.org type (e.g., 'Article', 'Product')
         * @return {array} Array of required/recommended property names
         */
        getSchemaRequiredProperties: function(schemaType) {
            const properties = {
                'Article': ['headline', 'author', 'datePublished'],
                'BlogPosting': ['headline', 'author', 'datePublished'],
                'NewsArticle': ['headline', 'author', 'datePublished'],
                'Product': ['name', 'description'],
                'Organization': ['name', 'url'],
                'WebSite': ['name', 'url'],
                'BreadcrumbList': ['itemListElement'],
                'FAQPage': ['mainEntity'],
                'HowTo': ['name', 'step'],
                'Recipe': ['name', 'ingredients'],
                'Review': ['itemReviewed', 'reviewBody', 'author'],
                'VideoObject': ['name', 'description', 'thumbnailUrl'],
                'LocalBusiness': ['name', 'address'],
                'Person': ['name']
            };
            
            return properties[schemaType] || ['name', 'description'];
        },
        
        /**
         * Validate Mobile Usability
         * 
         * @param {jQuery} $temp - jQuery object containing parsed HTML
         * @return {object} Mobile usability validation results
         */
        validateMobileUsability: function($temp) {
            const validation = {
                viewport: { exists: false, valid: false, issues: [] },
                touchTargets: { valid: true, issues: [], smallTargets: [] },
                fontSizes: { valid: true, issues: [], smallFonts: [] },
                contentWidth: { valid: true, issues: [] },
                score: 0
            };
            
            // Check viewport
            const viewport = $temp.find('meta[name="viewport"]').attr('content') || '';
            validation.viewport.exists = !!viewport;
            
            if (viewport) {
                // Check for proper viewport configuration
                const hasWidth = viewport.includes('width=') || viewport.includes('width=device-width');
                const hasInitialScale = viewport.includes('initial-scale=');
                
                if (!hasWidth) {
                    validation.viewport.issues.push('Missing width=device-width');
                }
                if (!hasInitialScale) {
                    validation.viewport.issues.push('Missing initial-scale');
                }
                
                // Check for user-scalable=no (bad practice)
                if (viewport.includes('user-scalable=no')) {
                    validation.viewport.issues.push('user-scalable=no prevents zooming (accessibility issue)');
                }
                
                validation.viewport.valid = validation.viewport.issues.length === 0;
            } else {
                validation.viewport.issues.push('Missing viewport meta tag');
            }
            
            // Check touch targets (buttons, links)
            const interactiveElements = $temp.find('a, button, input[type="button"], input[type="submit"], [role="button"]');
            let smallTargetCount = 0;
            
            interactiveElements.each(function() {
                const $el = $(this);
                const width = parseInt($el.css('width')) || parseInt($el.attr('width')) || 0;
                const height = parseInt($el.css('height')) || parseInt($el.attr('height')) || 0;
                const minSize = 48; // Google's minimum touch target size
                
                if (width > 0 && height > 0 && (width < minSize || height < minSize)) {
                    smallTargetCount++;
                    const text = $el.text().substring(0, 30) || $el.attr('aria-label') || 'Element';
                    validation.touchTargets.smallTargets.push({
                        text: text,
                        width: width,
                        height: height,
                        minSize: minSize
                    });
                }
            });
            
            if (smallTargetCount > 0) {
                validation.touchTargets.valid = false;
                validation.touchTargets.issues.push(`Found ${smallTargetCount} touch targets smaller than 48x48px (Google's minimum)`);
            }
            
            // Check font sizes
            const textElements = $temp.find('p, span, div, li, td, th, a, h1, h2, h3, h4, h5, h6');
            let smallFontCount = 0;
            const minFontSize = 12; // Minimum readable font size in px
            
            textElements.each(function() {
                const $el = $(this);
                const fontSize = parseFloat($el.css('font-size')) || 0;
                
                if (fontSize > 0 && fontSize < minFontSize) {
                    smallFontCount++;
                    const text = $el.text().substring(0, 20);
                    validation.fontSizes.smallFonts.push({
                        text: text,
                        fontSize: fontSize + 'px',
                        minSize: minFontSize + 'px'
                    });
                }
            });
            
            if (smallFontCount > 0) {
                validation.fontSizes.valid = false;
                validation.fontSizes.issues.push(`Found ${smallFontCount} text elements with font size smaller than ${minFontSize}px`);
            }
            
            // Check content width (look for fixed widths that might cause horizontal scroll)
            const body = $temp.find('body');
            const bodyWidth = body.css('width') || body.attr('width') || '';
            
            if (bodyWidth && bodyWidth.includes('px')) {
                const widthValue = parseInt(bodyWidth);
                if (widthValue > 0 && widthValue < 320) {
                    validation.contentWidth.valid = false;
                    validation.contentWidth.issues.push(`Body width (${widthValue}px) may be too narrow for mobile devices`);
                }
            }
            
            // Calculate score
            if (validation.viewport.valid) validation.score += 3;
            if (validation.touchTargets.valid) validation.score += 2;
            if (validation.fontSizes.valid) validation.score += 2;
            if (validation.contentWidth.valid) validation.score += 1;
            
            return validation;
        },
        
        /**
         * Perform URL-based tests (robots.txt, sitemap, SSL, etc.)
         */
        performURLTests: function(url, callback) {
            const urlObj = new URL(url);
            const tests = {
                robotsTxt: { status: 'pending', message: '', exists: false },
                sitemap: { status: 'pending', message: '', exists: false },
                ssl: { status: 'pending', message: '', isHttps: false, valid: false }
            };
            
            // Test SSL/HTTPS (immediate, no async needed)
            tests.ssl.isHttps = urlObj.protocol === 'https:';
            if (tests.ssl.isHttps) {
                tests.ssl.status = 'good';
                tests.ssl.message = 'Sử dụng HTTPS';
                tests.ssl.valid = true;
            } else {
                tests.ssl.status = 'error';
                tests.ssl.message = 'Không sử dụng HTTPS';
            }
            
            // robots.txt and sitemap are checked server-side, so just return immediately
            // The server response will have this data
            callback(tests);
        },
        
        /**
         * Estimate syllables in words (improved for Vietnamese and English)
         */
        estimateSyllables: function(words) {
            let totalSyllables = 0;
            let validWords = 0;
            
            words.forEach(function(word) {
                // Remove punctuation
                const cleanWord = word.toLowerCase().replace(/[^\wàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, '');
                
                if (cleanWord.length === 0) return;
                validWords++;
                
                // Check if Vietnamese word (contains Vietnamese characters)
                const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/.test(cleanWord);
                
                if (isVietnamese) {
                    // Vietnamese syllable estimation: count vowel groups
                    // Vietnamese words typically have 1-3 syllables
                    const vowelGroups = cleanWord.match(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđaeiouy]+/g);
                    if (vowelGroups) {
                        totalSyllables += vowelGroups.length;
                    } else {
                        totalSyllables += 1; // Fallback
                    }
                } else {
                    // English syllable estimation (improved)
                    if (cleanWord.length <= 3) {
                        totalSyllables += 1;
                    } else {
                        let word = cleanWord;
                        // Remove silent 'e' at the end
                        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
                        word = word.replace(/^y/, '');
                        // Count vowel groups
                        const matches = word.match(/[aeiouy]{1,2}/g);
                        const syllables = matches ? matches.length : 1;
                        // Minimum 1 syllable
                        totalSyllables += Math.max(1, syllables);
                    }
                }
            });
            
            return validWords > 0 ? totalSyllables / validWords : 0;
        },
        
        /**
         * Calculate Flesch Reading Ease score (improved)
         */
        calculateReadability: function(wordCount, sentenceCount, avgSyllablesPerWord) {
            if (wordCount === 0 || sentenceCount === 0) return 0;
            
            const avgWordsPerSentence = wordCount / sentenceCount;
            
            // Flesch Reading Ease formula
            // Score ranges from 0-100 (higher = easier to read)
            const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
            
            // Clamp to 0-100 range
            return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
        },
        
        displayResults: function(analysis) {
            const $result = $('#seo-checker-result');
            
            // IMPORTANT: Show result container FIRST before clearing/updating content
            if ($result.length === 0) {
                Debug.error('SEO result container not found!');
                return;
            }
            
            $result.show().css('display', 'block'); // Force show
            
            // Clear all dynamic sections first
            $('#seo-recommendations').empty();
            // Don't clear PageSpeed section here - it will be updated separately
            // $('#seo-pagespeed-insights').empty();
            $('#seo-basic-factors').empty();
            $('#seo-content-analysis').empty();
            $('#seo-keyword-analysis').empty();
            $('#seo-headings-structure').empty();
            $('#seo-links-analysis').empty();
            $('#seo-images-analysis').empty();
            $('#seo-url-tests').empty();
            $('#seo-structured-data').empty();
            
            // Display URL info and timestamp
            const currentUrl = analysis.url || $('#seo-url').val() || 'N/A';
            const timestamp = analysis.analysisTime ? new Date(analysis.analysisTime).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN');
            
            $('#seo-current-url').text(currentUrl);
            $('#seo-analysis-timestamp').text(timestamp);
            $('#seo-url-info').show().css('display', 'block');
            $('#seo-action-buttons').show().css('display', 'block');
            
            // Ensure result is visible (in case it was hidden)
            $result.show().css('display', 'block');
            
            // Scroll to results after a short delay to ensure DOM is ready
            setTimeout(function() {
                if ($result.length > 0 && $result.is(':visible')) {
                    $('html, body').animate({ 
                        scrollTop: $result.offset().top - 100 
                    }, 500);
                }
            }, 100);
            
            // Overall score - Display as "score/100" (always 100 including PageSpeed)
            // Before PageSpeed is loaded, show "X/92" with note below
            const pagespeedPoints = (analysis.scoreBreakdown && analysis.scoreBreakdown.pagespeed) ? analysis.scoreBreakdown.pagespeed.points : 0;
            const pagespeedMax = analysis.pagespeedMax || 8;
            const hasPageSpeed = pagespeedPoints > 0 || (analysis.scoreBreakdown && analysis.scoreBreakdown.pagespeed);
            
            let displayScore = analysis.score;
            let displayMax = analysis.maxScore;
            
            if (!hasPageSpeed) {
                // Before PageSpeed is loaded, show base score out of (100 - PageSpeed max)
                displayMax = analysis.maxScore - pagespeedMax;
            } else {
                // After PageSpeed is loaded, show full score out of 100
                displayMax = 100;
            }
            
            const scorePercentage = Math.round((displayScore / displayMax) * 100);
            
            // Update score display - clean format
            const $scoreValue = $('#seo-overall-score');
            $scoreValue.text(displayScore + '/' + displayMax);
            
            // Add note below if PageSpeed not loaded yet
            const $scoreNote = $('#seo-score-note');
            if (!hasPageSpeed) {
                if ($scoreNote.length === 0) {
                    $('.seo-score-circle').after($('<div id="seo-score-note" class="seo-score-note">').text('Điểm mẫu (chưa tính PageSpeed)'));
                } else {
                    $scoreNote.text('Điểm mẫu (chưa tính PageSpeed)');
                }
            } else {
                $scoreNote.remove();
            }
            const $scoreCircle = $('.seo-score-circle');
            $scoreCircle.removeClass('seo-score-excellent seo-score-good seo-score-fair seo-score-poor');
            if (scorePercentage >= 80) {
                $scoreCircle.addClass('seo-score-excellent');
            } else if (scorePercentage >= 60) {
                $scoreCircle.addClass('seo-score-good');
            } else if (scorePercentage >= 40) {
                $scoreCircle.addClass('seo-score-fair');
            } else {
                $scoreCircle.addClass('seo-score-poor');
            }
            
            // 1. RECOMMENDATIONS FIRST (Most Important)
            const $recommendations = $('#seo-recommendations');
            if (analysis.recommendations && analysis.recommendations.length > 0) {
                // Group by priority
                const critical = analysis.recommendations.filter(r => r.priority === 'critical');
                const important = analysis.recommendations.filter(r => r.priority === 'important');
                const optional = analysis.recommendations.filter(r => r.priority === 'optional');
                
                if (critical.length > 0) {
                    $recommendations.append($('<h4 class="seo-recommendation-priority critical">').text('🔴 Đề Xuất Cải Thiện (Tăng mạnh xếp hạng Google)'));
                    critical.forEach(function(rec) {
                        // XSS-safe: Use .text() instead of .html() for user-generated content
                        const $item = $('<div class="seo-recommendation-item seo-critical">');
                        $item.append($('<span>').text('• '));
                        $item.append($('<span>').text(rec.text || ''));
                        $recommendations.append($item);
                    });
                }
                
                if (important.length > 0) {
                    $recommendations.append($('<h4 class="seo-recommendation-priority important">').text('🟡 Nên Cải Thiện (Tăng ít xếp hạng Google)'));
                    important.forEach(function(rec) {
                        // XSS-safe: Use .text() instead of .html() for user-generated content
                        const $item = $('<div class="seo-recommendation-item seo-important">');
                        $item.append($('<span>').text('• '));
                        $item.append($('<span>').text(rec.text || ''));
                        $recommendations.append($item);
                    });
                }
                
                if (optional.length > 0) {
                    $recommendations.append($('<h4 class="seo-recommendation-priority optional">').text('🟢 Tùy Chọn (Cải thiện thêm) - Không tăng xếp hạng Google'));
                    optional.forEach(function(rec) {
                        // XSS-safe: Use .text() instead of .html() for user-generated content
                        const $item = $('<div class="seo-recommendation-item seo-optional">');
                        $item.append($('<span>').text('• '));
                        $item.append($('<span>').text(rec.text || ''));
                        $recommendations.append($item);
                    });
                }
            } else {
                $recommendations.append($('<div class="seo-recommendation-item seo-good">').text('✓ Bài viết của bạn đã được tối ưu tốt!'));
            }
            
            // PageSpeed Insights will be loaded separately after other results are displayed
            // See loadPageSpeedInsights() method
            
            // Basic factors with progress bars
            const $basicFactors = $('#seo-basic-factors');
            $basicFactors.empty();
            
            const factorMap = {
                'title': { name: 'Title Tag', icon: '📝' },
                'metaDesc': { name: 'Meta Description', icon: '📄' },
                'h1': { name: 'H1 Tags', icon: 'H1' },
                'contentLength': { name: 'Độ Dài Nội Dung', icon: '📊' },
                'images': { name: 'Tối Ưu Hình Ảnh', icon: '🖼️' },
                'imageFileSize': { name: 'Kích Thước File Hình Ảnh', icon: '💾' },
                'keyword': { name: 'Tối Ưu Từ Khóa', icon: '🔑' },
                'headings': { name: 'Cấu Trúc Heading', icon: '📑' },
                'internalLinks': { name: 'Liên Kết Nội Bộ', icon: '🔗' },
                'externalLinks': { name: 'Liên Kết Ngoài', icon: '🌐' },
                'openGraph': { name: 'Open Graph Tags', icon: '📱' },
                'schema': { name: 'Schema Markup', icon: '🏷️' },
                'breadcrumbs': { name: 'Breadcrumbs Schema', icon: '🍞' },
                'eeat': { name: 'E-E-A-T Signals', icon: '⭐' },
                'canonical': { name: 'Canonical URL', icon: '🔖' },
                'readability': { name: 'Độ Dễ Đọc', icon: '📖' },
                'ssl': { name: 'SSL/HTTPS', icon: '🔒' },
                'robotsTxt': { name: 'Robots.txt', icon: '🤖' },
                'sitemap': { name: 'Sitemap.xml', icon: '🗺️' },
                'viewport': { name: 'Meta Viewport', icon: '📱' },
                'charset': { name: 'Charset', icon: '🔤', niceToHave: true },
                'lang': { name: 'Language Attribute', icon: '🌐' },
                'favicon': { name: 'Favicon', icon: '⭐', niceToHave: true },
                'hreflang': { name: 'Hreflang Tags', icon: '🌍' },
                'pagination': { name: 'Pagination', icon: '📄' },
                'wwwIssue': { name: 'WWW/Non-WWW', icon: '🌍' },
                'mobileUsability': { name: 'Mobile Usability', icon: '📱' },
                'pagespeed': { name: 'Core Web Vitals', icon: '⚡' }
            };
            
            // Mapping factor keys to section IDs for navigation
            const factorToSectionMap = {
                'title': 'seo-content-analysis',
                'metaDesc': 'seo-content-analysis',
                'h1': 'seo-headings-structure',
                'contentLength': 'seo-content-analysis',
                'readability': 'seo-content-analysis',
                'images': 'seo-images-analysis',
                'imageFileSize': 'seo-images-analysis',
                'keyword': 'seo-keyword-section',
                'headings': 'seo-headings-structure',
                'internalLinks': 'seo-links-analysis',
                'externalLinks': 'seo-links-analysis',
                'pagination': 'seo-links-analysis',
                'openGraph': 'seo-structured-data',
                'schema': 'seo-structured-data',
                'breadcrumbs': 'seo-structured-data',
                'eeat': 'seo-structured-data',
                'canonical': 'seo-url-tests',
                'ssl': 'seo-url-tests',
                'robotsTxt': 'seo-url-tests',
                'sitemap': 'seo-url-tests',
                'viewport': 'seo-url-tests',
                'charset': 'seo-url-tests',
                'lang': 'seo-url-tests',
                'favicon': 'seo-url-tests',
                'hreflang': 'seo-structured-data',
                'wwwIssue': 'seo-url-tests',
                'mobileUsability': 'seo-mobile-usability',
                'pagespeed': 'seo-pagespeed-insights'
            };
            
            // Display summary factors - extracted to reusable function
            SEOCheckerHandler.displaySummaryFactors(analysis);
        },
        
        /**
         * Display summary factors (Nhận Xét Chung) - reusable function
         */
        displaySummaryFactors: function(analysis) {
            const $basicFactors = $('#seo-basic-factors');
            if ($basicFactors.length === 0) {
                Debug.warn('Summary factors container not found');
                return;
            }
            
            $basicFactors.empty();
            
            const factorMap = {
                'title': { name: 'Title Tag', icon: '📝' },
                'metaDesc': { name: 'Meta Description', icon: '📄' },
                'h1': { name: 'H1 Tags', icon: 'H1' },
                'contentLength': { name: 'Độ Dài Nội Dung', icon: '📊' },
                'images': { name: 'Tối Ưu Hình Ảnh', icon: '🖼️' },
                'imageFileSize': { name: 'Kích Thước File Hình Ảnh', icon: '💾' },
                'keyword': { name: 'Tối Ưu Từ Khóa', icon: '🔑' },
                'headings': { name: 'Cấu Trúc Heading', icon: '📑' },
                'internalLinks': { name: 'Liên Kết Nội Bộ', icon: '🔗' },
                'externalLinks': { name: 'Liên Kết Ngoài', icon: '🌐' },
                'openGraph': { name: 'Open Graph Tags', icon: '📱' },
                'schema': { name: 'Schema Markup', icon: '🏷️' },
                'breadcrumbs': { name: 'Breadcrumbs Schema', icon: '🍞' },
                'eeat': { name: 'E-E-A-T Signals', icon: '⭐' },
                'canonical': { name: 'Canonical URL', icon: '🔖' },
                'readability': { name: 'Độ Dễ Đọc', icon: '📖' },
                'ssl': { name: 'SSL/HTTPS', icon: '🔒' },
                'robotsTxt': { name: 'Robots.txt', icon: '🤖' },
                'sitemap': { name: 'Sitemap.xml', icon: '🗺️' },
                'viewport': { name: 'Meta Viewport', icon: '📱' },
                'charset': { name: 'Charset', icon: '🔤', niceToHave: true },
                'lang': { name: 'Language Attribute', icon: '🌐' },
                'favicon': { name: 'Favicon', icon: '⭐', niceToHave: true },
                'hreflang': { name: 'Hreflang Tags', icon: '🌍' },
                'pagination': { name: 'Pagination', icon: '📄' },
                'wwwIssue': { name: 'WWW/Non-WWW', icon: '🌍' },
                'mobileUsability': { name: 'Mobile Usability', icon: '📱' },
                'pagespeed': { name: 'Core Web Vitals', icon: '⚡' }
            };
            
            const factorToSectionMap = {
                'title': 'seo-content-analysis',
                'metaDesc': 'seo-content-analysis',
                'h1': 'seo-headings-structure',
                'contentLength': 'seo-content-analysis',
                'readability': 'seo-content-analysis',
                'images': 'seo-images-analysis',
                'imageFileSize': 'seo-images-analysis',
                'keyword': 'seo-keyword-section',
                'headings': 'seo-headings-structure',
                'internalLinks': 'seo-links-analysis',
                'externalLinks': 'seo-links-analysis',
                'pagination': 'seo-links-analysis',
                'openGraph': 'seo-structured-data',
                'schema': 'seo-structured-data',
                'breadcrumbs': 'seo-structured-data',
                'eeat': 'seo-structured-data',
                'canonical': 'seo-url-tests',
                'ssl': 'seo-url-tests',
                'robotsTxt': 'seo-url-tests',
                'sitemap': 'seo-url-tests',
                'viewport': 'seo-url-tests',
                'charset': 'seo-url-tests',
                'lang': 'seo-url-tests',
                'favicon': 'seo-url-tests',
                'hreflang': 'seo-structured-data',
                'wwwIssue': 'seo-url-tests',
                'mobileUsability': 'seo-mobile-usability',
                'pagespeed': 'seo-pagespeed-insights'
            };
            
            // Display individual factors (not grouped) for clearer layout
            const self = this;
            Object.keys(analysis.scoreBreakdown || {}).forEach(function(key) {
                const breakdown = analysis.scoreBreakdown[key];
                // Skip nice-to-have items (max = 0) or invalid breakdowns
                if (!breakdown || (breakdown.max === 0 && breakdown.niceToHave)) return;
                if (breakdown.max === 0 && !breakdown.niceToHave) return;
                
                const factorInfo = factorMap[key] || { name: key, icon: '•' };
                const percentage = breakdown.max > 0 ? Math.round((breakdown.points / breakdown.max) * 100) : 0;
                
                try {
                    const detail = self.getFactorDetail(key, analysis, breakdown);
                    
                    // Get target section for navigation
                    const targetSection = factorToSectionMap[key] || null;
                    
                    // Create factor item
                    const $factor = $('<div>').addClass('seo-factor-item');
                    
                    // Add click handler if target section exists
                    if (targetSection) {
                        $factor.addClass('seo-factor-clickable');
                        $factor.css('cursor', 'pointer');
                        $factor.attr('data-target-section', targetSection);
                        $factor.attr('role', 'button');
                        $factor.attr('tabindex', '0');
                        $factor.attr('aria-label', 'Click để xem chi tiết ' + factorInfo.name);
                    }
                    
                    const $header = $('<div>').addClass('seo-factor-header');
                    $header.append($('<span>').addClass('seo-factor-icon').text(factorInfo.icon));
                    $header.append($('<span>').addClass('seo-factor-name').text(factorInfo.name));
                    
                    const statusIcon = breakdown.status === 'good' ? '✓' : (breakdown.status === 'warning' ? '⚠' : '✗');
                    const $status = $('<span>').addClass('seo-factor-status seo-status-' + breakdown.status).text(statusIcon);
                    $header.append($status);
                    $header.append($('<span>').addClass('seo-factor-score').text(breakdown.points + '/' + breakdown.max));
                    
                    // Add navigation icon if clickable
                    if (targetSection) {
                        $header.append($('<span>').addClass('seo-factor-nav-icon').html('→').attr('aria-hidden', 'true'));
                    }
                    
                    const $progressBar = $('<div>').addClass('seo-progress-bar');
                    const $progressFill = $('<div>')
                        .addClass('seo-progress-fill seo-progress-' + breakdown.status)
                        .css('width', percentage + '%')
                        .attr('data-percentage', percentage + '%');
                    $progressBar.append($progressFill);
                    
                    const $detail = $('<div>').addClass('seo-factor-detail').text(detail);
                    
                    $factor.append($header).append($progressBar).append($detail);
                    $basicFactors.append($factor);
                } catch(e) {
                    Debug.error('Error displaying factor:', key, e);
                }
            });
            
            // Add click handlers for factor items (delegated event)
            $(document).off('click', '.seo-factor-clickable').on('click', '.seo-factor-clickable', function(e) {
                e.preventDefault();
                const $factor = $(this);
                const targetSection = $factor.attr('data-target-section');
                if (targetSection) {
                    SEOCheckerHandler.scrollToSection(targetSection);
                }
            });
            
            // Add keyboard support (Enter and Space keys)
            $(document).off('keydown', '.seo-factor-clickable').on('keydown', '.seo-factor-clickable', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const $factor = $(this);
                    const targetSection = $factor.attr('data-target-section');
                    if (targetSection) {
                        SEOCheckerHandler.scrollToSection(targetSection);
                    }
                }
            });
            
            // Content analysis (enhanced with benchmarks)
            const $contentAnalysis = $('#seo-content-analysis');
            $contentAnalysis.empty();
            
            // Add explanation header
            $contentAnalysis.append($('<div class="seo-explanation-box">').html(
                '<strong>📊 Giải thích:</strong> Nội dung dài và dễ đọc thường xếp hạng tốt hơn trên Google. ' +
                'Nội dung từ 300-2500 từ được coi là tối ưu cho hầu hết các bài viết.'
            ));
            
            const wordCount = analysis.wordCount || 0;
            let wordStatus = '';
            let wordStatusClass = '';
            if (wordCount >= 300 && wordCount <= 2500) {
                wordStatus = '✅ Tốt';
                wordStatusClass = 'seo-good';
            } else if (wordCount >= 200 && wordCount < 300) {
                wordStatus = '⚠️ Hơi ngắn';
                wordStatusClass = 'seo-warning';
            } else if (wordCount > 2500) {
                wordStatus = '⚠️ Quá dài';
                wordStatusClass = 'seo-warning';
            } else {
                wordStatus = '❌ Quá ngắn';
                wordStatusClass = 'seo-error';
            }
            
            $contentAnalysis.append($('<div class="seo-stat-item ' + wordStatusClass + '">').html(
                '<strong>Số từ:</strong> ' + NumberFormatter.format(wordCount) + ' | ' + wordStatus + 
                ' | <span class="seo-benchmark">Chuẩn: 300-2500 từ</span>'
            ));
            
            $contentAnalysis.append($('<div class="seo-stat-item">').html(
                '<strong>Số ký tự (có khoảng trắng):</strong> ' + NumberFormatter.format(analysis.charCount || 0)
            ));
            $contentAnalysis.append($('<div class="seo-stat-item">').html(
                '<strong>Số ký tự (không khoảng trắng):</strong> ' + NumberFormatter.format(analysis.charCountNoSpaces || 0)
            ));
            
            if (analysis.readabilityScore !== undefined && analysis.readabilityScore !== null) {
                const readability = analysis.readabilityScore;
                let readabilityLabel = '';
                let readabilityStatusClass = '';
                if (readability >= 60) {
                    readabilityLabel = '✅ Dễ đọc';
                    readabilityStatusClass = 'seo-good';
                } else if (readability >= 40) {
                    readabilityLabel = '⚠️ Trung bình';
                    readabilityStatusClass = 'seo-warning';
                } else {
                    readabilityLabel = '❌ Khó đọc';
                    readabilityStatusClass = 'seo-error';
                }
                $contentAnalysis.append($('<div class="seo-stat-item ' + readabilityStatusClass + '">').html(
                    '<strong>Độ dễ đọc (Flesch Reading Ease):</strong> ' + readability.toFixed(1) + '/100 | ' + readabilityLabel + 
                    ' | <span class="seo-benchmark">Chuẩn: ≥60 điểm</span> | ' +
                    '<span class="seo-tip">Mẹo: Sử dụng câu ngắn, từ đơn giản để tăng điểm</span>'
                ));
            }
            
            // 3. Keyword Analysis (Fixed with explanations)
            if (analysis.mostCommonKeywords && analysis.mostCommonKeywords.length > 0) {
                $('#seo-keyword-section').show();
                const $keywordAnalysis = $('#seo-keyword-analysis');
                $keywordAnalysis.empty();
                
                // Add explanation header
                $keywordAnalysis.append($('<div class="seo-explanation-box">').html(
                    '<strong>🔑 Giải thích:</strong> Mật độ từ khóa lý tưởng là 0.5-2.5%. ' +
                    'Từ khóa nên xuất hiện trong Title, Meta Description, H1, và đoạn đầu tiên để tối ưu SEO.'
                ));
                
                // Most Common Keywords
                $keywordAnalysis.append($('<h4>').text('🔍 Từ Khóa Phổ Biến Nhất'));
                const $keywordsList = $('<div>').addClass('seo-keywords-list');
                analysis.mostCommonKeywords.slice(0, 10).forEach(function(kw) {
                    const density = parseFloat(kw.density);
                    let densityStatus = '';
                    let densityClass = '';
                    if (density >= 0.5 && density <= 2.5) {
                        densityStatus = '✅ Tốt';
                        densityClass = 'seo-good';
                    } else if (density < 0.5) {
                        densityStatus = '⚠️ Thấp';
                        densityClass = 'seo-warning';
                    } else {
                        densityStatus = '⚠️ Cao (có thể spam)';
                        densityClass = 'seo-warning';
                    }
                    // XSS-safe: Build HTML safely
                    const $kwItem = $('<div class="seo-stat-item ' + densityClass + '">');
                    $kwItem.append($('<strong>').text(kw.word + ':'));
                    $kwItem.append(document.createTextNode(' ' + kw.count + ' lần | Mật độ: ' + density.toFixed(2) + '% | ' + densityStatus));
                    $kwItem.append($('<span class="seo-benchmark">').text(' Chuẩn: 0.5-2.5%'));
                    $keywordsList.append($kwItem);
                });
                $keywordAnalysis.append($keywordsList);
                
                // Keywords Usage Test
                if (analysis.keywordsUsage && analysis.keywordsUsage.length > 0) {
                    $keywordAnalysis.append($('<h4>').css('margin-top', '1.5rem').text('📊 Phân Tích Sử Dụng Từ Khóa'));
                    const $usageList = $('<div>').addClass('seo-usage-list');
                    analysis.keywordsUsage.slice(0, 5).forEach(function(usage) {
                        const usageDetails = [];
                        if (usage.inTitle) usageDetails.push('Title');
                        if (usage.inMetaDesc) usageDetails.push('Meta Description');
                        if (usage.inH1) usageDetails.push('H1');
                        if (usage.inUrl) usageDetails.push('URL');
                        if (usage.inFirstParagraph) usageDetails.push('Đoạn đầu');
                        
                        const usageScore = usage.usageScore || 0;
                        const usageStatus = usageScore >= 6 ? 'good' : (usageScore >= 3 ? 'warning' : 'error');
                        
                        // XSS-safe: Build HTML safely
                        const $usageItem = $('<div class="seo-stat-item seo-' + usageStatus + '">');
                        $usageItem.append($('<strong>').text(usage.keyword + ':'));
                        $usageItem.append(document.createTextNode(' Xuất hiện '));
                        $usageItem.append($('<strong>').text(usage.count));
                        $usageItem.append(document.createTextNode(' lần, Mật độ: '));
                        $usageItem.append($('<strong>').text(parseFloat(usage.density).toFixed(2) + '%'));
                        $usageItem.append(document.createTextNode(', Điểm sử dụng: '));
                        $usageItem.append($('<strong>').text(usageScore + '/8'));
                        
                        if (usageDetails.length > 0) {
                            const $details = $('<small>').css({
                                'color': '#059669',
                                'margin-top': '0.5rem',
                                'display': 'block'
                            }).text('✓ Có trong: ' + usageDetails.join(', '));
                            $usageItem.append($('<br>')).append($details);
                        } else {
                            const $details = $('<small>').css({
                                'color': '#dc2626',
                                'margin-top': '0.5rem',
                                'display': 'block'
                            }).text('✗ Chưa được sử dụng tối ưu - nên thêm vào Title, Meta Description, hoặc H1');
                            $usageItem.append($('<br>')).append($details);
                        }
                        
                        $usageList.append($usageItem);
                    });
                    $keywordAnalysis.append($usageList);
                }
            } else {
                $('#seo-keyword-section').hide();
            }
            
            // Headings structure (enhanced with explanations)
            const $headings = $('#seo-headings-structure');
            $headings.empty();
            
            // Add explanation header
            $headings.append($('<div class="seo-explanation-box">').html(
                '<strong>📑 Giải thích:</strong> Mỗi trang nên có đúng 1 thẻ H1 chứa từ khóa chính. ' +
                'Nên có ít nhất 2-3 thẻ H2 để cấu trúc nội dung. Cấu trúc heading giúp Google hiểu nội dung tốt hơn.'
            ));
            
            const h1Count = analysis.h1Count || 0;
            const h2Count = analysis.h2Count || 0;
            const h3Count = analysis.h3Count || 0;
            
            // Summary stats
            let headingStatus = '';
            let headingStatusClass = '';
            if (h1Count === 1 && h2Count >= 2) {
                headingStatus = '✅ Tốt';
                headingStatusClass = 'seo-good';
            } else if (h1Count === 1) {
                headingStatus = '⚠️ Thiếu H2';
                headingStatusClass = 'seo-warning';
            } else if (h1Count === 0) {
                headingStatus = '❌ Chưa có H1';
                headingStatusClass = 'seo-error';
            } else {
                headingStatus = '⚠️ Nhiều H1';
                headingStatusClass = 'seo-warning';
            }
            
            $headings.append($('<div class="seo-stat-item ' + headingStatusClass + '">').html(
                '<strong>Tổng quan:</strong> H1: ' + h1Count + ', H2: ' + h2Count + ', H3: ' + h3Count + ' | ' + headingStatus + 
                ' | <span class="seo-benchmark">Chuẩn: 1 H1, ≥2 H2</span>'
            ));
            
            // Detailed headings (XSS-safe: escape user content)
            if (analysis.h1Text) {
                const $h1Item = $('<div class="seo-heading-item seo-h1">');
                $h1Item.append($('<strong>').text('H1: '));
                $h1Item.append(document.createTextNode(' '));
                $h1Item.append($('<span>').text(analysis.h1Text));
                $headings.append($h1Item);
            }
            if (analysis.h2Texts && analysis.h2Texts.length > 0) {
                analysis.h2Texts.forEach(function(h2) {
                    const $h2Item = $('<div class="seo-heading-item seo-h2">');
                    $h2Item.append($('<strong>').text('H2: '));
                    $h2Item.append(document.createTextNode(' '));
                    $h2Item.append($('<span>').text(h2));
                    $headings.append($h2Item);
                });
            }
            if ((!analysis.h2Texts || analysis.h2Texts.length === 0) && !analysis.h1Text) {
                $headings.append($('<div class="seo-heading-item seo-error">').html(
                    '❌ Không tìm thấy heading tags | <span class="seo-tip">Cần thêm H1 và H2 để cấu trúc nội dung</span>'
                ));
            }
            
            // Links analysis (enhanced with benchmarks)
            const $links = $('#seo-links-analysis');
            $links.empty();
            
            // Add explanation header
            $links.append($('<div class="seo-explanation-box">').html(
                '<strong>🔗 Giải thích:</strong> Liên kết nội bộ giúp phân phối PageRank và giúp người dùng điều hướng. ' +
                'Liên kết ngoài đến nguồn uy tín tăng độ tin cậy. Nên có ít nhất 3 liên kết nội bộ.'
            ));
            
            // XSS-safe: Build HTML safely
            const $linksCount = $('<div class="seo-stat-item">');
            $linksCount.append($('<strong>').text('Tổng số liên kết:'));
            $linksCount.append(document.createTextNode(' ' + (analysis.linksCount || 0)));
            $links.append($linksCount);
            
            const intLinks = analysis.internalLinks || 0;
            let intStatus = '';
            let intStatusClass = '';
            if (intLinks >= 3) {
                intStatus = '✅ Tốt';
                intStatusClass = 'seo-good';
            } else if (intLinks > 0) {
                intStatus = '⚠️ Cần thêm';
                intStatusClass = 'seo-warning';
            } else {
                intStatus = '❌ Chưa có';
                intStatusClass = 'seo-error';
            }
            
            $links.append($('<div class="seo-stat-item ' + intStatusClass + '">').html(
                '<strong>Liên kết nội bộ:</strong> ' + intLinks + ' | ' + intStatus + 
                ' | <span class="seo-benchmark">Chuẩn: ≥3 liên kết</span>'
            ));
            
            const extLinks = analysis.externalLinks || 0;
            let extStatus = '';
            let extStatusClass = '';
            if (extLinks > 0 && extLinks <= 10) {
                extStatus = '✅ Tốt';
                extStatusClass = 'seo-good';
            } else if (extLinks > 10) {
                extStatus = '⚠️ Quá nhiều';
                extStatusClass = 'seo-warning';
            } else {
                extStatus = '⚠️ Chưa có';
                extStatusClass = 'seo-warning';
            }
            
            $links.append($('<div class="seo-stat-item ' + extStatusClass + '">').html(
                '<strong>Liên kết ngoài:</strong> ' + extLinks + ' | ' + extStatus + 
                ' | <span class="seo-benchmark">Chuẩn: 1-10 liên kết</span> | ' +
                '<span class="seo-tip">Mẹo: Liên kết đến nguồn uy tín, có liên quan</span>'
            ));
            
            if (analysis.noFollowLinks > 0) {
                $links.append($('<div class="seo-stat-item">').html(
                    '<strong>Liên kết nofollow:</strong> ' + (analysis.noFollowLinks || 0) + 
                    ' | <span class="seo-tip">Nofollow ngăn truyền PageRank, dùng cho liên kết quảng cáo/sponsored</span>'
                ));
            }
            
            // Anchor Text Analysis (NEW)
            if (analysis.anchorTextAnalysis && analysis.internalLinks > 0) {
                const anchor = analysis.anchorTextAnalysis;
                const totalInternal = analysis.internalLinks || 0;
                
                const exactPercent = Math.round((anchor.exactMatch / totalInternal) * 100);
                const genericPercent = Math.round((anchor.generic / totalInternal) * 100);
                
                $links.append($('<div class="seo-stat-item" style="margin-top: 1rem;">').html(
                    '<strong>📊 Phân Tích Anchor Text:</strong> Exact match: ' + anchor.exactMatch + 
                    ' (' + exactPercent + '%), Partial: ' + anchor.partialMatch + 
                    ', Generic: ' + anchor.generic + ' (' + genericPercent + '%)'
                ));
                
                if (anchor.overOptimized.length > 0) {
                    $links.append($('<div class="seo-stat-item seo-warning">').html(
                        '⚠️ <strong>Cảnh báo:</strong> ' + anchor.overOptimized.length + 
                        ' anchor text trùng khớp chính xác với từ khóa (có thể bị coi là keyword stuffing)'
                    ));
                }
                
                if (genericPercent > 30) {
                    $links.append($('<div class="seo-stat-item seo-warning">').html(
                        '⚠️ <strong>Anchor text generic:</strong> ' + genericPercent + 
                        '% anchor text là generic (click here, read more) | ' +
                        '<span class="seo-tip">Nên sử dụng anchor text mô tả hơn</span>'
                    ));
                }
            }
            
            // Images analysis (enhanced with benchmarks)
            const $images = $('#seo-images-analysis');
            $images.empty();
            
            // Add explanation header
            $images.append($('<div class="seo-explanation-box">').html(
                '<strong>🖼️ Giải thích:</strong> Alt text giúp Google hiểu nội dung hình ảnh và cải thiện SEO. ' +
                'Tất cả hình ảnh nên có alt text mô tả rõ ràng. Hình ảnh responsive giúp tải nhanh trên mobile.'
            ));
            
            const imgCount = analysis.imagesCount || 0;
            const imgWithAlt = analysis.imagesWithAlt || 0;
            const imgWithoutAlt = analysis.imagesWithoutAlt || 0;
            const altPercent = imgCount > 0 ? Math.round((imgWithAlt / imgCount) * 100) : 0;
            
            $images.append($('<div class="seo-stat-item">').html('<strong>Tổng số hình ảnh:</strong> ' + imgCount));
            
            // Enhanced Image Optimization Metrics
            if (analysis.imagesWithLazyLoading !== undefined) {
                const lazyLoadingPercent = imgCount > 0 ? Math.round((analysis.imagesWithLazyLoading / imgCount) * 100) : 0;
                const lazyStatus = lazyLoadingPercent >= 50 ? '✅' : (lazyLoadingPercent > 0 ? '⚠️' : '❌');
                const lazyStatusClass = lazyLoadingPercent >= 50 ? 'seo-good' : (lazyLoadingPercent > 0 ? 'seo-warning' : 'seo-error');
                $images.append($('<div class="seo-stat-item ' + lazyStatusClass + '">').html(
                    lazyStatus + ' <strong>Lazy Loading:</strong> ' + analysis.imagesWithLazyLoading + '/' + imgCount + 
                    ' (' + lazyLoadingPercent + '%) | <span class="seo-benchmark">Chuẩn: ≥50%</span> | ' +
                    '<span class="seo-tip">Giúp cải thiện tốc độ tải trang</span>'
                ));
            }
            
            if (analysis.imagesWithModernFormat !== undefined) {
                const modernFormatPercent = imgCount > 0 ? Math.round((analysis.imagesWithModernFormat / imgCount) * 100) : 0;
                const formatStatus = modernFormatPercent >= 30 ? '✅' : (modernFormatPercent > 0 ? '⚠️' : '');
                const formatStatusClass = modernFormatPercent >= 30 ? 'seo-good' : (modernFormatPercent > 0 ? 'seo-warning' : '');
                if (formatStatus) {
                    $images.append($('<div class="seo-stat-item ' + formatStatusClass + '">').html(
                        formatStatus + ' <strong>Modern Format (WebP/AVIF):</strong> ' + analysis.imagesWithModernFormat + '/' + imgCount + 
                        ' (' + modernFormatPercent + '%) | <span class="seo-benchmark">Chuẩn: ≥30%</span> | ' +
                        '<span class="seo-tip">Giảm kích thước file, tăng tốc độ tải</span>'
                    ));
                }
            }
            
            if (analysis.oversizedImages !== undefined && analysis.oversizedImages > 0) {
                $images.append($('<div class="seo-stat-item seo-warning">').html(
                    '⚠️ <strong>Hình ảnh quá lớn:</strong> ' + analysis.oversizedImages + ' hình có kích thước > 2000px | ' +
                    '<span class="seo-tip">Nên resize để giảm kích thước file</span>'
                ));
            }
            
            let altStatus = '';
            let altStatusClass = '';
            if (altPercent >= 90) {
                altStatus = '✅ Tốt';
                altStatusClass = 'seo-good';
            } else if (altPercent >= 50) {
                altStatus = '⚠️ Cần cải thiện';
                altStatusClass = 'seo-warning';
            } else if (altPercent > 0) {
                altStatus = '❌ Kém';
                altStatusClass = 'seo-error';
            } else {
                altStatus = '❌ Chưa có';
                altStatusClass = 'seo-error';
            }
            
            $images.append($('<div class="seo-stat-item ' + altStatusClass + '">').html(
                '<strong>Hình ảnh có alt text:</strong> ' + imgWithAlt + '/' + imgCount + ' (' + altPercent + '%) | ' + altStatus + 
                ' | <span class="seo-benchmark">Chuẩn: ≥90%</span>'
            ));
            
            if (imgWithoutAlt > 0) {
                $images.append($('<div class="seo-stat-item seo-error">').html(
                    '<strong>⚠️ Hình ảnh thiếu alt:</strong> ' + imgWithoutAlt + ' hình | ' +
                    '<span class="seo-tip">Cần thêm alt text mô tả cho các hình này</span>'
                ));
            }
            
            if (analysis.imagesWithTitle > 0) {
                $images.append($('<div class="seo-stat-item">').html(
                    '<strong>Hình ảnh có title:</strong> ' + (analysis.imagesWithTitle || 0) + 
                    ' | <span class="seo-tip">Title attribute là tùy chọn, không bắt buộc</span>'
                ));
            }
            
            if (analysis.responsiveImages !== undefined && analysis.imagesCount > 0) {
                const responsivePercent = Math.round((analysis.responsiveImages / analysis.imagesCount) * 100);
                const responsiveStatus = responsivePercent >= 90 ? 'good' : (responsivePercent >= 50 ? 'warning' : 'error');
                $images.append($('<div class="seo-stat-item seo-' + responsiveStatus + '">').html(
                    '<strong>Hình ảnh responsive:</strong> ' + analysis.responsiveImages + '/' + analysis.imagesCount + ' (' + responsivePercent + '%) | ' +
                    '<span class="seo-benchmark">Chuẩn: ≥90%</span> | ' +
                    '<span class="seo-tip">Sử dụng srcset hoặc sizes attribute</span>'
                ));
            } else if (imgCount > 0) {
                $images.append($('<div class="seo-stat-item seo-warning">').html(
                    '<strong>Hình ảnh responsive:</strong> 0/' + imgCount + ' | ' +
                    '<span class="seo-tip">Khuyến nghị: Thêm srcset để tối ưu cho mobile</span>'
                ));
            }
            
            // Deprecated HTML Tags Test - Add to Links Analysis section
            if (analysis.deprecatedTags && analysis.deprecatedTags.length > 0) {
                const $links = $('#seo-links-analysis');
                $links.append($('<div class="seo-stat-item seo-error" style="margin-top: 1rem;">').html('<strong>Deprecated HTML Tags:</strong>'));
                analysis.deprecatedTags.forEach(function(dep) {
                    $links.append($('<div class="seo-stat-item seo-error">').html(
                        '<strong>&lt;' + dep.tag + '&gt;:</strong> Tìm thấy ' + dep.count + ' thẻ (đã deprecated)'
                    ));
                });
            }
            
            // Pagination Display - Add to Links Analysis section
            if (analysis.hasPaginationNext !== undefined || analysis.hasPaginationPrev !== undefined) {
                const $links = $('#seo-links-analysis');
                $links.append($('<h4>').css('margin-top', '1.5rem').text('📄 Pagination'));
                
                const hasNext = analysis.hasPaginationNext || false;
                const hasPrev = analysis.hasPaginationPrev || false;
                
                if (hasNext || hasPrev) {
                    let paginationStatus = '';
                    let paginationStatusClass = '';
                    if (hasNext && hasPrev) {
                        paginationStatus = '✅ Hoàn chỉnh';
                        paginationStatusClass = 'seo-good';
                    } else {
                        paginationStatus = '⚠️ Chưa hoàn chỉnh';
                        paginationStatusClass = 'seo-warning';
                    }
                    
                    $links.append($('<div class="seo-stat-item ' + paginationStatusClass + '">').html(
                        '<strong>Pagination:</strong> ' + paginationStatus + 
                        ' | rel="next": ' + (hasNext ? '✅ Có' : '❌ Chưa có') +
                        ' | rel="prev": ' + (hasPrev ? '✅ Có' : '❌ Chưa có') +
                        ' | <span class="seo-benchmark">Chuẩn: Cả hai tags</span> | ' +
                        '<span class="seo-tip">Giúp Google hiểu cấu trúc multi-page content</span>'
                    ));
                } else {
                    $links.append($('<div class="seo-stat-item seo-warning">').html(
                        '<strong>Pagination:</strong> ⚠️ Chưa có | ' +
                        '<span class="seo-tip">Nếu có multi-page content, nên thêm rel="next" và rel="prev"</span>'
                    ));
                }
            }
            
            // Unsafe Cross-Origin Links Test - Add to Links Analysis section
            if (analysis.unsafeCrossOriginLinks > 0) {
                const $links = $('#seo-links-analysis');
                $links.append($('<div class="seo-stat-item seo-error" style="margin-top: 1rem;">').html(
                    '<strong>Liên kết không an toàn (target="_blank" thiếu noopener):</strong> ' + analysis.unsafeCrossOriginLinks
                ));
                if (analysis.unsafeLinks && analysis.unsafeLinks.length > 0) {
                    analysis.unsafeLinks.slice(0, 5).forEach(function(link) {
                        // XSS-safe: Use .text() for user-generated content
                        const $linkItem = $('<div class="seo-stat-item seo-warning">');
                        $linkItem.append($('<strong>').text('Link: '));
                        $linkItem.append(document.createTextNode((link.text || link.href || '') + ' - ' + (link.issue || '')));
                        $links.append($linkItem);
                    });
                }
            }
            
            // URL Tests Display
            if (analysis.urlTests) {
                const $urlTests = $('#seo-url-tests');
                $urlTests.empty();
                
                // Robots.txt Test
                const robotsStatus = analysis.urlTests.robotsTxt ? analysis.urlTests.robotsTxt.status : 'pending';
                $urlTests.append($('<div class="seo-stat-item seo-' + robotsStatus + '">').html(
                    '<strong>Robots.txt:</strong> ' + (analysis.urlTests.robotsTxt ? analysis.urlTests.robotsTxt.message : 'Đang kiểm tra...')
                ));
                
                // Sitemap Test
                const sitemapStatus = analysis.urlTests.sitemap ? analysis.urlTests.sitemap.status : 'pending';
                $urlTests.append($('<div class="seo-stat-item seo-' + sitemapStatus + '">').html(
                    '<strong>Sitemap:</strong> ' + (analysis.urlTests.sitemap ? analysis.urlTests.sitemap.message : 'Đang kiểm tra...')
                ));
                
                // SSL/HTTPS Test
                const sslStatus = analysis.urlTests.ssl ? analysis.urlTests.ssl.status : 'pending';
                $urlTests.append($('<div class="seo-stat-item seo-' + sslStatus + '">').html(
                    '<strong>SSL/HTTPS:</strong> ' + (analysis.urlTests.ssl ? analysis.urlTests.ssl.message : 'Đang kiểm tra...')
                ));
                
                // WWW/Non-WWW Subdomain Test
                if (analysis.urlTests.wwwIssue && analysis.urlTests.wwwIssue.has_issue) {
                    const $wwwIssue = $('<div class="seo-stat-item seo-error">');
                    $wwwIssue.html(
                        '<strong>WWW/Non-WWW Issue:</strong> Website sử dụng cả www và non-www subdomain. ' +
                        'Điều này có thể gây duplicate content và bad links. ' +
                        'Nên chọn một phiên bản (www hoặc non-www) và redirect phiên bản còn lại.'
                    );
                    $urlTests.append($wwwIssue);
                } else if (analysis.urlTests.wwwIssue) {
                    $urlTests.append($('<div class="seo-stat-item seo-good">').html(
                        '<strong>WWW/Non-WWW:</strong> Không có vấn đề'
                    ));
                }
                
                // Canonicalization Test
                if (analysis.canonical) {
                    const canonicalStatus = 'good';
                    $urlTests.append($('<div class="seo-stat-item seo-' + canonicalStatus + '">').html(
                        '<strong>Canonical URL:</strong> ' + analysis.canonical
                    ));
                } else {
                    $urlTests.append($('<div class="seo-stat-item seo-warning">').html(
                        '<strong>Canonical URL:</strong> Chưa có'
                    ));
                }
                
                // Viewport Test
                if (analysis.viewport) {
                    $urlTests.append($('<div class="seo-stat-item seo-good">').html(
                        '<strong>Meta Viewport:</strong> Có (' + analysis.viewport + ')'
                    ));
                } else {
                    $urlTests.append($('<div class="seo-stat-item seo-error">').html(
                        '<strong>Meta Viewport:</strong> Chưa có - Cần thiết cho responsive design'
                    ));
                }
                
                // Charset Test
                if (analysis.charset) {
                    $urlTests.append($('<div class="seo-stat-item seo-good">').html(
                        '<strong>Charset:</strong> ' + analysis.charset
                    ));
                } else {
                    $urlTests.append($('<div class="seo-stat-item seo-warning">').html(
                        '<strong>Charset:</strong> Chưa xác định - Nên thêm meta charset'
                    ));
                }
                
                // Language Attribute Test
                if (analysis.lang) {
                    $urlTests.append($('<div class="seo-stat-item seo-good">').html(
                        '<strong>Language Attribute:</strong> ' + analysis.lang
                    ));
                } else {
                    $urlTests.append($('<div class="seo-stat-item seo-warning">').html(
                        '<strong>Language Attribute:</strong> Chưa có - Nên thêm lang attribute vào thẻ &lt;html&gt;'
                    ));
                }
                
                // Favicon Test
                if (analysis.favicon) {
                    $urlTests.append($('<div class="seo-stat-item seo-good">').html(
                        '<strong>Favicon:</strong> Có (' + analysis.favicon + ')'
                    ));
                } else {
                    $urlTests.append($('<div class="seo-stat-item seo-warning">').html(
                        '<strong>Favicon:</strong> Chưa có - Nên thêm favicon để cải thiện branding'
                    ));
                }
            }
            
            // Structured Data & Social Tags Display (Enhanced with Validation)
            const $structuredData = $('#seo-structured-data');
            $structuredData.empty();
            
            // Add explanation header
            $structuredData.append($('<div class="seo-explanation-box">').html(
                '<strong>🏷️ Giải thích:</strong> Structured Data (Schema.org) giúp Google hiểu nội dung và hiển thị rich snippets. ' +
                'E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) là yếu tố quan trọng cho SEO.'
            ));
            
            // E-E-A-T Signals Display
            if (analysis.hasAuthorSchema !== undefined || analysis.hasPubDate !== undefined) {
                $structuredData.append($('<h4>').css('margin-top', '1.5rem').text('⭐ E-E-A-T Signals'));
                
                const eeatDetails = [];
                let eeatScore = 0;
                
                if (analysis.hasAuthorSchema) {
                    eeatDetails.push('✅ Author Schema');
                    eeatScore++;
                } else {
                    eeatDetails.push('❌ Author Schema');
                }
                
                if (analysis.hasPubDate) {
                    eeatDetails.push('✅ Ngày xuất bản');
                    eeatScore++;
                } else {
                    eeatDetails.push('❌ Ngày xuất bản');
                }
                
                if (analysis.hasModDate) {
                    eeatDetails.push('✅ Ngày cập nhật');
                    eeatScore++;
                } else {
                    eeatDetails.push('⚠️ Ngày cập nhật');
                }
                
                if (analysis.hasAboutContactLinks) {
                    eeatDetails.push('✅ About/Contact links');
                    eeatScore++;
                } else {
                    eeatDetails.push('❌ About/Contact links');
                }
                
                const citationCount = analysis.citationLinksCount || 0;
                if (citationCount >= 2) {
                    eeatDetails.push('✅ Citations (' + citationCount + ')');
                    eeatScore += 2;
                } else if (citationCount === 1) {
                    eeatDetails.push('⚠️ Citations (' + citationCount + ')');
                    eeatScore++;
                } else {
                    eeatDetails.push('❌ Citations');
                }
                
                if (analysis.hasAuthorBio) {
                    eeatDetails.push('✅ Author Bio');
                    eeatScore++;
                } else {
                    eeatDetails.push('❌ Author Bio');
                }
                
                const eeatStatus = eeatScore >= 5 ? 'seo-good' : (eeatScore >= 3 ? 'seo-warning' : 'seo-error');
                const eeatStatusText = eeatScore >= 5 ? '✅ Tốt' : (eeatScore >= 3 ? '⚠️ Cần cải thiện' : '❌ Kém');
                
                $structuredData.append($('<div class="seo-stat-item ' + eeatStatus + '">').html(
                    '<strong>E-E-A-T Score:</strong> ' + eeatScore + '/6 điểm | ' + eeatStatusText + 
                    ' | <span class="seo-benchmark">Chuẩn: ≥5/6 điểm</span>'
                ));
                
                $structuredData.append($('<div class="seo-stat-item" style="margin-top: 0.5rem;">').html(
                    '<strong>Chi tiết:</strong> ' + eeatDetails.join(' | ')
                ));
            }
            
            // Breadcrumbs Display
            if (analysis.hasBreadcrumbSchema !== undefined || analysis.hasBreadcrumbNav !== undefined) {
                $structuredData.append($('<h4>').css('margin-top', '1.5rem').text('🍞 Breadcrumbs'));
                
                const hasSchema = analysis.hasBreadcrumbSchema || false;
                const hasNav = analysis.hasBreadcrumbNav || false;
                
                let breadcrumbStatus = '';
                let breadcrumbStatusClass = '';
                if (hasSchema) {
                    breadcrumbStatus = '✅ Có Schema';
                    breadcrumbStatusClass = 'seo-good';
                } else if (hasNav) {
                    breadcrumbStatus = '⚠️ Có HTML nhưng thiếu Schema';
                    breadcrumbStatusClass = 'seo-warning';
                } else {
                    breadcrumbStatus = '❌ Chưa có';
                    breadcrumbStatusClass = 'seo-error';
                }
                
                $structuredData.append($('<div class="seo-stat-item ' + breadcrumbStatusClass + '">').html(
                    '<strong>Breadcrumbs:</strong> ' + breadcrumbStatus + 
                    ' | <span class="seo-benchmark">Chuẩn: BreadcrumbList Schema</span> | ' +
                    '<span class="seo-tip">Giúp Google hiểu cấu trúc site và hiển thị trong SERP</span>'
                ));
            }
            
            // Display Structured Data Validation Results
            if (analysis.schemaValidation) {
                const schemaVal = analysis.schemaValidation;
                
                if (schemaVal.hasSchema) {
                    if (schemaVal.validSchemas.length > 0) {
                        const $schemaHeader = $('<h4>').css('margin-top', '1.5rem').text('✅ Structured Data (Schema.org)');
                        $structuredData.append($schemaHeader);
                        
                        // Display valid schemas
                        schemaVal.validSchemas.forEach(function(schema) {
                            const statusClass = schema.hasRequiredProps ? 'seo-good' : 'seo-warning';
                            const statusText = schema.hasRequiredProps ? '✅ Valid' : '⚠️ Missing Properties';
                            let schemaText = '<strong>Type:</strong> ' + schema.type + ' | ' + statusText;
                            
                            if (schema.missingProps.length > 0) {
                                schemaText += ' | <span class="seo-tip">Thiếu: ' + schema.missingProps.join(', ') + '</span>';
                            }
                            
                            $structuredData.append($('<div class="seo-stat-item ' + statusClass + '">').html(schemaText));
                        });
                        
                        // Display conflicts
                        if (schemaVal.conflicts.length > 0) {
                            schemaVal.conflicts.forEach(function(conflict) {
                                $structuredData.append($('<div class="seo-stat-item seo-error">').html(
                                    '❌ Conflict: ' + conflict.message
                                ));
                            });
                        }
                        
                        // Display errors
                        if (schemaVal.errors.length > 0) {
                            schemaVal.errors.forEach(function(error) {
                                $structuredData.append($('<div class="seo-stat-item seo-error">').html(
                                    '❌ Error: ' + error
                                ));
                            });
                        }
                        
                        // Display warnings
                        if (schemaVal.warnings.length > 0) {
                            schemaVal.warnings.forEach(function(warning) {
                                $structuredData.append($('<div class="seo-stat-item seo-warning">').html(
                                    '⚠️ Warning: ' + warning
                                ));
                            });
                        }
                    } else {
                        $structuredData.append($('<div class="seo-stat-item seo-error">').html(
                            '❌ Structured Data có lỗi | Không thể parse JSON-LD'
                        ));
                    }
                } else {
                    $structuredData.append($('<div class="seo-stat-item seo-warning">').html(
                        '⚠️ Không tìm thấy Structured Data | Nên thêm Schema.org markup để cải thiện rich snippets'
                    ));
                }
            }
            
            // Open Graph Tags Display
            if (analysis.ogTitle !== undefined || analysis.ogDesc !== undefined || analysis.ogImage !== undefined) {
                $structuredData.append($('<h4>').css('margin-top', '1.5rem').text('📱 Open Graph Tags'));
                
                const ogCount = (analysis.ogTitle ? 1 : 0) + (analysis.ogDesc ? 1 : 0) + (analysis.ogImage ? 1 : 0);
                const ogStatus = ogCount >= 3 ? 'seo-good' : (ogCount >= 2 ? 'seo-warning' : 'seo-error');
                const ogStatusText = ogCount >= 3 ? '✅ Tốt' : (ogCount >= 2 ? '⚠️ Thiếu' : '❌ Chưa đủ');
                
                $structuredData.append($('<div class="seo-stat-item ' + ogStatus + '">').html(
                    '<strong>Open Graph:</strong> ' + ogStatusText + ' | ' + ogCount + '/3 tags | ' +
                    '<span class="seo-benchmark">Chuẩn: 3 tags (title, description, image)</span>'
                ));
                
                if (analysis.ogTitle) {
                    $structuredData.append($('<div class="seo-stat-item">').html(
                        '<strong>og:title:</strong> ' + HTMLUtils.escape(analysis.ogTitle)
                    ));
                }
                if (analysis.ogDesc) {
                    $structuredData.append($('<div class="seo-stat-item">').html(
                        '<strong>og:description:</strong> ' + HTMLUtils.escape(analysis.ogDesc)
                    ));
                }
                if (analysis.ogImage) {
                    $structuredData.append($('<div class="seo-stat-item">').html(
                        '<strong>og:image:</strong> ' + HTMLUtils.escape(analysis.ogImage)
                    ));
                }
            }
            
            // Hreflang Tags Display
            if (analysis.hreflangTagsCount !== undefined) {
                $structuredData.append($('<h4>').css('margin-top', '1.5rem').text('🌍 Hreflang Tags'));
                
                const hreflangCount = analysis.hreflangTagsCount || 0;
                const hasXDefault = analysis.hasXDefault || false;
                
                let hreflangStatus = '';
                let hreflangStatusClass = '';
                if (hreflangCount >= 2 && hasXDefault) {
                    hreflangStatus = '✅ Tốt';
                    hreflangStatusClass = 'seo-good';
                } else if (hreflangCount >= 2) {
                    hreflangStatus = '⚠️ Thiếu x-default';
                    hreflangStatusClass = 'seo-warning';
                } else if (hreflangCount === 1) {
                    hreflangStatus = '⚠️ Có thể chưa đầy đủ';
                    hreflangStatusClass = 'seo-warning';
                } else {
                    hreflangStatus = 'ℹ️ Không cần (single-language site)';
                    hreflangStatusClass = 'seo-good';
                }
                
                $structuredData.append($('<div class="seo-stat-item ' + hreflangStatusClass + '">').html(
                    '<strong>Hreflang:</strong> ' + hreflangStatus + ' | ' + hreflangCount + ' tags' + 
                    (hasXDefault ? ' (có x-default)' : '') + 
                    ' | <span class="seo-benchmark">Chuẩn: ≥2 tags + x-default cho multi-language</span> | ' +
                    '<span class="seo-tip">Quan trọng cho sites đa ngôn ngữ</span>'
                ));
            }
            
            // Mobile Usability Check Display (Part 1: Basic Checks)
            let $mobileCheckSection = null;
            if (analysis.mobileUsability) {
                $mobileCheckSection = $('<div class="seo-section">');
                $mobileCheckSection.append($('<h3 class="seo-section-title">').html('📱 <span style="font-weight: 600;">Kiểm Tra Mobile Usability</span>'));
                $mobileCheckSection.append($('<p style="color: #666; margin-bottom: 1rem; font-size: 0.95em;">').text('Các yếu tố cơ bản để trang web hoạt động tốt trên thiết bị di động'));
                const $mobileCheckContent = $('<div>');
                
                const mobile = analysis.mobileUsability;
                
                // Viewport
                if (mobile.viewport.exists) {
                    if (mobile.viewport.valid) {
                        $mobileCheckContent.append($('<div class="seo-stat-item seo-good">').html(
                            '<strong>Viewport Meta Tag:</strong> ✅ Cấu hình đúng' + 
                            (mobile.viewport.issues.length > 0 ? ' | ' + mobile.viewport.issues.join(', ') : '')
                        ));
                    } else {
                        $mobileCheckContent.append($('<div class="seo-stat-item seo-error">').html(
                            '<strong>Viewport Meta Tag:</strong> ❌ Có vấn đề | ' + mobile.viewport.issues.join(', ')
                        ));
                    }
                } else {
                    $mobileCheckContent.append($('<div class="seo-stat-item seo-error">').html(
                        '<strong>Viewport Meta Tag:</strong> ❌ Thiếu | Quan trọng cho mobile SEO'
                    ));
                }
                
                // Touch Targets
                if (mobile.touchTargets.valid) {
                    $mobileCheckContent.append($('<div class="seo-stat-item seo-good">').html(
                        '<strong>Touch Targets:</strong> ✅ Tất cả các nút/liên kết đều đủ lớn (≥48x48px)'
                    ));
                } else {
                    $mobileCheckContent.append($('<div class="seo-stat-item seo-error">').html(
                        '<strong>Touch Targets:</strong> ❌ ' + mobile.touchTargets.issues.join(', ') + 
                        ' | <span class="seo-tip">Google khuyến nghị tối thiểu 48x48px</span>'
                    ));
                    if (mobile.touchTargets.smallTargets && mobile.touchTargets.smallTargets.length > 0) {
                        $mobileCheckContent.append($('<div style="margin-left: 1.5rem; margin-top: 0.5rem; color: #666; font-size: 0.9em;">').html(
                            '<strong>Ví dụ:</strong> ' + mobile.touchTargets.smallTargets.slice(0, 3).map(function(target) {
                                return target.text + ' (' + target.width + 'x' + target.height + 'px)';
                            }).join(', ') + (mobile.touchTargets.smallTargets.length > 3 ? '...' : '')
                        ));
                    }
                }
                
                // Font Sizes
                if (mobile.fontSizes.valid) {
                    $mobileCheckContent.append($('<div class="seo-stat-item seo-good">').html(
                        '<strong>Font Sizes:</strong> ✅ Tất cả text đều đủ lớn để đọc trên mobile'
                    ));
                } else {
                    const fontIssueText = mobile.fontSizes.issues && mobile.fontSizes.issues.length > 0 
                        ? mobile.fontSizes.issues.join(', ')
                        : 'Tìm thấy text có font size nhỏ hơn 12px';
                    $mobileCheckContent.append($('<div class="seo-stat-item seo-error">').html(
                        '<strong>Font Sizes:</strong> ❌ ' + fontIssueText +
                        ' | <span class="seo-tip">Google khuyến nghị tối thiểu 12px</span>'
                    ));
                }
                
                // Content Width
                if (mobile.contentWidth.valid) {
                    $mobileCheckContent.append($('<div class="seo-stat-item seo-good">').html(
                        '<strong>Content Width:</strong> ✅ Không có vấn đề về chiều rộng nội dung'
                    ));
                } else {
                    $mobileCheckContent.append($('<div class="seo-stat-item seo-warning">').html(
                        '<strong>Content Width:</strong> ⚠️ ' + (mobile.contentWidth.issues && mobile.contentWidth.issues.length > 0 ? mobile.contentWidth.issues.join(', ') : 'Có thể có vấn đề về responsive')
                    ));
                }
                
                $mobileCheckSection.append($mobileCheckContent);
                // Insert before PageSpeed Insights section
                $('#seo-pagespeed-insights').before($mobileCheckSection);
            }
            
            // Mobile Optimization Display (Part 2: Performance & Optimization)
            if (analysis.imagesCount !== undefined || analysis.responsiveImages !== undefined) {
                const $mobileOptSection = $('<div class="seo-section">');
                $mobileOptSection.append($('<h3 class="seo-section-title">').html('⚡ <span style="font-weight: 600;">Tối Ưu Mobile</span>'));
                $mobileOptSection.append($('<p style="color: #666; margin-bottom: 1rem; font-size: 0.95em;">').text('Các yếu tố tối ưu hiệu suất và trải nghiệm trên mobile'));
                const $mobileOptContent = $('<div>');
                
                // Responsive Images
                if (analysis.imagesCount > 0) {
                    const responsivePercentage = analysis.responsiveImages ? 
                        Math.round((analysis.responsiveImages / analysis.imagesCount) * 100) : 0;
                    if (responsivePercentage >= 50) {
                        $mobileOptContent.append($('<div class="seo-stat-item seo-good">').html(
                            '<strong>Responsive Images:</strong> ✅ ' + responsivePercentage + '% hình ảnh có srcset/sizes (' + 
                            (analysis.responsiveImages || 0) + '/' + analysis.imagesCount + ')'
                        ));
                    } else {
                        $mobileOptContent.append($('<div class="seo-stat-item seo-warning">').html(
                            '<strong>Responsive Images:</strong> ⚠️ Chỉ ' + responsivePercentage + '% hình ảnh responsive (' + 
                            (analysis.responsiveImages || 0) + '/' + analysis.imagesCount + ') | ' +
                            '<span class="seo-tip">Nên sử dụng srcset và sizes cho responsive images</span>'
                        ));
                    }
                }
                
                // Lazy Loading
                if (analysis.imagesCount > 0) {
                    const lazyLoadingPercentage = analysis.imagesWithLazyLoading ? 
                        Math.round((analysis.imagesWithLazyLoading / analysis.imagesCount) * 100) : 0;
                    if (lazyLoadingPercentage >= 50) {
                        $mobileOptContent.append($('<div class="seo-stat-item seo-good">').html(
                            '<strong>Lazy Loading:</strong> ✅ ' + lazyLoadingPercentage + '% hình ảnh có lazy loading (' + 
                            (analysis.imagesWithLazyLoading || 0) + '/' + analysis.imagesCount + ')'
                        ));
                    } else {
                        $mobileOptContent.append($('<div class="seo-stat-item seo-warning">').html(
                            '<strong>Lazy Loading:</strong> ⚠️ Chỉ ' + lazyLoadingPercentage + '% hình ảnh có lazy loading | ' +
                            '<span class="seo-tip">Thêm loading="lazy" để cải thiện tốc độ tải trang</span>'
                        ));
                    }
                }
                
                // Modern Image Formats
                if (analysis.imagesCount > 0) {
                    const modernFormatPercentage = analysis.imagesWithModernFormat ? 
                        Math.round((analysis.imagesWithModernFormat / analysis.imagesCount) * 100) : 0;
                    if (modernFormatPercentage >= 30) {
                        $mobileOptContent.append($('<div class="seo-stat-item seo-good">').html(
                            '<strong>Modern Image Formats:</strong> ✅ ' + modernFormatPercentage + '% hình ảnh sử dụng WebP/AVIF (' + 
                            (analysis.imagesWithModernFormat || 0) + '/' + analysis.imagesCount + ')'
                        ));
                    } else if (modernFormatPercentage > 0) {
                        $mobileOptContent.append($('<div class="seo-stat-item seo-warning">').html(
                            '<strong>Modern Image Formats:</strong> ⚠️ Chỉ ' + modernFormatPercentage + '% hình ảnh sử dụng WebP/AVIF | ' +
                            '<span class="seo-tip">WebP/AVIF giúp giảm kích thước file và tăng tốc độ tải</span>'
                        ));
                    } else {
                        $mobileOptContent.append($('<div class="seo-stat-item seo-warning">').html(
                            '<strong>Modern Image Formats:</strong> ⚠️ Không có hình ảnh WebP/AVIF | ' +
                            '<span class="seo-tip">Cân nhắc chuyển đổi sang WebP để tối ưu cho mobile</span>'
                        ));
                    }
                }
                
                // Oversized Images
                if (analysis.oversizedImages && analysis.oversizedImages > 0) {
                    $mobileOptContent.append($('<div class="seo-stat-item seo-warning">').html(
                        '<strong>Oversized Images:</strong> ⚠️ Tìm thấy ' + analysis.oversizedImages + 
                        ' hình ảnh có kích thước > 2000px | ' +
                        '<span class="seo-tip">Nên resize hình ảnh để giảm thời gian tải trên mobile</span>'
                    ));
                } else if (analysis.imagesCount > 0) {
                    $mobileOptContent.append($('<div class="seo-stat-item seo-good">').html(
                        '<strong>Image Sizes:</strong> ✅ Không có hình ảnh quá lớn'
                    ));
                }
                
                if ($mobileOptContent.children().length > 0) {
                    $mobileOptSection.append($mobileOptContent);
                    // Insert after Mobile Usability Check section (if it exists) or before PageSpeed
                    if ($mobileCheckSection && $mobileCheckSection.length > 0) {
                        $mobileCheckSection.after($mobileOptSection);
                    } else {
                        $('#seo-pagespeed-insights').before($mobileOptSection);
                    }
                }
            }
            
            // Open Graph Tags Display (after Structured Data)
            const ogTags = [];
            if (analysis.ogTitle) ogTags.push('og:title');
            if (analysis.ogDesc) ogTags.push('og:description');
            if (analysis.ogImage) ogTags.push('og:image');
            if (analysis.ogUrl) ogTags.push('og:url');
            
            const ogCount = ogTags.length;
            const ogStatus = ogCount >= 3 ? 'good' : (ogCount >= 2 ? 'warning' : 'error');
            
            $structuredData.append($('<h4>').css('margin-top', '1.5rem').text('📱 Open Graph Tags (Facebook, LinkedIn)'));
            if (ogCount > 0) {
                $structuredData.append($('<div class="seo-stat-item seo-' + ogStatus + '">').html(
                    '<strong>Open Graph Tags:</strong> ' + ogCount + '/4 tags (' + ogTags.join(', ') + ')'
                ));
                
                if (analysis.ogTitle) {
                    const $ogTitle = $('<div class="seo-stat-item">');
                    $ogTitle.append($('<strong>').text('og:title: '));
                    $ogTitle.append(document.createTextNode(analysis.ogTitle.length > 60 ? analysis.ogTitle.substring(0, 60) + '...' : analysis.ogTitle));
                    $structuredData.append($ogTitle);
                }
                if (analysis.ogDesc) {
                    const $ogDesc = $('<div class="seo-stat-item">');
                    $ogDesc.append($('<strong>').text('og:description: '));
                    $ogDesc.append(document.createTextNode(analysis.ogDesc.length > 100 ? analysis.ogDesc.substring(0, 100) + '...' : analysis.ogDesc));
                    $structuredData.append($ogDesc);
                }
                if (analysis.ogImage) {
                    const $ogImage = $('<div class="seo-stat-item">');
                    $ogImage.append($('<strong>').text('og:image: '));
                    $ogImage.append(document.createTextNode(analysis.ogImage.length > 80 ? analysis.ogImage.substring(0, 80) + '...' : analysis.ogImage));
                    $structuredData.append($ogImage);
                }
            } else {
                $structuredData.append($('<div class="seo-stat-item seo-warning">').html(
                    '<strong>Open Graph Tags:</strong> Chưa có - Nên thêm Open Graph tags để tối ưu chia sẻ trên mạng xã hội'
                ));
            }
            
            // Twitter Cards Display (NEW)
            const twitterTags = [];
            if (analysis.twitterCard) twitterTags.push('twitter:card');
            if (analysis.twitterTitle) twitterTags.push('twitter:title');
            if (analysis.twitterDesc) twitterTags.push('twitter:description');
            if (analysis.twitterImage) twitterTags.push('twitter:image');
            if (analysis.twitterSite) twitterTags.push('twitter:site');
            if (analysis.twitterCreator) twitterTags.push('twitter:creator');
            
            const twitterCount = twitterTags.length;
            const twitterStatus = twitterCount >= 3 ? 'good' : (twitterCount >= 1 ? 'warning' : 'error');
            
            $structuredData.append($('<h4>').css('margin-top', '1.5rem').text('🐦 Twitter Cards'));
            if (twitterCount > 0) {
                $structuredData.append($('<div class="seo-stat-item seo-' + twitterStatus + '">').html(
                    '<strong>Twitter Cards:</strong> ' + twitterCount + '/6 tags (' + twitterTags.join(', ') + ')'
                ));
                
                if (analysis.twitterCard) {
                    const $twCard = $('<div class="seo-stat-item">');
                    $twCard.append($('<strong>').text('twitter:card: '));
                    $twCard.append(document.createTextNode(analysis.twitterCard));
                    $structuredData.append($twCard);
                }
                if (analysis.twitterTitle) {
                    const $twTitle = $('<div class="seo-stat-item">');
                    $twTitle.append($('<strong>').text('twitter:title: '));
                    $twTitle.append(document.createTextNode(analysis.twitterTitle.length > 60 ? analysis.twitterTitle.substring(0, 60) + '...' : analysis.twitterTitle));
                    $structuredData.append($twTitle);
                }
                if (analysis.twitterDesc) {
                    const $twDesc = $('<div class="seo-stat-item">');
                    $twDesc.append($('<strong>').text('twitter:description: '));
                    $twDesc.append(document.createTextNode(analysis.twitterDesc.length > 100 ? analysis.twitterDesc.substring(0, 100) + '...' : analysis.twitterDesc));
                    $structuredData.append($twDesc);
                }
                if (analysis.twitterImage) {
                    const $twImage = $('<div class="seo-stat-item">');
                    $twImage.append($('<strong>').text('twitter:image: '));
                    $twImage.append(document.createTextNode(analysis.twitterImage.length > 80 ? analysis.twitterImage.substring(0, 80) + '...' : analysis.twitterImage));
                    $structuredData.append($twImage);
                }
                if (analysis.twitterSite) {
                    const $twSite = $('<div class="seo-stat-item">');
                    $twSite.append($('<strong>').text('twitter:site: '));
                    $twSite.append(document.createTextNode(analysis.twitterSite));
                    $structuredData.append($twSite);
                }
                if (analysis.twitterCreator) {
                    const $twCreator = $('<div class="seo-stat-item">');
                    $twCreator.append($('<strong>').text('twitter:creator: '));
                    $twCreator.append(document.createTextNode(analysis.twitterCreator));
                    $structuredData.append($twCreator);
                }
            } else {
                $structuredData.append($('<div class="seo-stat-item seo-warning">').html(
                    '<strong>Twitter Cards:</strong> Chưa có - Nên thêm Twitter Cards để tối ưu chia sẻ trên Twitter'
                ));
            }
            
            // Internal Links with Dynamic Parameters Test - Add to Links Analysis section
            if (analysis.internalLinksWithParams > 0) {
                const $links = $('#seo-links-analysis');
                $links.append($('<div class="seo-stat-item seo-warning" style="margin-top: 1rem;">').html(
                    '<strong>Liên kết nội bộ có dynamic parameters:</strong> ' + analysis.internalLinksWithParams + ' (không nên có nếu không phải nofollow)'
                ));
                if (analysis.internalLinksWithDynamicParams && analysis.internalLinksWithDynamicParams.length > 0) {
                    analysis.internalLinksWithDynamicParams.slice(0, 5).forEach(function(link) {
                        $links.append($('<div class="seo-stat-item seo-warning">').html(
                            '<strong>Link:</strong> ' + (link.text || link.href) + ' <code>' + link.params + '</code>'
                        ));
                    });
                }
            }
            
            // Scroll to results
            $('html, body').animate({
                scrollTop: $result.offset().top - 100
            }, 500);
        },
        
        setLoading: function(loading, step) {
            const $form = $('#seo-checker-form');
            const $submitBtn = $('#seo-analyze-btn');
            const $urlInput = $('#seo-url');
            const $result = $('#seo-checker-result');
            
            // Get or create progress indicator
            let $progressContainer = $('#seo-progress-container');
            if ($progressContainer.length === 0) {
                $progressContainer = $('<div id="seo-progress-container" style="margin-top: 1rem;"></div>');
                $form.after($progressContainer);
            }
            
            if (loading) {
                // Disable button and input
                $submitBtn.prop('disabled', true);
                $urlInput.prop('disabled', true);
                
                // Add loading spinner to button
                const originalText = $submitBtn.data('original-text') || $submitBtn.text();
                $submitBtn.data('original-text', originalText);
                
                // Update button text based on step
                const stepTexts = {
                    'fetching': 'Đang tải nội dung...',
                    'parsing': 'Đang phân tích HTML...',
                    'analyzing': 'Đang phân tích SEO...',
                    'pagespeed': 'Đang phân tích PageSpeed...',
                    'default': 'Đang phân tích...'
                };
                const buttonText = stepTexts[step] || stepTexts['default'];
                $submitBtn.html('<span class="bt-loading-spinner"></span> ' + buttonText);
                
                // Add loading class to form
                $form.addClass('bt-loading');
                
                // Don't hide results immediately - let displayResults handle visibility
                // $result.hide();
                
                // Show progress indicator
                if (step) {
                    const steps = [
                        { id: 'fetching', label: 'Tải nội dung từ URL', active: step === 'fetching' },
                        { id: 'parsing', label: 'Phân tích HTML', active: step === 'parsing' },
                        { id: 'analyzing', label: 'Phân tích SEO', active: step === 'analyzing' },
                        { id: 'pagespeed', label: 'Phân tích PageSpeed', active: step === 'pagespeed' }
                    ];
                    
                    let progressHTML = '<div class="seo-progress-steps" style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem;">';
                    steps.forEach(function(s, index) {
                        const isCompleted = steps.findIndex(st => st.active) > index;
                        const isActive = s.active;
                        const statusClass = isCompleted ? 'completed' : (isActive ? 'active' : 'pending');
                        const statusIcon = isCompleted ? '✓' : (isActive ? '⟳' : '○');
                        
                        progressHTML += '<div class="seo-progress-step seo-progress-' + statusClass + '" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: ' + 
                            (isActive ? '#e0f2fe' : (isCompleted ? '#f0fdf4' : '#f3f4f6')) + '; border-radius: 4px;">';
                        progressHTML += '<span style="font-weight: bold; color: ' + 
                            (isActive ? '#0284c7' : (isCompleted ? '#16a34a' : '#6b7280')) + ';">' + statusIcon + '</span>';
                        progressHTML += '<span style="color: ' + 
                            (isActive ? '#0284c7' : (isCompleted ? '#16a34a' : '#6b7280')) + ';">' + s.label + '</span>';
                        progressHTML += '</div>';
                    });
                    progressHTML += '</div>';
                    
                    $progressContainer.html(progressHTML).show();
                }
                
                // Show loading message
                if ($('#seo-loading-message').length === 0) {
                    $form.after('<div id="seo-loading-message" class="seo-loading-message"><div class="bt-loading-spinner"></div> Đang phân tích SEO, vui lòng đợi...</div>');
                }
            } else {
                // Enable button and input
                $submitBtn.prop('disabled', false);
                $urlInput.prop('disabled', false);
                
                // Restore original button text
                const originalText = $submitBtn.data('original-text') || 'Phân Tích SEO';
                $submitBtn.text(originalText);
                
                // Remove loading class
                $form.removeClass('bt-loading');
                
                // Remove loading message
                $('#seo-loading-message').remove();
                
                // Hide progress indicator
                $progressContainer.hide();
            }
        },
        
        showError: function(message, errorCode) {
            const $form = $('#seo-checker-form');
            let $errorMsg = $('#seo-error-message');
            
            if ($errorMsg.length === 0) {
                $errorMsg = $('<div id="seo-error-message" class="bt-error-message"></div>');
                $form.after($errorMsg);
            }
            
            // Enhanced error message with error code
            let errorHTML = '<span class="bt-error-icon">⚠</span> ';
            
            // Add error code if provided
            if (errorCode) {
                errorHTML += '<span style="font-weight: bold; color: #dc2626;">[Lỗi ' + errorCode + ']</span> ';
            }
            
            errorHTML += message;
            
            // Add error-specific troubleshooting tips based on error code
            const errorTips = {
                'E001': 'Kiểm tra URL có đúng định dạng không (phải bắt đầu bằng http:// hoặc https://)',
                'E002': 'Kiểm tra kết nối mạng và thử lại sau vài giây',
                'E003': 'Trang web có thể đang chặn truy cập từ server. Thử truy cập URL trực tiếp trên trình duyệt',
                'E004': 'Nội dung trang web quá lớn hoặc không hợp lệ. Thử với URL khác',
                'E005': 'Lỗi khi phân tích HTML. Trang web có thể sử dụng JavaScript để render nội dung',
                'E006': 'Không thể kết nối đến server. Kiểm tra kết nối mạng',
                'E007': 'Yêu cầu quá thời gian. Trang web có thể đang tải chậm hoặc không phản hồi',
                'E008': 'Lỗi SSL. Không thể xác minh chứng chỉ SSL của trang web',
                'E009': 'URL không tồn tại hoặc không thể truy cập (404 Not Found)',
                'E010': 'Trang web từ chối truy cập (403 Forbidden). Có thể cần xác thực hoặc bị chặn'
            };
            
            if (errorCode && errorTips[errorCode]) {
                errorHTML += '<br><br><small style="color: #666;"><strong>Gợi ý:</strong> ' + errorTips[errorCode] + '</small>';
            }
            
            $errorMsg.html(errorHTML).addClass('show');
            
            // Remove loading state
            SEOCheckerHandler.setLoading(false);
            
            // Scroll to error message
            $('html, body').animate({
                scrollTop: $errorMsg.offset().top - 100
            }, 300);
        },
        
        /**
         * Scroll to a specific section with smooth animation and highlight
         */
        scrollToSection: function(sectionId) {
            // First, try to find the element by ID directly
            let $targetElement = $('#' + sectionId);
            
            // If found, get its parent .seo-section (if it's inside one)
            if ($targetElement.length > 0) {
                const $parentSection = $targetElement.closest('.seo-section');
                if ($parentSection.length > 0) {
                    $targetElement = $parentSection;
                }
            } else {
                // If not found directly, try to find parent section that contains this ID
                $('.seo-section').each(function() {
                    const $section = $(this);
                    // Check if this section contains the target ID
                    if ($section.find('#' + sectionId).length > 0) {
                        $targetElement = $section;
                        return false; // break loop
                    }
                    // Also check if section itself has this ID
                    if ($section.attr('id') === sectionId) {
                        $targetElement = $section;
                        return false; // break loop
                    }
                });
            }
            
            // If found, scroll to it
            if ($targetElement.length > 0) {
                const offset = $targetElement.offset();
                if (offset) {
                    // Add highlight class temporarily
                    $targetElement.addClass('seo-section-highlight');
                    
                    // Scroll to section with offset for header
                    $('html, body').animate({
                        scrollTop: offset.top - 100
                    }, 600, function() {
                        // Remove highlight after animation
                        setTimeout(function() {
                            $targetElement.removeClass('seo-section-highlight');
                        }, 2000);
                    });
                    
                    // Focus on section for accessibility
                    $targetElement.attr('tabindex', '-1');
                    $targetElement.focus();
                }
            } else {
                Debug.warn('Section not found:', sectionId);
            }
        },
        
        /**
         * Get detailed description for each factor with benchmarks
         */
        getFactorDetail: function(key, analysis, breakdown) {
            try {
                switch(key) {
                    case 'title':
                        if (!analysis.title) {
                            return '❌ Chưa có | Chuẩn: 30-60 ký tự | Giải thích: Title tag là yếu tố quan trọng nhất cho SEO, hiển thị trên kết quả tìm kiếm';
                        }
                        const titleLen = analysis.title.length;
                        let titleStatus = '';
                        if (titleLen >= 30 && titleLen <= 60) {
                            titleStatus = '✅ Tốt';
                        } else if (titleLen < 30) {
                            titleStatus = '⚠️ Quá ngắn';
                        } else if (titleLen > 60) {
                            titleStatus = '⚠️ Quá dài (có thể bị cắt)';
                        }
                        return titleStatus + ' | ' + titleLen + ' ký tự | Chuẩn: 30-60 ký tự | Mẹo: Đặt từ khóa chính ở đầu title';
                        
                    case 'metaDesc':
                        if (!analysis.metaDesc) {
                            return '❌ Chưa có | Chuẩn: 120-160 ký tự | Giải thích: Meta description là đoạn mô tả hiển thị dưới title trên kết quả tìm kiếm';
                        }
                        const descLen = analysis.metaDesc.length;
                        let descStatus = '';
                        if (descLen >= 120 && descLen <= 160) {
                            descStatus = '✅ Tốt';
                        } else if (descLen < 120) {
                            descStatus = '⚠️ Quá ngắn';
                        } else if (descLen > 160) {
                            descStatus = '⚠️ Quá dài (có thể bị cắt)';
                        }
                        return descStatus + ' | ' + descLen + ' ký tự | Chuẩn: 120-160 ký tự | Mẹo: Viết mô tả hấp dẫn, có từ khóa chính';
                        
                    case 'h1':
                        const h1Count = analysis.h1Count || 0;
                        if (h1Count === 0) {
                            return '❌ Chưa có | Chuẩn: 1 thẻ H1 | Giải thích: Mỗi trang nên có đúng 1 thẻ H1 chứa từ khóa chính';
                        } else if (h1Count === 1) {
                            return '✅ Tốt | 1 thẻ H1 | Chuẩn: 1 thẻ | Mẹo: Đặt từ khóa chính trong H1';
                        } else {
                            return '⚠️ Có ' + h1Count + ' thẻ | Chuẩn: 1 thẻ | Vấn đề: Nhiều H1 gây nhầm lẫn cho Google';
                        }
                        
                    case 'contentLength':
                        const wordCount = analysis.wordCount || 0;
                        let contentStatus = '';
                        if (wordCount >= 300 && wordCount <= 2500) {
                            contentStatus = '✅ Tốt';
                        } else if (wordCount < 300) {
                            contentStatus = '⚠️ Quá ngắn';
                        } else if (wordCount > 2500) {
                            contentStatus = '⚠️ Quá dài';
                        }
                        return contentStatus + ' | ' + wordCount + ' từ | Chuẩn: 300-2500 từ | Mẹo: Nội dung dài thường xếp hạng tốt hơn';
                        
                    case 'images':
                        const imgCount = analysis.imagesCount || 0;
                        const imgWithAlt = analysis.imagesWithAlt || 0;
                        if (imgCount === 0) {
                            return '⚠️ Chưa có hình ảnh | Khuyến nghị: Thêm hình ảnh để tăng engagement';
                        }
                        const altPercent = imgCount > 0 ? Math.round((imgWithAlt / imgCount) * 100) : 0;
                        let imgStatus = '';
                        if (altPercent >= 90) {
                            imgStatus = '✅ Tốt';
                        } else if (altPercent >= 50) {
                            imgStatus = '⚠️ Cần cải thiện';
                        } else {
                            imgStatus = '❌ Kém';
                        }
                        return imgStatus + ' | ' + imgWithAlt + '/' + imgCount + ' có alt text (' + altPercent + '%) | Chuẩn: ≥90% | Mẹo: Alt text giúp SEO và accessibility';
                        
                    case 'keyword':
                        if (!analysis.keywordsUsage || analysis.keywordsUsage.length === 0) {
                            if (analysis.mostCommonKeywords && analysis.mostCommonKeywords.length > 0) {
                                const topKw = analysis.mostCommonKeywords[0];
                                const density = parseFloat(topKw.density);
                                let kwStatus = '';
                                if (density >= 0.5 && density <= 2.5) {
                                    kwStatus = '✅ Tốt';
                                } else if (density < 0.5) {
                                    kwStatus = '⚠️ Quá thấp';
                                } else {
                                    kwStatus = '⚠️ Quá cao (có thể bị spam)';
                                }
                                return kwStatus + ' | Từ khóa: ' + topKw.word + ' | Mật độ: ' + density.toFixed(2) + '% | Chuẩn: 0.5-2.5%';
                            }
                            return '⚠️ Chưa tìm thấy từ khóa chính | Khuyến nghị: Xác định từ khóa chính và sử dụng trong nội dung';
                        }
                        const topKw = analysis.keywordsUsage[0];
                        const kwDensity = parseFloat(topKw.density);
                        const kwDetails = [];
                        if (topKw.inTitle) kwDetails.push('Title');
                        if (topKw.inMetaDesc) kwDetails.push('Meta');
                        if (topKw.inH1) kwDetails.push('H1');
                        if (topKw.inUrl) kwDetails.push('URL');
                        if (topKw.inFirstParagraph) kwDetails.push('Đoạn đầu');
                        
                        let kwOverallStatus = '';
                        if (topKw.usageScore >= 6 && kwDensity >= 0.5 && kwDensity <= 2.5) {
                            kwOverallStatus = '✅ Tốt';
                        } else if (topKw.usageScore >= 4) {
                            kwOverallStatus = '⚠️ Cần cải thiện';
                        } else {
                            kwOverallStatus = '❌ Kém';
                        }
                        
                        return kwOverallStatus + ' | Từ khóa: ' + topKw.keyword + ' | Điểm: ' + (topKw.usageScore || 0) + '/8 | Mật độ: ' + kwDensity.toFixed(2) + '% (chuẩn: 0.5-2.5%) | ' + 
                               (kwDetails.length > 0 ? '✓ Có trong: ' + kwDetails.join(', ') : '✗ Chưa tối ưu vị trí');
                        
                    case 'headings':
                        const h1 = analysis.h1Count || 0;
                        const h2 = analysis.h2Count || 0;
                        const h3 = analysis.h3Count || 0;
                        let headingStatus = '';
                        if (h1 === 1 && h2 >= 2) {
                            headingStatus = '✅ Tốt';
                        } else if (h1 === 1) {
                            headingStatus = '⚠️ Thiếu H2';
                        } else {
                            headingStatus = '❌ Cần cải thiện';
                        }
                        return headingStatus + ' | H1: ' + h1 + ', H2: ' + h2 + ', H3: ' + h3 + ' | Chuẩn: 1 H1, ≥2 H2 | Mẹo: Cấu trúc heading giúp Google hiểu nội dung';
                        
                    case 'internalLinks':
                        const intLinks = analysis.internalLinks || 0;
                        let intStatus = '';
                        if (intLinks >= 3) {
                            intStatus = '✅ Tốt';
                        } else if (intLinks > 0) {
                            intStatus = '⚠️ Cần thêm';
                        } else {
                            intStatus = '❌ Chưa có';
                        }
                        return intStatus + ' | ' + intLinks + ' liên kết | Chuẩn: ≥3 liên kết | Mẹo: Liên kết nội bộ giúp phân phối PageRank';
                        
                    case 'externalLinks':
                        const extLinks = analysis.externalLinks || 0;
                        let extStatus = '';
                        if (extLinks > 0 && extLinks <= 10) {
                            extStatus = '✅ Tốt';
                        } else if (extLinks > 10) {
                            extStatus = '⚠️ Quá nhiều';
                        } else {
                            extStatus = '⚠️ Chưa có';
                        }
                        return extStatus + ' | ' + extLinks + ' liên kết | Chuẩn: 1-10 liên kết | Mẹo: Liên kết đến nguồn uy tín tăng độ tin cậy';
                        
                    case 'openGraph':
                        const ogCount = (analysis.ogTitle ? 1 : 0) + (analysis.ogDesc ? 1 : 0) + (analysis.ogImage ? 1 : 0);
                        let ogStatus = '';
                        if (ogCount >= 3) {
                            ogStatus = '✅ Tốt';
                        } else if (ogCount >= 2) {
                            ogStatus = '⚠️ Thiếu';
                        } else {
                            ogStatus = '❌ Chưa đủ';
                        }
                        return ogStatus + ' | ' + ogCount + '/3 tags | Chuẩn: 3 tags (title, description, image) | Mẹo: OG tags cải thiện hiển thị khi chia sẻ trên mạng xã hội';
                        
                    case 'schema':
                        if (analysis.hasSchema) {
                            return '✅ Tốt | Có Schema markup | Giải thích: Schema giúp Google hiểu nội dung và hiển thị rich snippets';
                        } else {
                            return '⚠️ Chưa có | Khuyến nghị: Thêm Schema.org structured data | Mẹo: Schema giúp tăng CTR từ kết quả tìm kiếm';
                        }
                        
                    case 'canonical':
                        if (analysis.canonical) {
                            return '✅ Tốt | Có canonical URL | Giải thích: Canonical giúp tránh duplicate content';
                        } else {
                            return '⚠️ Chưa có | Khuyến nghị: Thêm canonical URL | Mẹo: Quan trọng khi có nhiều URL trỏ đến cùng nội dung';
                        }
                        
                    case 'readability':
                        if (analysis.readabilityScore === undefined || analysis.readabilityScore === null) {
                            return 'N/A | Không thể tính toán';
                        }
                        const readability = analysis.readabilityScore;
                        let readStatus = '';
                        if (readability >= 60) {
                            readStatus = '✅ Dễ đọc';
                        } else if (readability >= 40) {
                            readStatus = '⚠️ Trung bình';
                        } else {
                            readStatus = '❌ Khó đọc';
                        }
                        return readStatus + ' | ' + readability.toFixed(1) + '/100 | Chuẩn: ≥60 | Mẹo: Nội dung dễ đọc giữ chân người đọc lâu hơn';
                        
                    case 'ssl':
                        if (analysis.urlTests && analysis.urlTests.ssl && analysis.urlTests.ssl.valid) {
                            return '✅ Tốt | Sử dụng HTTPS | Chuẩn: Bắt buộc | Giải thích: HTTPS là yêu cầu bắt buộc cho SEO và bảo mật';
                        } else {
                            return '❌ Chưa có | Không sử dụng HTTPS | Chuẩn: Bắt buộc | Giải thích: Google ưu tiên các trang HTTPS';
                        }
                        
                    case 'robotsTxt':
                        if (analysis.urlTests && analysis.urlTests.robotsTxt && analysis.urlTests.robotsTxt.exists) {
                            return '✅ Tốt | Có robots.txt | Chuẩn: Bắt buộc | Giải thích: Giúp điều khiển cách search engines crawl trang';
                        } else {
                            return '⚠️ Chưa có | Không tìm thấy robots.txt | Chuẩn: Nên có | Giải thích: Quan trọng để kiểm soát indexing';
                        }
                        
                    case 'sitemap':
                        if (analysis.urlTests && analysis.urlTests.sitemap && analysis.urlTests.sitemap.exists) {
                            return '✅ Tốt | Có sitemap.xml | Chuẩn: Nên có | Giải thích: Giúp Google tìm và index tất cả các trang';
                        } else {
                            return '⚠️ Chưa có | Không tìm thấy sitemap.xml | Chuẩn: Nên có | Giải thích: Quan trọng cho việc indexing';
                        }
                        
                    case 'viewport':
                        if (analysis.viewport) {
                            return '✅ Tốt | Có meta viewport | Chuẩn: Bắt buộc | Giải thích: Quan trọng cho mobile SEO và responsive design';
                        } else {
                            return '❌ Chưa có | Thiếu meta viewport | Chuẩn: Bắt buộc | Giải thích: Google ưu tiên mobile-first indexing';
                        }
                        
                    case 'charset':
                        if (analysis.charset) {
                            return '✅ Tốt | Có charset declaration | Chuẩn: Nên có | Giải thích: Đảm bảo hiển thị đúng ký tự';
                        } else {
                            return '⚠️ Chưa có | Thiếu charset | Chuẩn: Nên có | Giải thích: Quan trọng cho việc hiển thị đúng nội dung';
                        }
                        
                    case 'lang':
                        if (analysis.lang) {
                            return '✅ Tốt | Có lang attribute | Chuẩn: Nên có | Giải thích: Giúp Google hiểu ngôn ngữ của trang';
                        } else {
                            return '⚠️ Chưa có | Thiếu lang attribute | Chuẩn: Nên có | Giải thích: Quan trọng cho SEO đa ngôn ngữ';
                        }
                        
                    case 'favicon':
                        if (analysis.favicon) {
                            return '✅ Tốt | Có favicon | Chuẩn: Nên có | Giải thích: Cải thiện branding và user experience';
                        } else {
                            return '⚠️ Chưa có | Thiếu favicon | Chuẩn: Nên có | Giải thích: Không ảnh hưởng SEO nhưng tốt cho UX';
                        }
                        
                    case 'wwwIssue':
                        if (analysis.urlTests && analysis.urlTests.wwwIssue && analysis.urlTests.wwwIssue.has_issue) {
                            return '❌ Có vấn đề | Cả www và non-www đều hoạt động | Chuẩn: Chỉ một phiên bản | Giải thích: Gây duplicate content, cần redirect';
                        } else {
                            return '✅ Tốt | Không có vấn đề | Chuẩn: Chỉ một phiên bản | Giải thích: Tránh duplicate content';
                        }
                        
                    case 'mobileUsability':
                        if (analysis.mobileUsability) {
                            const mobile = analysis.mobileUsability;
                            const score = mobile.score || 0;
                            if (score >= 3) {
                                return '✅ Tốt | Mobile-friendly | Chuẩn: ≥3/4 | Giải thích: Google ưu tiên mobile-first indexing';
                            } else if (score >= 2) {
                                return '⚠️ Cần cải thiện | Một số vấn đề mobile | Chuẩn: ≥3/4 | Giải thích: Cần kiểm tra viewport, touch targets, font sizes';
                            } else {
                                return '❌ Có vấn đề | Không mobile-friendly | Chuẩn: ≥3/4 | Giải thích: Quan trọng cho mobile SEO';
                            }
                        } else {
                            return '⚠️ Chưa kiểm tra | Mobile usability | Chuẩn: ≥3/4 | Giải thích: Cần kiểm tra';
                        }
                        
                    case 'eeat':
                        const eeatScore = breakdown.points || 0;
                        let eeatStatus = '';
                        if (eeatScore >= 6) {
                            eeatStatus = '✅ Tốt';
                        } else if (eeatScore >= 3) {
                            eeatStatus = '⚠️ Cần cải thiện';
                        } else {
                            eeatStatus = '❌ Kém';
                        }
                        const eeatDetails = [];
                        if (analysis.hasAuthorSchema) eeatDetails.push('Author Schema');
                        if (analysis.hasPubDate) eeatDetails.push('Ngày xuất bản');
                        if (analysis.hasModDate) eeatDetails.push('Ngày cập nhật');
                        if (analysis.hasAboutContactLinks) eeatDetails.push('About/Contact');
                        if (analysis.citationLinksCount >= 2) eeatDetails.push('Citations');
                        if (analysis.hasAuthorBio) eeatDetails.push('Author Bio');
                        return eeatStatus + ' | ' + eeatScore + '/6 điểm | ' + (eeatDetails.length > 0 ? '✓ Có: ' + eeatDetails.join(', ') : '✗ Thiếu các yếu tố E-E-A-T') + ' | Chuẩn: Author, dates, citations, about page';
                        
                    case 'breadcrumbs':
                        if (analysis.hasBreadcrumbSchema) {
                            return '✅ Tốt | Có Breadcrumb Schema | Giải thích: Breadcrumbs giúp Google hiểu cấu trúc site và hiển thị trong kết quả tìm kiếm';
                        } else if (analysis.hasBreadcrumbNav) {
                            return '⚠️ Có HTML nhưng thiếu Schema | Khuyến nghị: Thêm BreadcrumbList Schema | Mẹo: Schema giúp hiển thị breadcrumbs trong SERP';
                        } else {
                            return '❌ Chưa có | Khuyến nghị: Thêm breadcrumbs với Schema | Mẹo: Cải thiện UX và SEO';
                        }
                        
                    case 'hreflang':
                        const hreflangCount = analysis.hreflangTagsCount || 0;
                        let hreflangStatus = '';
                        if (hreflangCount >= 2 && analysis.hasXDefault) {
                            hreflangStatus = '✅ Tốt';
                        } else if (hreflangCount >= 2) {
                            hreflangStatus = '⚠️ Thiếu x-default';
                        } else if (hreflangCount === 1) {
                            hreflangStatus = '⚠️ Có thể chưa đầy đủ';
                        } else {
                            hreflangStatus = 'ℹ️ Không cần (single-language site)';
                        }
                        return hreflangStatus + ' | ' + hreflangCount + ' tags' + (analysis.hasXDefault ? ' (có x-default)' : '') + ' | Chuẩn: ≥2 tags + x-default cho multi-language | Mẹo: Quan trọng cho sites đa ngôn ngữ';
                        
                    case 'pagination':
                        if (analysis.hasPaginationNext || analysis.hasPaginationPrev) {
                            return '✅ Tốt | Có pagination (rel="next"/"prev") | Giải thích: Giúp Google hiểu cấu trúc multi-page content';
                        } else {
                            return 'ℹ️ Không cần (single-page content) | Khuyến nghị: Thêm rel="next"/"prev" nếu có multi-page | Mẹo: Quan trọng cho paginated content';
                        }
                        
                    case 'imageFileSize':
                        const imgSizeScore = breakdown.points || 0;
                        let imgSizeStatus = '';
                        if (imgSizeScore >= 2) {
                            imgSizeStatus = '✅ Tốt';
                        } else if (imgSizeScore >= 1) {
                            imgSizeStatus = '⚠️ Cần cải thiện';
                        } else {
                            imgSizeStatus = '❌ Kém';
                        }
                        const oversizedCount = analysis.oversizedImages || 0;
                        const modernFormatCount = analysis.imagesWithModernFormat || 0;
                        return imgSizeStatus + ' | ' + imgSizeScore + '/3 điểm | ' + 
                               (oversizedCount > 0 ? '⚠️ ' + oversizedCount + ' hình quá lớn (>2000px) | ' : '') +
                               (modernFormatCount > 0 ? '✓ ' + modernFormatCount + ' hình dùng WebP/AVIF | ' : '') +
                               'Chuẩn: <200KB (nhỏ), <500KB (trung), <1MB (lớn) | Mẹo: Nén hình và dùng WebP/AVIF';
                        
                    case 'pagespeed':
                        // This will be handled separately when PageSpeed data is loaded
                        return '⚡ Core Web Vitals | LCP, CLS, INP/FID | Đang phân tích...';
                        
                    default:
                        return breakdown && breakdown.status === 'good' ? '✅ Tốt' : '⚠️ Cần cải thiện';
                }
            } catch(e) {
                Debug.error('Error in getFactorDetail:', key, e);
                return 'N/A';
            }
        }
    };
    
    /**
     * Initialize all handlers
     */
    $(document).ready(function() {
        CalculatorHandler.init();
        BillSplitterHandler.init();
        TaxCalculatorHandler.init();
        SEOCheckerHandler.init();
        
        // Format bill amount input
        $('#bill-amount').on('input', function() {
            let value = $(this).val().replace(/\./g, '');
            if (value) {
                value = NumberFormatter.format(parseFloat(value));
                $(this).val(value);
            }
        });
    });
    
})(jQuery);

