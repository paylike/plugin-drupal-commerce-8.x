(function ($, Drupal, drupalSettings) {

  Drupal.behaviors.commercePaylikeForm = {
    attach: function (context) {
      // Attach the code only once
      $('.paylike-button', context).once('commerce_paylike').each(function() {
        if (!drupalSettings.commercePaylike || !drupalSettings.commercePaylike.publicKey || drupalSettings.commercePaylike.publicKey === '') {
          $('#edit-payment-information').prepend('<div class="messages messages--error">' + Drupal.t('Configure Paylike payment gateway settings please') + '</div>');
          return;
        }

        function handleResponse(error, response) {
          if (error) {
            return console.log(error);
          }
          console.log(response);
          $('.paylike-button').val(Drupal.t('Change credit card details'));
          $('#paylike_transaction_id').val(response.transaction.id);
        }

        $(this).click(function (event) {
          event.preventDefault();
          var paylike = Paylike(drupalSettings.commercePaylike.publicKey),
            config = drupalSettings.commercePaylike.config;

          paylike.popup(config, handleResponse);
        });
      });
    }
  }

})(jQuery, Drupal, drupalSettings);
