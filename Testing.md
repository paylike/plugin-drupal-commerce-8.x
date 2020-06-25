#Testing

As you can see the plugin is bundled with selenium testing on this repository. You can use the tests, if you have some experience with testing it could be helpful. 
*DO NOT USE IN PRODUCTION, THE TESTS MODIFY SETTINGS AND CREATE ORDERS*

## Requirements

* A Drupal Commerce 8 installation is required, in which you need to have the sample theme installed. 
* You also need to have an admin account for which you set the credentials in the .env file
* Make sure all the tested currencies are enabled

## Getting started

1. Follow 1 and 2 from the [Steward readme page](https://github.com/lmc-eu/steward#getting-started)
2. Create an env file in the root folder and add the following:
`
ENVIRONMENT_URL="https://drupalcommerce8.url"
ENVIRONMENT_USER="username"
ENVIRONMENT_PASS="yourpassword"
ADMIN_PREFIX="admin"
`

3. Start the testing server. See
[Steward readme page](https://github.com/lmc-eu/steward#4-run-your-tests)
4. Run  ./vendor/bin/steward run staging chrome --group="drupalcommerce_test" -vv for the short test
5. Run  ./vendor/bin/steward run staging chrome -vv to go trough all the available tests.

## Problems

Since this is a frontend test, its not always consistent, due to delays or some glitches regarding overlapping elements. If you can't get over an issue please open an issue and I'll take a look. 