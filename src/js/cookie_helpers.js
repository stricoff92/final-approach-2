
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
    const defaultExDays = 90;
    d.setTime(d.getTime() + ((exdays || defaultExDays) * 24 * 60 * 60 * 1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function deleteAllCookies() {
    // https://stackoverflow.com/questions/179355/clearing-all-cookies-with-javascript
    // will not delete cookies with HttpOnly flag set,
    console.log("deleting all cookies");
    let cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        let eqPos = cookie.indexOf("=");
        let name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}
