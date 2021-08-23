const sql = require("./db.js");
// MySQL 



// SQL 
const saveData = async(newRow) => {

    // var connection = mysql.createConnection({
    //     host: "localhost",  
    //     user: "root",  
    //     password: "toortoor",  
    //     database: "option_chain"
    // }); 
    // connection.connect();
    
    let addSql = "INSERT INTO nifty(strikePrice, expiryDate, time, ce_openInterest, ce_changeinOpenInterest, ce_pchangeinOpenInterest, ce_totalTradedVolume, ce_impliedVolatility, ce_lastPrice, ce_change, ce_pChange, ce_totalBuyQuantity, ce_totalSellQuantity, pe_openInterest, pe_changeinOpenInterest, pe_pchangeinOpenInterest, pe_totalTradedVolume, pe_impliedVolatility, pe_lastPrice, pe_change, pe_pChange, pe_totalBuyQuantity, pe_totalSellQuantity, nifty_val, Date, ce_trend, ce_status, pe_trend, pe_status, ce_OI, ce_price, pe_OI, pe_price) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    // let addSqlParams = ["14302", "17-Jun-2021", new Date().toLocaleTimeString(), 2855, 152, 5.623381428042915, 10389, 31.99, 1.35, -1.0499999999999998, -43.74999999999999, 276450, 58950, 4, 0, 0, 2, 0, 1516.05, 91.04999999999995, 6.389473684210523, 8175, 6675];
    try{    
        newRow && newRow.map((row) => {
            sql.query(addSql, row, function (err, res) {
                console.log(err,'error error');
                if (err) {
                    console.log(err);
                    return;
                } else {
                    console.log(res,'response response');
                console.log(res);
              }
            });
        });
    }catch(error){
        console.log(error,'error error')
    }
    // connection.end();
};

const getOIData = async(date, time) => {
    // var connection = mysql.createConnection({
    //     host: "localhost",  
    //     user: "root",  
    //     password: "toortoor",  
    //     database: "option_chain"
    // });
    // let result = "";    
    // let searchSql = `SELECT * FROM nifty WHERE date = '3:35:18 PM'`;
    // // let addSqlParams = ["14302", "17-Jun-2021", new Date().toLocaleTimeString(), 2855, 152, 5.623381428042915, 10389, 31.99, 1.35, -1.0499999999999998, -43.74999999999999, 276450, 58950, 4, 0, 0, 2, 0, 1516.05, 91.04999999999995, 6.389473684210523, 8175, 6675];
    // // try{
    // connection.query(searchSql, function (err, res) {
    //     console.log(err,'error error');
    //     if (err) {
    //         console.log(err);
    //         return;
    //     } else {
    //         console.log(res,'resresres')
    //         result = res;
    //     }
    // });
    // return result;
    sql.query("SELECT * FROM nifty WHERE date = '3:35:18 PM'", (err, res) => {
        if (err) {
          console.log("error: ", err);
          return err;
          return;
        }
    
        // console.log("created customer: ",res);
        return res;
      });
    console.log(result,'resultresult')
}

module.exports = {
    saveData,
    getOIData,
}

