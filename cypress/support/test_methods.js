/// <reference types="cypress" />

'use strict';

import { PaylikeTestHelper } from './test_helper.js';

export var TestMethods = {

    /** Admin & frontend user credentials. */
    StoreUrl: (Cypress.env('ENV_ADMIN_URL').match(/^(?:http(?:s?):\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/im))[0],
    AdminUrl: Cypress.env('ENV_ADMIN_URL'),
    RemoteVersionLogUrl: Cypress.env('REMOTE_LOG_URL'),

    /** Construct some variables to be used bellow. */
    ShopName: 'drupalcommerce8',
    PaylikeName: 'paylike',
    ShopAdminUrl: '/commerce/config/currencies', // used for change currency
    CheckoutFlowsAdminUrl: '/commerce/config/checkout-flows/manage/default',
    OrdersPageAdminUrl: '/commerce/orders',
    ModulesAdminUrl: '/modules',

    /**
     * Login to admin backend account
     */
    loginIntoAdminBackend() {
        cy.loginIntoAccount('input[name=name]', 'input[name=pass]', 'admin');
    },

    /**
     * Modify Paylike settings
     * @param {String} captureMode
     */
    changePaylikeCaptureMode(captureMode) {
        /** Go to payment method page. */
        cy.goToPage(this.CheckoutFlowsAdminUrl);

        /** Edit config. */
        cy.get('input[id*="-payment-process-configuration-edit"]').click();

        /** Change capture mode & save. */
        if ('Instant' === captureMode) {
            cy.get('input[id*="-payment-process-configuration-capture-1"]').click();
        } else if ('Delayed' === captureMode) {
            cy.get('input[id*="-payment-process-configuration-capture-0"]').click();
        }

        cy.get('input[id*="-payment-process-configuration-actions-save"]').click();

        /** Wait the settings to update. */
        cy.wait(1000);

        /** Save. */
        cy.get('#edit-actions-submit').click();
    },

    /**
     * Make payment with specified currency and process order
     *
     * @param {String} currency
     * @param {String} paylikeAction
     * @param {Boolean} partialAmount
     */
     payWithSelectedCurrency(currency, paylikeAction, partialAmount = false) {
        /** Make an instant payment. */
        it(`makes a Paylike payment with "${currency}"`, () => {
            this.makePaymentFromFrontend(currency);
        });

        /** Process last order from admin panel. */
        it(`process (${paylikeAction}) an order from admin panel`, () => {
            this.processOrderFromAdmin(paylikeAction, partialAmount);
        });
    },

    /**
     * Make an instant payment
     * @param {String} currency
     */
    makePaymentFromFrontend(currency) {
        /** Go to store frontend. */
        cy.goToPage(this.StoreUrl);

        /** Add to cart specific product. */
        cy.get('.button--add-to-cart').first().click();

        /** Go to cart. */
        cy.get('.messages--status  a').click();

        /** Proceed to checkout. */
        cy.get('#edit-checkout').click();

        /** Fill in address fields. */
        // cy.get('input[id*=given-name--]').clear().type('John');
        // cy.get('input[id*=family-name--]').clear().type('Doe');
        // cy.get('input[id*=address-line1--]').clear().type('Street no 1');
        // cy.get('input[id*=postal-code--]').clear().type('000000');
        // cy.get('input[id*=locality--]').clear().type('City');

        /** Get & Verify amount. */
        cy.get('.order-total-line__total:nth-child(2)').then(($totalAmount) => {
            cy.window().then(win => {
                var expectedAmount = PaylikeTestHelper.filterAndGetAmountInMinor($totalAmount, currency);
                var orderTotalAmount = Number(win.drupalSettings.commercePaylike.config.amount.value);
                expect(expectedAmount).to.eq(orderTotalAmount);
            });
        });

        /** Show paylike popup. */
        cy.get('#edit-payment-information-add-payment-method-payment-details-paylike-button').click();

        /**
         * Fill in Paylike popup.
         */
         PaylikeTestHelper.fillAndSubmitPaylikePopup();

        cy.wait(500);

        /** Go to order confirmation. */
        cy.get('#edit-actions-next').click();

        /** Confirm order. */
        cy.get('#edit-actions-next').click();

        cy.get('h1.page-title').should('be.visible').contains('Complete');
    },

    /**
     * Process last order from admin panel
     * @param {String} paylikeAction
     * @param {Boolean} partialAmount
     */
    processOrderFromAdmin(paylikeAction, partialAmount = false) {
        /** Go to admin orders page. */
        cy.goToPage(this.OrdersPageAdminUrl);

        /** Click on first (latest in time) order from orders table. */
        cy.get('.view.dropbutton-action a').first().click();

        /**
         * Take specific action on order
         */
        this.paylikeActionOnOrderAmount(paylikeAction, partialAmount);
    },

    /**
     * Capture an order amount
     * @param {String} paylikeAction
     * @param {Boolean} partialAmount
     */
     paylikeActionOnOrderAmount(paylikeAction, partialAmount = false) {
        /** Select Payments tab. */
        cy.get('.tabs__tab').last().click();

        switch (paylikeAction) {
            case 'capture':
                /** Capture transaction. */
                cy.get('.capture a').click();
                if (partialAmount) {
                    cy.get('#edit-payment-amount-number').then($editAmountInput => {
                        var totalAmount = $editAmountInput.val();
                        /** Subtract 10 major units from amount. */
                        $editAmountInput.val(Math.round(totalAmount - 10));
                    });
                }
                cy.get('#edit-actions-submit').click();
                break;
            case 'refund':
                /** Refund transaction. */
                cy.get('.refund a').click();
                if (partialAmount) {
                    cy.get('#edit-payment-amount-number').then($editAmountInput => {
                        /**
                         * Put 15 major units to be refunded.
                         * Premise: any product must have price >= 15.
                         */
                        $editAmountInput.val(15);
                    });
                }
                cy.get('#edit-actions-submit').click();
                break;
            case 'void':
                /** The link is not visible, so extract it and go to void page. */
                cy.get('.void a').then(($voidLink) => {
                    cy.window().then($win => {
                        $win.location.pathname = $voidLink.attr('href')
                    });
                });
                /** Void transaction. */
                cy.get('#edit-actions-submit').click();
                break;
        }

        /** Check if success message. */
        cy.get('.messages.messages--status').should('be.visible');
    },

    /**
     * Change product currency
     */
    changeProductCurrency(currency) {
        it(`Change product currency to "${currency}"`, () => {
            /** Go to edit first product variation to edit. */
            // cy.goToPage(this.StoreUrl + '/product/1/variations');
            // cy.get('.edit a').click();
            cy.goToPage(this.StoreUrl + '/product/1/variations/1/edit');

            /** Select currency & save. */
            cy.get('#edit-price-0-currency-code').select(currency);
            cy.get('#edit-submit').click();
        });
    },

    /**
     * Get Shop & Paylike versions and send log data.
     */
    logVersions() {
        /** Go to Virtuemart config page. */
        cy.goToPage(this.ModulesAdminUrl);

        /** Get framework, shop and payment plugin version. */
        cy.document().then($doc => {
            var frameworkVersion = $doc.querySelectorAll('tr[data-drupal-selector*="edit-module"] .admin-requirements')[1].innerText
            var shopVersion = $doc.querySelectorAll('tr[data-drupal-selector="edit-modules-commerce"] .admin-requirements')[1].innerText
            var pluginVersion = $doc.querySelectorAll(`tr[data-drupal-selector*="commerce-${this.PaylikeName}"] .admin-requirements`)[1].innerText

            cy.wrap(frameworkVersion.replace('Version: ', '')).as('frameworkVersion');
            cy.wrap(shopVersion.replace('Version: ', '')).as('shopVersion');
            cy.wrap(pluginVersion.replace('Version: ', '')).as('pluginVersion');
        });

        /** Get global variables and make log data request to remote url. */
        cy.get('@frameworkVersion').then(frameworkVersion => {
            cy.get('@shopVersion').then(shopVersion => {
                cy.get('@pluginVersion').then(pluginVersion => {

                    cy.request('GET', this.RemoteVersionLogUrl, {
                        key: shopVersion,
                        tag: this.ShopName,
                        view: 'html',
                        framework: frameworkVersion,
                        ecommerce: shopVersion,
                        plugin: pluginVersion
                    }).then((resp) => {
                        expect(resp.status).to.eq(200);
                    });
                });
            });
        });
    },
}