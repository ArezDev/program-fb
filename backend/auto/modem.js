async function restartSinyal() {
    try {
        fetch("http://192.168.100.1/ajax", {
            "headers": {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "accept-language": "en-US,en;q=0.9,id;q=0.8",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "x-requested-with": "XMLHttpRequest",
                "cookie": "__session:mainifr:=http:",
                "Referer": "http://192.168.100.1/netsel.html"
            },
            "body": "{\"funcNo\":1005,\"net_mode\":\"1\"}",
            "method": "POST"
        }).then(async (ok)=>{
            if (ok.ok) {
                console.log("Reset 3G OK!");
                setTimeout(() => {
                    //Langsung 4G
                    console.log("Process... 4G");
                    fetch("http://192.168.100.1/ajax", {
                        "headers": {
                            "accept": "application/json, text/javascript, */*; q=0.01",
                            "accept-language": "en-US,en;q=0.9,id;q=0.8",
                            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                            "x-requested-with": "XMLHttpRequest",
                            "cookie": "__session:mainifr:=http:",
                            "Referer": "http://192.168.100.1/netsel.html"
                        },
                        "body": "{\"funcNo\":1005,\"net_mode\":\"2\"}",
                        "method": "POST"
                    });
                    console.log("Success restat sinyal modem..!");
                }, 5000);
            }
        });

    } catch (err) {
        console.error("Error switching net mode:", err.message);
    }
}

module.exports = { restartSinyal };