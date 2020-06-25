<?php

namespace DrupalCommerce8;


use Facebook\WebDriver\Exception\NoSuchElementException;
use Facebook\WebDriver\Exception\TimeOutException;
use Facebook\WebDriver\Exception\UnexpectedTagNameException;
use Facebook\WebDriver\WebDriver;
use Facebook\WebDriver\WebDriverBy;
use Facebook\WebDriver\WebDriverExpectedCondition;
use Lmc\Steward\Test\AbstractTestCase;

/**
 * @group drupalcommerce8_version_log
 */
class DrupalCommerce8VersionLogTest extends AbstractTestCase {

	public $runner;

	/**
	 * This is used to store info on a centralized server regarding versions that the test worked on.
	 *
	 * @throws NoSuchElementException
	 * @throws TimeOutException
	 * @throws UnexpectedTagNameException
	 */
	public function testLogVersion() {
		$this->runner = new DrupalCommerce8Runner( $this );
		$this->runner->ready( array(
				'log_version' => true,
			)
		);
	}
}