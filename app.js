const express = require('express');
const fs = require('fs');
const axios = require('axios').default;
// const axiosCookieJarSupport = require('axios-cookiejar-support').default;
// const tough = require('tough-cookie');
// const instance = axios.create({ withCredentials: true });
var cors = require('cors')

const {getOptionChain, getOptionChainToken} = require('./nse_lib');
const nse_token = require('./nse_token');
const { saveData, getOIData } = require('./saveData');
const https = require('https');
// const fetch = require('node-fetch');

const app = express();
const port = 5000;
app.use(express.static('public'))
app.use(cors());
const sql = require("./db.js");

// try{
//     axios.get('https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY', { timeout: 10000 }).then((data) => {
//         console.log(data,'data daataa')
//        })
//        .catch((err) => console.log(err,'error in catch'))
// }catch(ettot){
//     console.log(ettot,'ettotettot ettot')
// }


app.get('/', (req, res) => res.redirect('/index.html'));
app.get('/chain', async (req, res) => {
    try{
        console.log(req.rawHeaders,'req.rawHeaders')
        let resp = await option_chain('NIFTY', req.rawHeaders[3]); // can enter NIFTY / BANKNIFTY
        res.send(resp);
    }catch(err){
        res.status(500).send(err);
    }
});

app.get('/getData/:selectedTime/:selectedExpiry', async (req, res) => {
    const { selectedTime, selectedExpiry } = req.params;
    try{
        if(selectedTime){
            sql.query(`SELECT * FROM nifty WHERE time = "${selectedTime}" AND expiryDate = "${selectedExpiry}"`, (err, results) => {
                if (err) console.log(err,'errerrerrerr');
                if (err) throw err;
                res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
            });
        }
    }catch(err){
        res.status(500).send(err);
    }
});

app.get('/getAllsavedTimes', async (req, res) => {
    const { selectedDate } = req.query;
    try{
        sql.query(`SELECT DISTINCT time FROM nifty WHERE date  = "${selectedDate}"`, (err, results) => {
            if (err) throw err;
            res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
        });
    }catch(err){
        res.status(500).send(err);
    }
});

app.get('/getAllexpiries', async (req, res) => {
    try{
        sql.query(`SELECT DISTINCT expiryDate FROM nifty`, (err, results) => {
            if (err) throw err;
            res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
        });
    }catch(err){
        res.status(500).send(err);
    }
});

function optionChainAnalysis(strike) {
    if(strike && strike.CE && strike.PE){
        strike.CE.change = strike && strike.CE && strike.CE.change ? strike.CE.change.toFixed(1) : '';
        strike.PE.change = strike && strike.PE && strike.PE.change ? strike.PE.change.toFixed(1) : '';
    
        strike.PE.openInterest = String(strike.PE.openInterest).replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");
        strike.CE.openInterest = String(strike.CE.openInterest).replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");
        strike.PE.totalTradedVolume = String(strike.PE.totalTradedVolume).replace(/(\d)(?=(\d\d)+\d$)/g,
          "$1,");
        strike.CE.totalTradedVolume = String(strike.CE.totalTradedVolume).replace(/(\d)(?=(\d\d)+\d$)/g,
          "$1,");
    
        strike.CE_A = {};
        strike.PE_A = {};
    
        strike.CE_A.price = strike.CE.change > 0 ? 1 : 0;
        strike.CE_A.OI = strike.CE.changeinOpenInterest > 0 ? 1 : 0;
    
        strike.PE_A.price = strike.PE.change > 0 ? 1 : 0;
        strike.PE_A.OI = strike.PE.changeinOpenInterest > 0 ? 1 : 0;
    
        if (strike.CE_A.price === 0 && strike.CE_A.OI === 0) strike.CE_A.i = 'Long Liquidation';
        else if (strike.CE_A.price === 0 && strike.CE_A.OI === 1) strike.CE_A.i = 'Short Buildup';
        else if (strike.CE_A.price === 1 && strike.CE_A.OI === 1) strike.CE_A.i = 'Short Covering';
        else if (strike.CE_A.price === 1 && strike.CE_A.OI === 0) strike.CE_A.i = 'Long Buildup';
    
        if (strike.PE_A.price === 0 && strike.PE_A.OI === 0) strike.PE_A.i = 'Long Liquidation';
        else if (strike.PE_A.price === 0 && strike.PE_A.OI === 1) strike.PE_A.i = 'Short Buildup';
        else if (strike.PE_A.price === 1 && strike.PE_A.OI === 1) strike.PE_A.i = 'Short Covering';
        else if (strike.PE_A.price === 1 && strike.PE_A.OI === 0) strike.PE_A.i = 'Long Buildup';
    
        strike.PE_A.trend = (strike.PE_A.i == 'Long Liquidation' || strike.PE_A.i == 'Short Buildup') ?
          0 : 1;
        strike.CE_A.trend = (strike.CE_A.i == 'Long Liquidation' || strike.CE_A.i == 'Short Buildup') ?
          1 : 0;
    
        return strike;
    }
  }

setInterval(async() => {
    var currentTime = new Date();
    var currentOffset = currentTime.getTimezoneOffset();
    var ISTOffset = 330;   // IST offset UTC +5:30 
    var ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset)*60000);
    var hours = ISTTime.getHours();
    try{    
            // const response = axios.get('https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY', { headers: { 'set-cookie': "token" }}).then((data) => {
            //     console.log(data,'data daataa')
            //     response = data;
            //    })
            //    .catch((err) => console.log(err,'error in catch'))
            // const response = await axios.get('https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY', { headers: { 'set-cookie': "token" }});
            const response = await getOptionChain('NIFTY');
            const newRow = [];
            console.log(JSON.stringify(response),'responseresponse')
            let expiryDates = response.filtered.data.expiryDates;
            let underlyingValue = response.records.underlyingValue;
            selected_expiry = response.records.expiryDates[0];
            let option_chain = response && response.records.data.filter(c => {
                return (
                    c.strikePrice <= 800 + (parseInt(underlyingValue / 100) * 100)) &&
                  (c.strikePrice >= (parseInt(underlyingValue / 100) * 100) - 800)
                //   && c.expiryDate == expiryDate
              });
        
              option_chain = JSON.parse(JSON.stringify(option_chain)).map(optionChainAnalysis);
              option_chain.map((row) => {
                if(row){
                    const ceRow = row && row.CE;
                    const ceaRow = row && row.CE_A;
                    const peRow = row && row.PE;
                    const peaRow = row && row.PE_A;
                    newRow.push([ceRow.strikePrice, ceRow.expiryDate, new Date().toLocaleTimeString(), ceRow.openInterest, ceRow.changeinOpenInterest, ceRow.pchangeinOpenInterest, ceRow.totalTradedVolume, ceRow.impliedVolatility, ceRow.lastPrice, ceRow.change, ceRow.pChange, ceRow.totalBuyQuantity, ceRow.totalSellQuantity, peRow.openInterest, peRow.changeinOpenInterest, peRow.pchangeinOpenInterest, peRow.totalTradedVolume, peRow.impliedVolatility, peRow.lastPrice, peRow.change, peRow.pChange, peRow.totalBuyQuantity, peRow.totalSellQuantity, peRow.underlyingValue, new Date().toLocaleDateString(), ceaRow.trend, ceaRow.i, peaRow.trend, peaRow.i, ceaRow.OI, ceaRow.price, peaRow.OI, peaRow.price]);
                }
            });
            newRow && newRow.length > 0 && saveData(newRow);
        // }
    }catch(err){
        console.log(err,'errrior')
    }
},6000);

// setInterval(async() => {
//     try{
//         console.log('try');
//         // await axios.get('https://www.nseindia.com/',{withCredentials: true,// if user login
//         // timeout: 30000})
//         //     .then(res => {
//         //         console.log(res,'resresresresresresres')
//         //         return axios.get('https://www.nseindia.com/api/option-chain-indices?symbol=BANKNIFTY', {
//         //             headers: {
//         //                 cookie: res.headers['set-cookie'] // cookie is returned as a header
//         //             }
//         //         })
//         //     })
//         //     .then(res => console.log(res.data,'res.data'))
//         //     .catch(res => console.error(res,'res.response.data'))
// //         axiosCookieJarSupport(instance);
// // instance.defaults.jar = new tough.CookieJar();

// // instance.get('https://www.nseindia.com/')
// //     .then(res => instance.get('https://www.nseindia.com/api/option-chain-indices?symbol=BANKNIFTY'))
// //     .then(res => console.log(res.data))
// //     .catch(res => console.error(res.response.data))
//     let resp = await option_chain('NIFTY'); // can enter NIFTY / BANKNIFTY
//     console.log(resp,'resp resp');
//     // res.send(resp);
//     }catch(err){
//         console.log(err,'new error');
//     }
// },6000);

app.listen(process.env.PORT || 5000, () => console.log(`Example app listening on port ${port}!`))
