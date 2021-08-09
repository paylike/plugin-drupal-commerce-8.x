# Drupal Commerce plugin for Paylike [![Build Status](https://travis-ci.org/paylike/plugin-drupal-commerce-8.x.svg?branch=master)](https://travis-ci.org/paylike/plugin-drupal-commerce-8.x)

This plugin is *not* developed or maintained by Paylike but kindly made
available by a user.

Released under the GPL V3 license: https://opensource.org/licenses/GPL-3.0

## Supported Drupal Commerce versions

[![Last succesfull test](https://log.derikon.ro/api/v1/log/read?tag=drupalcommerce8&view=svg&label=DrupalCommerce&key=ecommerce&background=00b4ff)](https://log.derikon.ro/api/v1/log/read?tag=drupalcommerce8&view=html)

    - Last tested with: commerce 8.2.26 & Drupal 8.9.17

*The plugin has been tested with most versions of Drupal Commerce at every iteration. We recommend using the latest version of Drupal Commerce, but if that is not possible for some reason, test the plugin with your Drupal Commerce version and it would probably function properly.*


## Installation

Once you have installed Drupal Commerce on your Drupal setup, follow these simple steps:
   1. Signup at [paylike.io](https://paylike.io) (it’s free)
   1. Create a live account
   1. Create an app key for your Drupal website
   1. Upload the ```paylike.zip``` contents to the modules directory and enable it on the `admin/modules page` OR run `composer require drupal/commerce_paylike`
   1. Add the payment gateway from `admin/commerce/config/payment-gateways` and select "Paylike" under the Plugin section
   1. Set transaction mode to either Auth+Capture or Auth only under "Payment process" on `admin/commerce/config/checkout-flows/manage/default
`


## Updating settings

Under the Paylike payment method settings, you can:
 * Update the payment method text in the payment gateways list
 * Update the payment method description in the payment gateways list
 * Update the title that shows up in the payment popup
 * Add test/live keys
 * Set payment mode (test/live)


 ## How to

 1. Capture
 * In Authorization+Capture mode, the orders are captured automatically
 * In Authorization only mode you can capture an order by using the Payments tab from an order. If available the capture operation will show up. (admin/commerce/orders/ORDER_ID/payments)
 2. Refund
   * You can refund an order by using the Payment tab from an order. If available the refund operation will show up. (admin/commerce/orders/ORDER_ID/payments)
 3. Void
   * You can void an order by using the Payment operations from an order. If available the void operation will show up. (admin/commerce/orders/ORDER_ID/payments)