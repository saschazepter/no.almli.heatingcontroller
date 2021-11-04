'use strict';

const moment = require('../lib/moment-timezone-with-data');
const days = require('../lib/days');
const nordpool = require('../lib/nordpool');
const heating = require('../lib/heating');
const pricesLib = require('../lib/prices');

const testNordpool = async function ({ priceArea, currency, country, timeZone, date }) {
  try {
    days.setTimeZone(timeZone);

    const localTime = (date ? moment(date) : moment()).startOf('day');
    const atHome = true;
    const homeOverride = false;
    const heatingOptions = {
      workday: {
        startHour: 5,
        endHour: 22.5,
      },
      notWorkday: {
        startHour: 7,
        endHour: 23,
      },
      workHours: {
        startHour: 7,
        endHour: 14
      },
      country
    };
    const state = { atHome, homeOverride, heatingOptions };

    console.log('localTime:', localTime);

    const prices = await nordpool.fetchPrices(localTime, { priceArea, currency });
    console.log('prices:', prices.length, prices);

    const pricesNextHours = pricesLib.pricesStarting(prices, localTime, 0, 24);

    pricesNextHours
      .map(p => {
        p.heating = heating.calcHeating(p.startsAt, atHome, homeOverride, heatingOptions);
        p.lowPrice22Hours = pricesLib.checkLowPrice(pricesNextHours, 22, p.startsAt).length === 1;
        p.highPrice6Hours = pricesLib.checkHighPrice2(pricesNextHours, 6, p.startsAt, state).length === 1;
        return p;
      });
    console.log('pricesNextHours:', pricesNextHours.length, pricesNextHours);

    const heatingOffWithHighPrices = pricesLib.checkHighPrice2(pricesNextHours, 6, localTime, state, false);
    console.log('heatingOffWithHighPrices:', heatingOffWithHighPrices.length, heatingOffWithHighPrices);

  } catch (err) {
    console.log('Error:', err);
  }
}

module.exports = {
  testNordpool
};
