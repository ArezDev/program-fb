const { set } = require("lodash");

// async function restartSinyal() {
//     try {
//         fetch("http://192.168.100.1/ajax", {
//             "headers": {
//                 "accept": "application/json, text/javascript, */*; q=0.01",
//                 "accept-language": "en-US,en;q=0.9,id;q=0.8",
//                 "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
//                 "x-requested-with": "XMLHttpRequest",
//                 "cookie": "__session:mainifr:=http:",
//                 "Referer": "http://192.168.100.1/netsel.html"
//             },
//             "body": "{\"funcNo\":1005,\"net_mode\":\"1\"}",
//             "method": "POST"
//         }).then(async (ok)=>{
//             if (ok.ok) {
//                 console.log("Reset 3G OK!");
//                 setTimeout(() => {
//                     //Langsung 4G
//                     console.log("Process... 4G");
//                     fetch("http://192.168.100.1/ajax", {
//                         "headers": {
//                             "accept": "application/json, text/javascript, */*; q=0.01",
//                             "accept-language": "en-US,en;q=0.9,id;q=0.8",
//                             "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
//                             "x-requested-with": "XMLHttpRequest",
//                             "cookie": "__session:mainifr:=http:",
//                             "Referer": "http://192.168.100.1/netsel.html"
//                         },
//                         "body": "{\"funcNo\":1005,\"net_mode\":\"2\"}",
//                         "method": "POST"
//                     });
//                     console.log("Success restat sinyal modem..!");
//                 }, 5000);
//             }
//         });

//     } catch (err) {
//         console.error("Error switching net mode:", err.message);
//     }
// }

async function restartSinyal() {
    try {
    console.log("Restarting modem...");
    //get sessionId
    fetch("http://192.168.100.1/himiapi/json", {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9",
            "authorization": "",
            "content-type": "application/json;charset=UTF-8"
        },
        "referrer": "http://192.168.100.1/",
        "body": "{\"cmdid\":\"login\",\"username\":\"admin\",\"password\":\"admin\",\"sessionId\":\"\"}",
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    }).then(async (response) => {
        if (response.ok) {
            const data = await response.json();
            //console.log("Session ID:", data.session);
            // Call the function to set network mode
            if (data && data.session) {
                console.log("Setting network mode to 3G...");
                setNetworkMode("2", data.session);
                setTimeout(() => {
                    setNetworkMode("1", data.session);
                }, 5000);
                console.log("Successfully restarted modem!");
            }
        }
    }).catch((error) => {
        console.error("Failed to get session ID:", error);
    });

    function setNetworkMode(mode, session) {
        fetch("http://192.168.100.1/himiapi/json", {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9",
                "authorization": session,
                "content-type": "application/json;charset=UTF-8"
            },
            "referrer": "http://192.168.100.1/",
            "body": `{\"cmdid\":\"setnetworkmode\",\"params\":{\"netmode\":\"${mode}\"},\"sessionId\":\"${session}\"}`,
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
            }).then(async(d)=>{
            console.log(await d.json());
        });
    }
        
    } catch (error) {
        console.error("Failed to restart modem:", error);
    }
}

module.exports = { restartSinyal };