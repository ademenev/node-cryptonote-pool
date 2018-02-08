"use strict";

var config = require('config');

let devDonationAddress = '45Jmf8PnJKziGyrLouJMeBFw2yVyX1QB52sKEQ4S1VSU2NVsaVGPNu4bWKkaHaeZ6tWCepP6iceZk8XhTLzDaEVa72QrtVh';

module.exports = {
    version : "v0.99.3.3",
    devDonationAddress : devDonationAddress,
    coreDevDonationAddress : '46BeWrHpwXmHDpDEUmZBWZfoQpdc6HaERCNmx1pEYL2rAcuwufPN9rXHHtyUA4QVy66qeFQkn6sfK8aHYjA3jk3o1Bv16em',
    doDonations : devDonationAddress[0] === config.poolServer.poolAddress[0] && (
        config.blockUnlocker.devDonation > 0 || config.blockUnlocker.coreDevDonation > 0
    )
};
