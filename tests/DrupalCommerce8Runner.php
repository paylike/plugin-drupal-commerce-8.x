<?php


namespace DrupalCommerce8;

use Facebook\WebDriver\Exception\NoAlertOpenException;
use Facebook\WebDriver\Exception\ElementNotVisibleException;
use Facebook\WebDriver\Exception\UnrecognizedExceptionException;
use Facebook\WebDriver\Exception\NoSuchElementException;
use Facebook\WebDriver\Exception\StaleElementReferenceException;
use Facebook\WebDriver\Exception\TimeOutException;
use Facebook\WebDriver\Exception\UnexpectedTagNameException;
use Facebook\WebDriver\Remote\RemoteWebElement;
use Facebook\WebDriver\WebDriverBy;
use Facebook\WebDriver\WebDriverDimension;
use Facebook\WebDriver\WebDriverExpectedCondition;

class DrupalCommerce8Runner extends DrupalCommerce8TestHelper
{

    /**
     * @param $args
     *
     * @throws NoSuchElementException
     * @throws TimeOutExceptionDrupalCommerce
     * @throws UnexpectedTagNameException
     */
    public function ready($args) {
        $this->set($args);
        $this->go();
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    public function loginAdmin() {
        $this->goToPage('/user/login', '#edit-name');

        while ( ! $this->hasValue('#edit-name', $this->user)) {
            $this->typeLogin();
        }
        $this->click('.form-submit');
        $this->waitForElement('.toolbar-menu');
    }

    /**
     *  Insert user and password on the login screen
     */
    private function typeLogin() {
        $this->type('#edit-name', $this->user);
        $this->type('#edit-pass', $this->pass);
    }

    /**
     * @param $args
     */
    private function set($args) {
        foreach ($args as $key => $val) {
            $name = $key;
            if (isset($this->{$name})) {
                $this->{$name} = $val;
            }
        }
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    public function changeCurrency() {
        $this->goToPage("product/1/variations", ".edit a");
        $this->click(".edit a");
        $this->waitforElementToBeClickeble(".form-type-commerce-price #edit-price-0-currency-code");
        $this->selectValue(".form-type-commerce-price #edit-price-0-currency-code", "$this->currency");
        $this->click("#edit-submit");
        $this->waitForElement(".messages--status");
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    public function changeMode() {
        $this->goToPage('commerce/config/checkout-flows', '.edit a', true);
        $this->click(".edit a");
        $this->click("#edit-configuration-panes-payment-process-configuration-edit");
        $this->waitforElementToBeClickeble(".form-item-configuration-panes-payment-process-configuration-capture");
        if ($this->capture_mode == "Delayed") {
            $this->click("//label[contains(text(), 'Authorize only (requires manual capture after checkout)')]");
        } else {
            $this->click("//label[contains(text(), 'Authorize and capture')]");
        }
        $this->captureMode();
    }


    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */

    private function logVersionsRemotly() {
        $versions = $this->getVersions();
        $this->wd->get(getenv('REMOTE_LOG_URL') . '&key=' . $this->get_slug($versions['ecommerce']) . '&tag=drupalcommerce8&view=html&' . http_build_query($versions));
        $this->waitForElement('#message');
        $message = $this->getText('#message');
        $this->main_test->assertEquals('Success!', $message, "Remote log failed");
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    private function getVersions() {
        $this->goToPage("modules", null, "true");
        $drupalcommerce = $this->wd->executeScript("
            return document.querySelectorAll('tr[data-drupal-selector=\"edit-modules-commerce\"]')[0].querySelectorAll('.admin-requirements')[1].innerText;
            "
        ); $paylike = $this->wd->executeScript("
           return document.querySelectorAll('tr[data-drupal-selector=\"edit-modules-commerce-paylike\"]')[0].querySelectorAll('.admin-requirements')[1].innerText;
            "
        );

        return ['ecommerce' => $drupalcommerce, 'plugin' => $paylike];

    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    private function outputVersions() {
        $this->goToPage('/index.php?controller=AdminDashboard', null, true);
        $this->main_test->log('Drupal Commerce 8 Version:', $this->getText('#shop_version'));
        $this->goToPage("/index.php?controller=AdminModules", null, true);
        $this->waitForElement("#filter_payments_gateways");
        $this->click("#filter_payments_gateways");
        $this->waitForElement("#anchorPaylikepayment");
        $this->main_test->log('Paylike Version:', $this->getText('.table #anchorPaylikepayment .module_name'));

    }

    public function submitAdmin() {
        $this->click('#module_form_submit_btn');
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     * @throws UnexpectedTagNameException
     */
    private function directPayment() {

        $this->changeCurrency();
        $this->goToPage('product/1', '.button--add-to-cart');
        $this->addToCart();
        $this->proceedToCheckout();
        $this->amountVerification();
        $this->finalPaylike();

        $this->selectOrder();
        if ($this->capture_mode == 'Delayed') {
            $this->capture();
        } else {
            $this->refund();
        }

    }


    /**
     * @param $status
     *
     * @throws NoSuchElementException
     * @throws UnexpectedTagNameException
     */


    public function moveOrderToStatus($status) {
        switch ($status) {
            case "Capture":
                $selector = ".dropbutton .capture";
                break;
            case "Refunded":
                $selector = ".dropbutton .refund";
                break;
        }
        $this->click(".dropbutton .dropbutton-arrow");
        $this->click($selector);
        $this->waitForElement(".form-wrapper #edit-payment-amount-number");
        $this->click("#edit-actions-submit");
        $this->waitForElement(".messages--status");
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     * @throws UnexpectedTagNameException
     */
    public function capture() {
        $this->moveOrderToStatus('Capture');
        $messages = $this->getText('.messages--status');
        $messages = str_replace("Status message", "", $messages);
        $messages = str_replace("\\n", "", $messages);
        $this->main_test->assertStringContainsString('Payment captured.', $messages, "Completed");
    }

    /**
     *
     */

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     * @throws UnrecognizedExceptionException
     */
    public function captureMode() {

        $this->click(".pane-configuration-edit-form .button--primary");
        $this->waitElementDisappear(".pane-configuration-edit-form .button--primary");
        $this->click("#edit-actions-submit");
        $this->waitforElement(".messages--status");

    }


    /**
     *
     */
    public function addToCart() {
        $this->click(".button--add-to-cart");
        $this->waitForElement(".messages--status a");

    }

    /**
     *
     */
    public function proceedToCheckout() {
        $this->click('.messages--status a');
        $this->waitForElement("#edit-checkout");
        $this->click("#edit-checkout");
        try {
            $this->waitForElement("#edit-payment-information-add-payment-method-payment-details-paylike-button");
            $this->click("#edit-payment-information-add-payment-method-payment-details-paylike-button");
        }catch (NoSuchElementException $element_exception){
            $this->click("//label[contains(text(), 'Credit card')]");
            $this->waitForElement("//input[@value='Enter credit card details']");
            $this->click("//input[@value='Enter credit card details']");
        }

    }

    /**
     *
     */
    public function amountVerification() {

        $amount         = $this->getText('.paylike .amount');
        $amount         = preg_replace("/[^0-9.]/", "", $amount);
        $amount         = trim($amount, '.');
        $amount         = ceil(round($amount, 4) * get_paylike_currency_multiplier($this->currency));
        $expectedAmount = $this->getText('.order-total-line-value');
        $expectedAmount = preg_replace("/[^0-9.]/", "", $expectedAmount);
        $expectedAmount = trim($expectedAmount, '.');
        $expectedAmount = ceil(round($expectedAmount, 4) * get_paylike_currency_multiplier($this->currency));
        $this->main_test->assertEquals($expectedAmount, $amount, "Checking minor amount for " . $this->currency);

    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    public function choosePaylike() {
        $this->waitForElement('#paylike-btn');
        $this->click('#paylike-btn');
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    public function finalPaylike() {
        $this->popupPaylike();
        $this->waitElementDisappear(".paylike.overlay ");
        $this->waitforElementToBeClickeble(".content #edit-actions-next");
        $this->click("#edit-actions-next");
        $completedValue = $this->getText(".page-title");
        // because the title of the page matches the checkout title, we need to use the order received class on body
        $this->main_test->assertEquals('Complete', $completedValue);
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    public function popupPaylike() {
        try {
            $this->type('.paylike.overlay .payment form #card-number', 41000000000000);
            $this->type('.paylike.overlay .payment form #card-expiry', '11/22');
            $this->type('.paylike.overlay .payment form #card-code', '122');
            $this->click('.paylike.overlay .payment form button');
        } catch (NoSuchElementException $exception) {
            $this->confirmOrder();
            $this->popupPaylike();
        }

    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    public function selectOrder() {
        $this->goToPage("commerce/orders", ".views-field-operations .edit ", true);
        $this->click(".edit a");
        $this->waitforElement(".tabs");
        $this->click(".tabs.primary  li:last-child");
        $this->waitForElement(".dropbutton-action");
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     * @throws UnexpectedTagNameException
     */
    public function refund() {
        $this->moveOrderToStatus('Refunded');
        $messages = $this->getText('.messages--status');
        $messages = str_replace("Status message", "", $messages);
        $this->main_test->assertStringContainsString('Payment refunded.', $messages, "Refunded");
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    public function confirmOrder() {
        $this->waitForElement('#paylike-payment-button');
        $this->click('#paylike-payment-button');
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    private function settings() {

        $this->changeMode();
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     * @throws UnexpectedTagNameException
     */
    private function go() {
        $this->changeWindow();
        $this->loginAdmin();

        if ($this->log_version) {
            $this->logVersionsRemotly();

            return $this;
        }

        $this->settings();
        $this->directPayment();

    }

    /**
     *
     */
    private function changeWindow() {
        $this->wd->manage()->window()->setSize(new WebDriverDimension(1600, 1024));
    }


}

