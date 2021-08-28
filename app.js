const express = require('express');
const fs = require('fs');
const axios = require('axios').default;
var cors = require('cors')

const {getOptionChain, getOptionChainToken} = require('./nse_lib');
const nse_token = require('./nse_token');
const { saveData, getOIData } = require('./saveData');

const app = express();
const port = 5000;
app.use(express.static('public'))
app.use(cors());
const sql = require("./db.js");

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
    var currentTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }).split(',');
    var date = currentTime[0];
    var time = currentTime[1].trim();
    var hours = time.split(':')[0];
    try{
        // if(hours >= 9 && hours <= 4){
            const response = await getOptionChain('NIFTY');
            const newRow = [];
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
                    newRow.push([ceRow.strikePrice, ceRow.expiryDate, time, ceRow.openInterest, ceRow.changeinOpenInterest, ceRow.pchangeinOpenInterest, ceRow.totalTradedVolume, ceRow.impliedVolatility, ceRow.lastPrice, ceRow.change, ceRow.pChange, ceRow.totalBuyQuantity, ceRow.totalSellQuantity, peRow.openInterest, peRow.changeinOpenInterest, peRow.pchangeinOpenInterest, peRow.totalTradedVolume, peRow.impliedVolatility, peRow.lastPrice, peRow.change, peRow.pChange, peRow.totalBuyQuantity, peRow.totalSellQuantity, peRow.underlyingValue, date, ceaRow.trend, ceaRow.i, peaRow.trend, peaRow.i, ceaRow.OI, ceaRow.price, peaRow.OI, peaRow.price]);
                }
            });
            newRow && newRow.length > 0 && saveData(newRow);
        // }
    }catch(err){
        console.log(err,'errrior')
    }
},6000);

app.listen(process.env.PORT || 5000, () => console.log(`Example app listening on port ${port}!`))
