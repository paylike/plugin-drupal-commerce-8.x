/// <reference types="cypress" />

'use strict';

import { PaylikeTestHelper } from './test_helper.js';

export var TestMethods = {

    /** Admin & frontend user credentials. */
    StoreUrl: (Cypress.env('ENV_ADMIN_URL').match(/^(?:http(?:s?):\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/im))[0],
    AdminUrl: Cypress.env('ENV_ADMIN_URL'),
    RemoteVersionLogUrl: Cypress.env('REMOTE_LOG_URL'),

    /** Construct some variables to be used bellow. */
    ShopName: 'drupalcommerce7',
    PaylikeName: 'paylike',
    ShopAdminUrl: '/commerce/config/currency', // used for change currency
    PaymentMethodsAdminUrl: '/commerce/config/payment-methods',
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
        /** Go to payments page, and select Paylike. */
        cy.goToPage(this.PaymentMethodsAdminUrl);

        /** Select paylike & config its settings. */
        cy.get(`a[href*=${this.PaylikeName}]`).click();
        cy.get('.rules-element-label a').click();

        /** Change capture mode & save. */
        if ('Instant' === captureMode) {
            cy.get('input[id*=type-auth-capture]').click();
        } else if ('Delayed' === captureMode) {
            cy.get('input[id*=type-authorize]').click();
        }

        cy.get('#edit-submit').click();
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

        /** Add to cart random product. */
        var randomInt = PaylikeTestHelper.getRandomInt(/*max*/ 1);
        cy.get('.commerce-add-to-cart input[id*=edit-submit]').eq(randomInt).click();

        /** Go to cart. */
        cy.get('.status  a').click();

        /** Proceed to checkout. */
        cy.get('#edit-checkout').click();

        /** Fill in address fields. */
        cy.get('input[id*=name-line]').clear().type('John Doe');
        cy.get('input[id*=thoroughfare]').clear().type('Street no 1');
        cy.get('input[id*=locality]').clear().type('City');

        /** Next checkout step. */
        cy.get('.checkout-continue.form-submit').click();

        /** Choose Paylike. */
        cy.get(`.form-type-radio > input[id*=${this.PaylikeName}]`).click();

        /** Get & Verify amount. */
        cy.get('.commerce-price-formatted-components .component-total').then(($totalAmount) => {
            cy.window().then(win => {
                var expectedAmount = PaylikeTestHelper.filterAndGetAmountInMinor($totalAmount, currency);
                var orderTotalAmount = Number(win.Drupal.settings.commerce_paylike.config.amount.value);
                expect(expectedAmount).to.eq(orderTotalAmount);
            });
        });

        cy.wait(500);

        /** Show paylike popup. */
        cy.get('#edit-commerce-payment-payment-details-paylike-button').click();

        /**
         * Fill in Paylike popup.
         */
         PaylikeTestHelper.fillAndSubmitPaylikePopup();

        cy.wait(500);

        /** Go to order confirmation. */
        cy.get('#edit-continue').click();

        cy.get('h1#page-title').should('be.visible').contains('Checkout complete');
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
        cy.get('.commerce-order-payment a').first().click();

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
        switch (paylikeAction) {
            case 'capture':
                /** Capture transaction. */
                cy.get('.commerce-payment-transaction-capture a').click();
                if (partialAmount) {
                    cy.get('#edit-amount').then($editAmountInput => {
                        var totalAmount = $editAmountInput.val();
                        /** Subtract 10 major units from amount. */
                        $editAmountInput.val(Math.round(totalAmount - 10));
                    });
                }
                cy.get('#edit-submit').click();
                break;
            case 'refund':
                /** Refund transaction. */
                cy.get('.commerce-payment-transaction-refund a').click();
                if (partialAmount) {
                    cy.get('#edit-amount').then($editAmountInput => {
                        /**
                         * Put 15 major units to be refunded.
                         * Premise: any product must have price >= 15.
                         */
                        $editAmountInput.val(15);
                    });
                }
                cy.get('#edit-submit').click();
                break;
            case 'void':
                /** Void transaction. */
                cy.get('.commerce-payment-transaction-void a').click();
                cy.get('#edit-submit').click();
                break;
        }

        /** Check if success message. */
        cy.get('.views-row-last .views-field-message').should('contain', 'succeeded');
    },

    /**
     * Change shop currency from admin
     */
    changeShopCurrencyFromAdmin(currency) {
        it(`Change shop currency from admin to "${currency}"`, () => {
            /** Go to edit shop page. */
            cy.goToPage(this.ShopAdminUrl);

            /** Select currency & save. */
            cy.selectOptionContaining('#edit-commerce-default-currency', currency);
            cy.get('#edit-submit').click();
        });
    },

    /**
     * Get Shop & Paylike versions and send log data.
     */
    logVersions() {
        /** Go to Virtuemart config page. */
        cy.goToPage(this.ModulesAdminUrl);

        /** Get framework version. */
        cy.get('#edit-modules-core tbody tr').first().then($frameworkVersion => {
            var frameworkVersion = $frameworkVersion.children('td:nth-child(3)').text();
            cy.wrap(frameworkVersion).as('frameworkVersion');
        });

        /** Get shop version. */
        cy.get('label[for="edit-modules-commerce-commerce-enable"]').closest('tr').then($shopVersion => {
            var shopVersion = $shopVersion.children('td:nth-child(3)').text();
            cy.wrap(shopVersion).as('shopVersion');
        });

        /** Get paylike version. */
        cy.get('label[for="edit-modules-commerce-contrib-commerce-paylike-enable"]').closest('tr').then($paylikeVersion => {
            var paylikeVersion = $paylikeVersion.children('td:nth-child(3)').text();
            cy.wrap(paylikeVersion).as('paylikeVersion');
        });

        /** Get global variables and make log data request to remote url. */
        cy.get('@frameworkVersion').then(frameworkVersion => {
            cy.get('@shopVersion').then(shopVersion => {
                cy.get('@paylikeVersion').then(paylikeVersion => {

                    cy.request('GET', this.RemoteVersionLogUrl, {
                        key: shopVersion,
                        tag: this.ShopName,
                        view: 'html',
                        framework: frameworkVersion,
                        ecommerce: shopVersion,
                        plugin: paylikeVersion
                    }).then((resp) => {
                        expect(resp.status).to.eq(200);
                    });
                });
            });
        });
    },
}