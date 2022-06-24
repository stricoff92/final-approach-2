
function getCookie(cname) {
    // https://www.w3schools.com/js/js_cookies.asp
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            const v = c.substring(name.length, c.length);
            console.log("found cookie " + cname + "=" + v);
            return v;
        }
    }
    console.log("could not find cookie " + cname);
    return null;
}

function setCookie(cname, cvalue, exdays) {
    // https://www.w3schools.com/js/js_cookies.asp
    if(!cname || !cvalue) {
        throw new Error("expected cname and cvalue params");
    }
    console.log("setting cookie " + cname + "=" + cvalue);
    const d = new Date();
    const defaultExDays = 180;
    d.setTime(d.getTime() + ((exdays || defaultExDays) * 24 * 60 * 60 * 1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
