<?php

namespace DrupalCommerce8;


use Facebook\WebDriver\Exception\NoSuchElementException;
use Facebook\WebDriver\WebDriver;
use Facebook\WebDriver\WebDriverBy;
use Facebook\WebDriver\WebDriverExpectedCondition;
use Lmc\Steward\Test\AbstractTestCase;

/**
 * @group drupalcommerce8_quick_test
 */
class DrupalCommerce8QuickTest extends AbstractTestCase {

	public $runner;

	/**
	 * @throws NoSuchElementException
	 * @throws \Facebook\WebDriver\Exception\TimeOutException
	 * @throws \Facebook\WebDriver\Exception\UnexpectedTagNameException
	 */
	public function testUsdPaymentBeforeOrderInstant() {
		$this->runner = new DrupalCommerce8Runner( $this );
		$this->runner->ready( array(
				'capture_mode'           => 'Instant'
			)
		);
	}
}