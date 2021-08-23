const axios = require('axios')

let cookie;
let url_oc = "https://www.nseindia.com/option-chain"
let url = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY"
let headers = {
  'accept-language': 'en,gu;q=0.9,hi;q=0.8', 'accept-encoding': 'gzip, deflate, br',
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36",
  "authority": "www.nseindia.com",
  "scheme":"https",
  "Referer" : "https://www1.nseindia.com/products/content/equities/equities/archieve_eq.htm",
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

const getCookies = async () => {
    try {
      // const response = await instance.get(url_oc);
      const response = await axios.get(url_oc, headers);
      console.log(response,'response123')
      cookie = response.headers['set-cookie'];
      return response.headers['set-cookie'][1].split(';')[0];
    //   return response.headers['set-cookie'];
    } catch (error) {
      console.log(error,'new error')
      if (error.response.status === 403) {
        console.log("getCookies =========> error.status === 403");
        await getCookies()
      } else {
        console.log("getCookies =========> error");
      }
    }
  }

module.exports = getCookies;
